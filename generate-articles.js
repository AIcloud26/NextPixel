const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();
const INDEX_FILE = path.join(ROOT, "technology-index.json");
const BODY_FILE = path.join(ROOT, "articles-technology.json");
const DRAFT_DIR = path.join(ROOT, "drafts");

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TOPIC = (process.env.ARTICLE_TOPIC || "").trim();
const MODE = (process.env.ARTICLE_MODE || "auto").toLowerCase();

const CATEGORIES = [
  { id: "ai", name: "Artificial Intelligence" },
  { id: "software", name: "Software & Apps" },
  { id: "cybersecurity", name: "Cybersecurity" },
  { id: "gadgets", name: "Gadgets" },
  { id: "developer", name: "Developer Technology" },
  { id: "future-tech", name: "Future Technology" }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, file);
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `${key}=${String(value).replace(/[\r\n]/g, " ")}\n`
    );
  }
}

function cleanText(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html) {
  return cleanText(html).split(/\s+/).filter(Boolean).length;
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const aa = new Set(normalize(a).split(" ").filter(w => w.length > 3));
  const bb = new Set(normalize(b).split(" ").filter(w => w.length > 3));
  if (!aa.size || !bb.size) return 0;
  let common = 0;
  for (const w of aa) if (bb.has(w)) common++;
  return common / (aa.size + bb.size - common);
}

function slugify(text) {
  return normalize(text).replace(/\s+/g, "-").replace(/^-|-$/g, "");
}

async function apiJson(prompt, system) {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      }),
      signal: AbortSignal.timeout(120000)
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API HTTP ${response.status}: ${raw.slice(0, 700)}`);
  }

  const result = JSON.parse(raw);
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("API 返回内容为空");
  return JSON.parse(content);
}

async function checkSource(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) return false;

    const response = await fetch(parsed, {
      method: "GET",
      headers: { "User-Agent": "NextPixelEditorialBot/1.0" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow"
    });

    await response.body?.cancel();
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

function makeDraft(reason, article = null) {
  fs.mkdirSync(DRAFT_DIR, { recursive: true });
  const name = `draft-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const file = path.join(DRAFT_DIR, name);
  saveJson(file, {
    createdAt: new Date().toISOString(),
    status: "needs_human_review",
    reason,
    topic: TOPIC || null,
    article
  });
  writeOutput("article_status", "rejected");
  console.log(`草稿已保存：${path.relative(ROOT, file)}`);
}

async function main() {
  if (!API_KEY) throw new Error("未配置 OPENAI_API_KEY");
  if (!["auto", "manual"].includes(MODE)) throw new Error("ARTICLE_MODE 必须是 auto 或 manual");
  if (MODE === "manual" && !TOPIC) throw new Error("人工选题模式必须提供 ARTICLE_TOPIC");

  const index = readJson(INDEX_FILE);
  const body = readJson(BODY_FILE);

  if (!Array.isArray(index.articles) || !Array.isArray(body.articles)) {
    throw new Error("文章 JSON 结构不正确");
  }

  const indexIds = new Set(index.articles.map(a => String(a.id)));
  const bodyIds = new Set(body.articles.map(a => String(a.id)));

  if (indexIds.size !== index.articles.length ||
      bodyIds.size !== body.articles.length ||
      indexIds.size !== bodyIds.size ||
      [...indexIds].some(id => !bodyIds.has(id))) {
    throw new Error("发布前检查失败：现有索引与正文 ID 不一致");
  }

  const existingTitles = index.articles.map(a => a.title);
  const recentTitles = index.articles.slice(0, 40).map(a => a.title);
  const categoriesText = CATEGORIES.map(c => `${c.id}: ${c.name}`).join("\n");

  const generated = await apiJson(
    JSON.stringify({
      mode: MODE,
      requestedTopic: TOPIC || null,
      existingRecentTitles: recentTitles,
      allowedCategories: categoriesText,
      requirements: [
        "Write a useful, original English technology article for a general international audience.",
        "Aim for 800-1200 English words.",
        "Do not invent personal testing, interviews, quotes, statistics, or first-hand experience.",
        "Do not fabricate sources. Use at least two credible HTTPS source URLs.",
        "The article must be substantive, specific, balanced, and not a generic template.",
        "Use safe HTML content with paragraphs, headings, lists, and links as appropriate.",
        "Include source links visibly in the article content.",
        "If manual mode is used, follow the requested topic and do not silently replace it.",
        "Return valid JSON with title, category, subcategory, excerpt, content, sourceUrls."
      ]
    }),
    "You are the lead editor of NextPixel. Produce accurate, restrained editorial content. Return JSON only."
  );

  const article = {
    title: String(generated.title || "").trim(),
    category: String(generated.category || "").trim(),
    subcategory: String(generated.subcategory || "").trim(),
    excerpt: String(generated.excerpt || "").trim(),
    content: String(generated.content || "").trim(),
    sourceUrls: Array.isArray(generated.sourceUrls) ? generated.sourceUrls : []
  };

  const errors = [];
  const category = CATEGORIES.find(c =>
    c.id === article.subcategory &&
    c.name.toLowerCase() === article.category.toLowerCase()
  );

  if (!article.title || article.title.length < 20) errors.push("标题缺失或过短");
  if (!category) errors.push("分类或子分类不在允许列表中");
  if (article.excerpt.length < 40 || article.excerpt.length > 260) errors.push("摘要长度不合格");
  if (wordCount(article.content) < 800 || wordCount(article.content) > 1500) {
    errors.push(`正文单词数不合格：${wordCount(article.content)}`);
  }
  if (/<script\b|<iframe\b|javascript:/i.test(article.content)) {
    errors.push("正文含有不允许的 HTML 或脚本");
  }
  if (/I tested|I personally tested|in my hands-on test|our lab test/i.test(article.content)) {
    errors.push("正文包含未经证实的亲测声明");
  }

  const sourceUrls = [...new Set(article.sourceUrls)];
  const contentUrls = [...article.content.matchAll(/href=["'](https:\/\/[^"'#\s]+)["']/gi)]
    .map(m => m[1]);

  if (sourceUrls.length < 2) errors.push("来源列表少于两个不同链接");
  if (contentUrls.length < 2) errors.push("正文中可识别的 HTTPS 来源链接少于两个");
  if (sourceUrls.some(url => !contentUrls.includes(url))) {
    errors.push("来源列表中的链接未全部出现在正文");
  }

  const duplicate = index.articles.find(a =>
    similarity(a.title, article.title) >= 0.72
  );
  if (duplicate) errors.push(`标题疑似重复：${duplicate.title}`);

  if (errors.length) {
    makeDraft(errors.join("；"), article);
    return;
  }

  const sourceResults = await Promise.all(sourceUrls.map(checkSource));
  if (sourceResults.some(ok => !ok)) {
    makeDraft("至少一个来源链接无法通过可访问性检查；需要人工核实", article);
    return;
  }

  const review = await apiJson(
    JSON.stringify({
      article,
      checks: [
        "Check whether the article follows the requested topic.",
        "Identify unsupported factual claims, fabricated quotations, or fabricated personal testing.",
        "Check for misleading statements, generic filler, and repeated paragraphs.",
        "Check whether source links appear relevant to the claims.",
        "Return JSON with approved (boolean) and reasons (array of strings).",
        "If uncertain, set approved to false."
      ]
    }),
    "You are an independent, strict fact-checking editor. Do not assume claims are true just because the draft says so. Return JSON only."
  );

  if (review.approved !== true) {
    makeDraft(
      `独立审核未通过：${(review.reasons || ["未提供原因"]).join("；")}`,
      article
    );
    return;
  }

  for (const a of index.articles) {
    if (similarity(a.title, article.title) >= 0.72) {
      makeDraft("写入前再次检查发现标题重复", article);
      return;
    }
  }

  const maxId = Math.max(...index.articles.map(a => Number(a.id) || 0));
  const id = maxId + 1;
  let slug = slugify(article.title);
  const slugs = new Set(index.articles.map(a => a.slug));
  if (!slug || slugs.has(slug)) slug = `${slug}-${id}`;

  const imageCandidates = index.articles
    .filter(a => a.subcategory === article.subcategory && /^https:\/\//i.test(a.image || ""))
    .map(a => a.image);
  const allImages = index.articles
    .filter(a => /^https:\/\//i.test(a.image || ""))
    .map(a => a.image);
  const images = imageCandidates.length ? imageCandidates : allImages;
  const image = images.length ? images[id % images.length] : "";

  if (!image) {
    makeDraft("找不到可复用的 HTTPS 图片地址", article);
    return;
  }

  const newMeta = {
    id,
    slug,
    title: article.title,
    category: category.name,
    subcategory: category.id,
    date: new Date().toISOString().slice(0, 10),
    image,
    excerpt: article.excerpt,
    featured: false
  };
  const newBody = { id, content: article.content };

  const oldIndex = fs.readFileSync(INDEX_FILE);
  const oldBody = fs.readFileSync(BODY_FILE);
  const suffix = new Date().toISOString().replace(/[:.]/g, "-");

  fs.writeFileSync(`${INDEX_FILE}.backup-${suffix}`, oldIndex);
  fs.writeFileSync(`${BODY_FILE}.backup-${suffix}`, oldBody);

  try {
    index.articles.push(newMeta);
    body.articles.push(newBody);

    saveJson(INDEX_FILE, index);
    saveJson(BODY_FILE, body);

    const verifyIndex = readJson(INDEX_FILE);
    const verifyBody = readJson(BODY_FILE);
    const newIndexIds = new Set(verifyIndex.articles.map(a => String(a.id)));
    const newBodyIds = new Set(verifyBody.articles.map(a => String(a.id)));

    if (newIndexIds.size !== newBodyIds.size ||
        [...newIndexIds].some(x => !newBodyIds.has(x))) {
      throw new Error("写入后验证失败：索引和正文 ID 不一致");
    }

    writeOutput("article_status", "approved");
    writeOutput("article_id", id);
    console.log(`审核通过，已加入正式数据：${id} - ${article.title}`);
  } catch (error) {
    fs.writeFileSync(INDEX_FILE, oldIndex);
    fs.writeFileSync(BODY_FILE, oldBody);
    makeDraft(`正式数据写入失败，已恢复原文件：${error.message}`, article);
  }
}

main().catch(error => {
  console.error(error.message);
  try {
    makeDraft(`自动任务异常：${error.message}`);
  } catch (draftError) {
    console.error(`草稿保存失败：${draftError.message}`);
    writeOutput("article_status", "rejected");
  }
});
