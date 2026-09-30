/**
 * NextPixel — Centralized Ad Manager (ads-config.js)
 * Technology Sub-site
 * 
 * All ad slots are defined here. Toggle enabled/disabled per slot.
 * Supports: Google AdSense, Google AdX (via AdSense SDK), MGID
 */
(function() {
    'use strict';

    var AD_ENABLED_MASTER = true;

    var ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    var MGID_SITE_ID = 'XXXXXXXXX'; // TODO: Replace with Technology site MGID ID

    var SLOTS = {
        'native-top': {
            enabled: true,
            network: 'mgid',
            type: 'native',
            pages: ['index', 'category'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Header Native Ad'
        },
        'banner-mid-1': {
            enabled: true,
            network: 'mgid',
            type: 'banner',
            pages: ['index'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Mid Content Banner 1'
        },
        'banner-mid-2': {
            enabled: true,
            network: 'mgid',
            type: 'banner',
            pages: ['index'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Mid Content Banner 2'
        },
        'banner-bottom': {
            enabled: true,
            network: 'mgid',
            type: 'banner',
            pages: ['index', 'category'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Above Footer Banner'
        },
        'article-banner-top': {
            enabled: true,
            network: 'mgid',
            type: 'banner',
            pages: ['article'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Article Top Banner'
        },
        'article-banner-mid': {
            enabled: true,
            network: 'mgid',
            type: 'banner',
            pages: ['article'],
            adClient: ADSENSE_CLIENT,
            adSlot: 'XXXXXXXXXX',
            format: 'auto',
            label: 'Article Mid Banner'
        }
    };

    var MGID_WIDGETS = {
        'native-top': 'XXXXXXX',
        'banner-mid-1': 'XXXXXXX',
        'banner-mid-2': 'XXXXXXX',
        'banner-bottom': 'XXXXXXX',
        'article-banner-top': 'XXXXXXX',
        'article-banner-mid': 'XXXXXXX'
    };

    function getCurrentPage() {
        var path = location.pathname.split('/').pop() || 'index.html';
        if (path.indexOf('article') !== -1) return 'article';
        if (path.indexOf('category') !== -1) return 'category';
        return 'index';
    }

    var _sdkLoaded = false;
    function loadAdSenseSDK() {
        if (_sdkLoaded) return;
        if (ADSENSE_CLIENT.indexOf('XXXX') !== -1) return;
        _sdkLoaded = true;
        var sdk = document.createElement('script');
        sdk.async = true;
        sdk.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
        sdk.crossOrigin = 'anonymous';
        document.head.appendChild(sdk);
    }

    function renderAll() {
        var page = getCurrentPage();
        var containers = document.querySelectorAll('[data-ad-slot]');
        for (var i = 0; i < containers.length; i++) {
            var el = containers[i];
            var slotKey = el.getAttribute('data-ad-slot');
            var slot = SLOTS[slotKey];
            if (!slot) { el.style.display = 'none'; continue; }
            if (slot.pages.indexOf(page) === -1) { el.style.display = 'none'; continue; }
            if (!AD_ENABLED_MASTER || !slot.enabled) {
                el.style.display = 'none';
                el.setAttribute('data-ad-disabled', 'true');
                continue;
            }
            if (slot.network === 'adsense' || slot.network === 'adx') {
                renderAdSenseSlot(el, slot);
            }
        }
        renderMGIDWidgets(page);
    }

    function renderAdSenseSlot(el, slot) {
        if (el.getAttribute('data-ad-rendered') === 'true') return;
        el.setAttribute('data-ad-rendered', 'true');
        loadAdSenseSDK();
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.cssText = 'display:block';
        ins.setAttribute('data-ad-client', slot.adClient);
        ins.setAttribute('data-ad-slot', slot.adSlot);
        ins.setAttribute('data-ad-format', slot.format || 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        el.appendChild(ins);
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }

    function renderMGIDWidgets(page) {
        if (!MGID_SITE_ID || MGID_SITE_ID.indexOf('XXXX') !== -1) return;
        var hasWidgets = false;
        for (var id in MGID_WIDGETS) {
            if (!MGID_WIDGETS.hasOwnProperty(id) || !MGID_WIDGETS[id]) continue;
            hasWidgets = true; break;
        }
        if (!hasWidgets) return;

        if (!document.querySelector('script[src*="jsc.mgid.com"]')) {
            var s = document.createElement('script');
            s.src = 'https://jsc.mgid.com/site/' + MGID_SITE_ID + '.js';
            s.async = true;
            document.head.appendChild(s);
        }

        for (var slotId in MGID_WIDGETS) {
            if (!MGID_WIDGETS.hasOwnProperty(slotId) || !MGID_WIDGETS[slotId]) continue;
            var slot = SLOTS[slotId];
            if (!slot || !AD_ENABLED_MASTER || !slot.enabled) continue;
            if (slot.pages.indexOf(page) === -1) continue;

            var el = document.querySelector('[data-ad-slot="' + slotId + '"]');
            if (!el) continue;
            el.style.display = '';
            if (el.querySelector('[data-type="_mgwidget"]')) continue;

            var div = document.createElement('div');
            div.setAttribute('data-type', '_mgwidget');
            div.setAttribute('data-widget-id', MGID_WIDGETS[slotId]);
            el.appendChild(div);
        }
        try { (window._mgq = window._mgq || []).push(["_mgc.load"]); } catch(e) {}
    }

    function checkFill() {
        var containers = document.querySelectorAll('[data-ad-slot]');
        for (var i = 0; i < containers.length; i++) {
            var el = containers[i];
            if (el.getAttribute('data-ad-disabled') === 'true') continue;
            var iframe = el.querySelector('iframe');
            var ins = el.querySelector('ins.adsbygoogle');
            var hasSize = false;
            if (ins) { var rect = ins.getBoundingClientRect(); hasSize = rect.height > 10; }
            var hasMGID = el.querySelector('[data-type="_mgwidget"]');
            var mgidIframe = hasMGID ? hasMGID.querySelector('iframe') : null;

            if (iframe || hasSize || (hasMGID && mgidIframe)) {
                el.classList.add('ad-visible');
                el.classList.remove('ad-hidden');
                el.style.display = '';
            } else if (hasMGID && !mgidIframe) {
                el.style.display = '';
                try { (window._mgq = window._mgq || []).push(["_mgc.load"]); } catch(e) {}
            } else {
                el.style.display = 'none';
                el.classList.add('ad-hidden');
                el.classList.remove('ad-visible');
            }
        }
    }

    window.AdConfig = {
        toggle: function(slotId, enabled) {
            if (SLOTS[slotId]) {
                SLOTS[slotId].enabled = !!enabled;
                renderAll();
                setTimeout(checkFill, 2000);
            }
        },
        getStatus: function() {
            var status = {};
            for (var key in SLOTS) {
                if (!SLOTS.hasOwnProperty(key)) continue;
                status[key] = { enabled: SLOTS[key].enabled, network: SLOTS[key].network, type: SLOTS[key].type, pages: SLOTS[key].pages, label: SLOTS[key].label };
            }
            status._master = AD_ENABLED_MASTER;
            return status;
        },
        enableAll: function() { for (var key in SLOTS) { if (SLOTS.hasOwnProperty(key)) SLOTS[key].enabled = true; } renderAll(); setTimeout(checkFill, 2000); },
        disableAll: function() { for (var key in SLOTS) { if (SLOTS.hasOwnProperty(key)) SLOTS[key].enabled = false; } renderAll(); },
        renderAll: renderAll
    };

    function init() {
        renderAll();
        setTimeout(checkFill, 1500);
        setTimeout(checkFill, 4000);
        setTimeout(checkFill, 8000);
        setTimeout(checkFill, 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }

    console.log('[AdConfig] Technology site loaded. Master: ' + (AD_ENABLED_MASTER ? 'ON' : 'OFF'));
})();
