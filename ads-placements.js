(function (window) {
    "use strict";

    window.ADS_PLACEMENTS = Object.freeze({
        home: [
            { key: "home-banner-mid-1", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="banner-mid-1"]', label: "Home Mid Banner 1" },
            { key: "home-banner-mid-2", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="banner-mid-2"]', label: "Home Mid Banner 2" },
            { key: "home-banner-bottom", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="banner-bottom"]', label: "Home Bottom Banner" }
        ],
        article: [
            { key: "article-banner-top", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="article-banner-top"]', label: "Article Top Banner" },
            { key: "article-banner-mid", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="article-banner-mid"]', label: "Article Mid Banner" }
        ],
        category: [
            { key: "category-native-top", type: "native", enabled: true, network: "off", selector: '[data-ad-slot="native-top"]', label: "Category Native Top" },
            { key: "category-banner-bottom", type: "banner", enabled: true, network: "off", selector: '[data-ad-slot="banner-bottom"]', label: "Category Bottom Banner" }
        ]
    });
})(window);
