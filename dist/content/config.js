"use strict";
/// <reference types="chrome" />
(function () {
    // Default configuration used when no stored settings exist
    const DEFAULT_CONFIG = {
        mode: 'manual',
        videosPerRow: 5,
        shortsPerRow: 6,
        sidebarWidth: '280px',
        adaptiveBreakpoints: [
            { maxWidth: 900, videosPerRow: 4, shortsPerRow: 5, sidebarWidth: '260px' },
            { maxWidth: 1400, videosPerRow: 5, shortsPerRow: 6, sidebarWidth: '280px' },
            { maxWidth: Infinity, videosPerRow: 6, shortsPerRow: 7, sidebarWidth: '320px' }
        ]
    };
    let currentConfig = null;
    function loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['layoutConfig'], (result) => {
                const stored = (result.layoutConfig ?? {});
                const config = {
                    ...DEFAULT_CONFIG,
                    ...stored,
                    adaptiveBreakpoints: stored.adaptiveBreakpoints ?? DEFAULT_CONFIG.adaptiveBreakpoints
                };
                currentConfig = config;
                resolve(config);
            });
        });
    }
    function saveConfig(config) {
        currentConfig = config;
        return new Promise((resolve) => {
            chrome.storage.local.set({ layoutConfig: config }, () => resolve());
        });
    }
    function getCurrentConfig() {
        return currentConfig;
    }
    function resetSettings() {
        chrome.storage.local.remove('layoutConfig', () => {
            const styleTag = document.getElementById('yt-layout-customizer-styles');
            if (styleTag)
                styleTag.remove();
            globalThis.location.reload();
        });
    }
    // HTML escaping for embedding JSON into innerHTML safely
    function escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    }
    // Convert breakpoints to a JSON string friendly for user editing
    function serializeBreakpoints(breakpoints) {
        return JSON.stringify(breakpoints.map((bp) => ({
            ...bp,
            maxWidth: bp.maxWidth === Infinity ? 'Infinity' : bp.maxWidth
        })), null, 2);
    }
    // Parse and validate user-edited JSON breakpoints
    function parseBreakpoints(text) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Breakpoints must be a non-empty array.');
        }
        return parsed
            .map((bp) => {
            const maxWidthRaw = bp.maxWidth;
            let maxWidth;
            if (maxWidthRaw === 'Infinity') {
                maxWidth = Infinity;
            }
            else {
                maxWidth = Number(maxWidthRaw);
            }
            const videosPerRow = Number(bp.videosPerRow);
            const shortsPerRow = Number(bp.shortsPerRow);
            const sidebarWidth = String(bp.sidebarWidth ?? '');
            if (!Number.isFinite(maxWidth) && maxWidth !== Infinity) {
                throw new Error('Each breakpoint needs a valid maxWidth.');
            }
            if (!Number.isInteger(videosPerRow) || videosPerRow < 1) {
                throw new Error('Each breakpoint needs a valid videosPerRow.');
            }
            if (!Number.isInteger(shortsPerRow) || shortsPerRow < 1) {
                throw new Error('Each breakpoint needs a valid shortsPerRow.');
            }
            if (!sidebarWidth.trim()) {
                throw new Error('Each breakpoint needs a sidebarWidth.');
            }
            return {
                maxWidth,
                videosPerRow,
                shortsPerRow,
                sidebarWidth
            };
        })
            .sort((a, b) => a.maxWidth - b.maxWidth);
    }
    function addInputEnterKeyHandler(input, onSubmit) {
        input.addEventListener('keydown', (event) => {
            const keyboardEvent = event;
            if (keyboardEvent.key === 'Enter') {
                keyboardEvent.preventDefault();
                onSubmit();
            }
        });
    }
    // Namespace object for this file; layout.ts and dialog.ts will extend it
    const namespace = {
        DEFAULT_CONFIG,
        loadConfig,
        saveConfig,
        getCurrentConfig,
        resetSettings,
        escapeHtml,
        serializeBreakpoints,
        parseBreakpoints,
        addInputEnterKeyHandler
    };
    // Merge into global namespace without strict global typing
    const existing = globalThis.YTLayoutCustomizer ?? {};
    globalThis.YTLayoutCustomizer = {
        ...existing,
        ...namespace
    };
})();
