(function (window, document) {
    "use strict";

    if (window.__nextPixelAdsConfigInitialized) return;
    window.__nextPixelAdsConfigInitialized = true;

    var SETTINGS = {
        masterEnabled: true,

        // Replace these placeholders only when the real account IDs are available.
        adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
        mgidSiteId: "XXXXXXXXX",

        // Configure each placement independently.
        // Set network in ads-placements.js to "adsense", "mgid", or "off".
        placements: {
            "home-banner-mid-1": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "home-banner-mid-2": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "home-banner-bottom": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "article-banner-top": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "article-banner-mid": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "category-native-top": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            },
            "category-banner-bottom": {
                adsenseSlot: "XXXXXXXXXX",
                mgidWidgetId: "XXXXXXX"
            }
        }
    };

    var state = {
        enabled: SETTINGS.masterEnabled,
        page: "home",
        initialized: false,
        placements: {}
    };

    function currentPage() {
        var path = window.location.pathname.toLowerCase();

        if (path.indexOf("article.html") !== -1) return "article";
        if (path.indexOf("category.html") !== -1) return "category";

        return "home";
    }

    function isPlaceholder(value) {
        return !value || /X{3,}/i.test(String(value));
    }

    function getPlatformSettings(placement) {
        return SETTINGS.placements[placement.key] || {};
    }

    function setStatus(slot, status, disabled) {
        slot.setAttribute("data-ad-status", status);
        slot.setAttribute("data-ad-disabled", disabled ? "true" : "false");

        if (disabled) {
            slot.classList.add("ad-hidden");
            slot.classList.remove("ad-visible");
        }
    }

    function loadScriptOnce(id, src, callback) {
        var existing = document.getElementById(id);

        if (existing) {
            if (callback) callback();
            return;
        }

        var script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;

        if (callback) script.onload = callback;

        script.onerror = function () {
            document.querySelectorAll('[data-ad-status="loading"]').forEach(function (slot) {
                slot.setAttribute("data-ad-status", "load-error");
            });
        };

        document.head.appendChild(script);
    }

    function renderAdSense(slot, placement, config) {
        if (isPlaceholder(SETTINGS.adsenseClient) ||
            isPlaceholder(config.adsenseSlot)) {
            setStatus(slot, "unconfigured", true);
            return;
        }

        if (slot.querySelector("ins.adsbygoogle")) {
            setStatus(slot, "rendered", false);
            return;
        }

        var ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.style.width = "100%";
        ins.setAttribute("data-ad-client", SETTINGS.adsenseClient);
        ins.setAttribute("data-ad-slot", config.adsenseSlot);
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");

        slot.appendChild(ins);
        setStatus(slot, "loading", false);

        loadScriptOnce(
            "nextpixel-adsense-sdk",
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
                encodeURIComponent(SETTINGS.adsenseClient),
            function () {
                try {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    slot.setAttribute("data-ad-status", "requested");
                } catch (error) {
                    slot.setAttribute("data-ad-status", "render-error");
                }
            }
        );
    }

    function renderMGID(slot, placement, config) {
        if (isPlaceholder(SETTINGS.mgidSiteId) ||
            isPlaceholder(config.mgidWidgetId)) {
            setStatus(slot, "unconfigured", true);
            return;
        }

        if (slot.querySelector('[data-type="_mgwidget"]')) {
            setStatus(slot, "rendered", false);
            return;
        }

        var widget = document.createElement("div");
        widget.setAttribute("data-type", "_mgwidget");
        widget.setAttribute("data-widget-id", config.mgidWidgetId);
        slot.appendChild(widget);

        setStatus(slot, "loading", false);

        var scriptId = "nextpixel-mgid-" + SETTINGS.mgidSiteId;
        var scriptSrc = "https://jsc.mgid.com/site/" +
            encodeURIComponent(SETTINGS.mgidSiteId) + ".js";

        loadScriptOnce(scriptId, scriptSrc, function () {
            try {
                window._mgq = window._mgq || [];
                window._mgq.push(["_mgc.load"]);
                slot.setAttribute("data-ad-status", "requested");
            } catch (error) {
                slot.setAttribute("data-ad-status", "render-error");
            }
        });
    }

    function renderAll() {
        state.page = currentPage();

        var pagePlacements = window.ADS_PLACEMENTS &&
            window.ADS_PLACEMENTS[state.page];

        if (!Array.isArray(pagePlacements)) return;

        pagePlacements.forEach(function (placement) {
            var slot = document.querySelector(placement.selector);
            if (!slot) return;

            slot.setAttribute("data-ad-placement", placement.key);
            state.placements[placement.key] = {
                network: placement.network,
                status: "pending"
            };

            if (!state.enabled || !placement.enabled ||
                placement.network === "off") {
                setStatus(slot, "disabled", true);
                state.placements[placement.key].status = "disabled";
                return;
            }

            var config = getPlatformSettings(placement);

            if (placement.network === "adsense") {
                renderAdSense(slot, placement, config);
            } else if (placement.network === "mgid") {
                renderMGID(slot, placement, config);
            } else {
                setStatus(slot, "invalid-network", true);
            }

            state.placements[placement.key].status =
                slot.getAttribute("data-ad-status");
        });

        state.initialized = true;
    }

    function setEnabled(enabled) {
        state.enabled = Boolean(enabled);

        if (state.enabled) {
            renderAll();
        } else {
            document.querySelectorAll("div[data-ad-slot]").forEach(function (slot) {
                setStatus(slot, "disabled", true);
            });
        }

        return state.enabled;
    }

    window.AdConfig = {
        renderAll: renderAll,
        enableAll: function () { return setEnabled(true); },
        disableAll: function () { return setEnabled(false); },
        toggle: function () { return setEnabled(!state.enabled); },
        getStatus: function () {
            return {
                enabled: state.enabled,
                page: state.page,
                initialized: state.initialized,
                placements: state.placements
            };
        }
    };

    function init() {
        renderAll();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})(window, document);
