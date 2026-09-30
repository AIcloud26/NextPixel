/* ads.js - Shared ad initialization for NextPixel Technology */
(function(){
    var style=document.createElement('style');
    style.textContent='div[data-ad-slot]{height:0;overflow:hidden;transition:height .3s ease}';
    document.head.appendChild(style);
    function initAds(){
        document.querySelectorAll('div[data-ad-slot]').forEach(function(s){
            if(s.dataset.adInit)return;
            s.dataset.adInit='1';
            new MutationObserver(function(){
                if(s.querySelector('iframe')){
                    s.style.height='auto';
                    s.style.overflow='visible';
                }
            }).observe(s,{childList:true,subtree:true});
        });
        document.querySelectorAll('ins.adsbygoogle:not([data-pushed])').forEach(function(ins){
            ins.setAttribute('data-pushed','1');
            (adsbygoogle=window.adsbygoogle||[]).push({});
        });
    }
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',initAds);
    }else{
        initAds();
    }
})();
