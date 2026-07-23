"use strict";
(function () {
    const ns = globalThis.YTLayoutCustomizer;
    if (globalThis.hasYTCustomizerLoaded) {
        ns.autoLoadConfigAndApply();
        return;
    }
    globalThis.hasYTCustomizerLoaded = true;
    chrome.runtime.onMessage.addListener((message) => {
        if (message?.action === 'OPEN_SETTINGS_MODAL') {
            ns.showOptionsDialog();
        }
    });
    ns.autoLoadConfigAndApply();
})();
