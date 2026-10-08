/**
 * NextPixel — Site Configuration
 * Matrix-ready: change SITE_CONFIG to deploy a new vertical subsite.
 *
 * Shared template files (index.html, article.html, style.css) read this config.
 * To launch a new subsite, copy the template directory and modify only this file.
 */
var SITE_CONFIG = {
    /* === Site Identity === */
    siteName: 'Technology',
    fullSiteName: 'NextPixel',
    tagline: 'Technology Insights for the Digital World',
    aboutText: 'Editorial-grade coverage of AI, software, cybersecurity, gadgets and emerging technology.',

    /* === Domain & URLs === */
    baseUrl: 'https://nextpixel.site',
    mainSiteUrl: 'https://nextpixel.site',
    siblingSites: [],

    /* === Data Files === */
    jsonFile: 'technology-index.json',
    fullArticleJson: 'articles-technology.json',
    opinionJson: 'opinions.json',

    /* === Fallbacks === */
    fallbackImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&fm=webp&q=80',

    /* === Analytics (set per subsite) === */
    gaId: '',

    /* === SEO === */
    titleSuffix: 'Technology Insights on AI, Software, Cybersecurity & Gadgets | NextPixel',
    metaDesc: 'Editorial coverage of AI, software, cybersecurity, gadgets, developer tools and emerging technology from NextPixel.',

    /* === Hero / Editorial === */
    heroIntro: '<p>NextPixel covers the technologies reshaping how we work, build, and live &mdash; with reporting that cuts through vendor hype.</p><p>Our editors track artificial intelligence, software, cybersecurity, hardware, and the infrastructure behind modern computing. We focus on what changes, what it costs, and who it actually affects.</p>',

    /* === Subcategories === */
    subcategories: [
        { id: 'ai', name: 'Artificial Intelligence', desc: 'AI models, products, enterprise adoption, safety and the business of intelligent systems.' },
        { id: 'software', name: 'Software & Apps', desc: 'Cloud platforms, productivity tools, developer software and the SaaS economy.' },
        { id: 'cybersecurity', name: 'Cybersecurity', desc: 'Threats, defenses, regulation and the evolving security landscape.' },
        { id: 'gadgets', name: 'Gadgets', desc: 'Consumer hardware, wearables, smart home devices and the products people actually use.' },
        { id: 'developer', name: 'Developer Technology', desc: 'Infrastructure, edge computing, 5G and the tools builders rely on.' },
        { id: 'future-tech', name: 'Future Technology', desc: 'Quantum computing, robotics, blockchain and emerging research.' }
    ]
};
