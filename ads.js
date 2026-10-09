(function (window, document) {
    "use strict";

    if (window.__nextPixelAdLayoutInitialized) return;
    window.__nextPixelAdLayoutInitialized = true;

    var style = document.createElement("style");
    style.setAttribute("data-nextpixel-ad-layout", "true");
    style.textContent =
        'div[data-ad-slot]{height:0;overflow:hidden;transition:height .3s ease}' +
        'div[data-ad-slot].ad-visible{height:auto;overflow:visible}' +
        'div[data-ad-slot].ad-hidden{height:0;overflow:hidden}';
    document.head.appendChild(style);

    function isFilled(slot) {
        if (slot.querySelector("iframe")) return true;

        var ins = slot.querySelector("ins.adsbygoogle");
        if (ins && ins.getBoundingClientRect().height > 10) return true;

        var mgidWidget = slot.querySelector('[data-type="_mgwidget"]');
        if (mgidWidget && mgidWidget.querySelector("iframe")) return true;

        return false;
    }

    function refreshSlot(slot) {
        if (!slot) return;

        if (slot.getAttribute("data-ad-disabled") === "true") {
            slot.style.height = "0";
            slot.style.overflow = "hidden";
            slot.classList.add("ad-hidden");
            slot.classList.remove("ad-visible");
            return;
        }

        if (isFilled(slot)) {
            slot.style.height = "auto";
            slot.style.overflow = "visible";
            slot.classList.add("ad-visible");
            slot.classList.remove("ad-hidden");
            slot.setAttribute("data-ad-status", "filled");
        }
    }

    function init() {
        document.querySelectorAll("div[data-ad-slot]").forEach(function (slot) {
            if (slot.getAttribute("data-ad-layout-init") === "true") return;

            slot.setAttribute("data-ad-layout-init", "true");

            var observer = new MutationObserver(function () {
                refreshSlot(slot);
            });

            observer.observe(slot, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["data-ad-disabled", "data-ad-status"]
            });

            slot.addEventListener("load", function () {
                refreshSlot(slot);
            }, true);

            refreshSlot(slot);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})(window, document);
