(function () {
    "use strict";

    var config = window.NEXTPixelGA4Config;
    if (!config || !config.measurementId) return;
    if (window.location.hostname.toLowerCase() !== config.allowedHostname) return;
    if (!/^G-[A-Z0-9]+$/.test(config.measurementId)) return;
    if (window.__nextpixelGA4Initialized) return;

    window.__nextpixelGA4Initialized = true;
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments);
    }

    window.gtag = window.gtag || gtag;
    window.gtag("js", new Date());
    window.gtag("config", config.measurementId);

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" +
        encodeURIComponent(config.measurementId);
    document.head.appendChild(script);
})();
