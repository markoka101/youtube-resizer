"use strict";
(function () {
    const ns = globalThis.YTLayoutCustomizer;
    function getEffectiveConfig(config) {
        if (config.mode !== 'adaptive')
            return config;
        const width = window.innerWidth || document.documentElement.clientWidth || 1920;
        const bp = config.adaptiveBreakpoints.find((b) => width <= b.maxWidth) ??
            config.adaptiveBreakpoints.at(-1);
        return {
            ...config,
            videosPerRow: bp.videosPerRow,
            shortsPerRow: bp.shortsPerRow,
            sidebarWidth: bp.sidebarWidth
        };
    }
    function applyLayout(config) {
        const effective = getEffectiveConfig(config);
        let styleTag = document.getElementById('yt-layout-customizer-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'yt-layout-customizer-styles';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
    html {
      scrollbar-gutter: stable both-edges !important;
    }

    ytd-rich-grid-renderer {
      --ytd-rich-grid-items-per-row: ${effective.videosPerRow} !important;
    }

    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-shelf-renderer[is-shorts] ytd-rich-grid-row,
    ytd-rich-shelf-renderer[is-shorts] #contents,
    ytd-rich-shelf-renderer[is-shorts] #items {
      --ytd-rich-shelf-items-per-row: ${effective.shortsPerRow} !important;
      --ytd-rich-grid-items-per-row: ${effective.shortsPerRow} !important;
      --ytd-rich-grid-posts-per-row: ${effective.shortsPerRow} !important;
      display: flex !important;
      flex-wrap: wrap !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    ytd-rich-shelf-renderer[is-shorts] ytd-rich-item-renderer {
      width: calc(
        100% / ${effective.shortsPerRow} -
        (((${effective.shortsPerRow} - 1) * var(--ytd-rich-grid-item-margin, 16px)) / ${effective.shortsPerRow})
      ) !important;
      max-width: calc(100% / ${effective.shortsPerRow}) !important;
      min-width: 120px !important;
      margin-right: var(--ytd-rich-grid-item-margin, 16px) !important;
      margin-bottom: var(--ytd-rich-grid-item-margin, 16px) !important;
      box-sizing: border-box !important;
    }

    ytd-rich-shelf-renderer[is-shorts] ytd-rich-item-renderer:nth-child(${effective.shortsPerRow}n) {
      margin-right: 0 !important;
    }

    #content.ytd-page-manager {
      max-width: 100% !important;
      padding-block: 0 !important;
      padding-inline: 12px !important;
      box-sizing: border-box !important;
    }

    #columns.ytd-watch-flexy,
    #primary.ytd-watch-flexy,
    #secondary.ytd-watch-flexy,
    ytd-watch-flexy,
    ytd-watch-flexy #columns,
    ytd-watch-flexy #primary,
    ytd-watch-flexy #secondary {
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    #secondary.ytd-watch-flexy,
    ytd-watch-flexy #secondary {
      width: ${effective.sidebarWidth} !important;
      min-width: ${effective.sidebarWidth} !important;
      max-width: ${effective.sidebarWidth} !important;
    }

    #secondary.ytd-watch-flexy ytd-compact-video-renderer,
    #secondary.ytd-watch-flexy ytd-item-section-renderer {
      width: 100% !important;
      max-width: 100% !important;
    }

    #primary.ytd-watch-flexy,
    ytd-watch-flexy #primary {
      flex-grow: 1 !important;
      max-width: none !important;
      width: auto !important;
    }

    ytd-watch-flexy {
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding-inline-end: calc(12px + (100vw - 100%)) !important;
    }

    #player,
    #player-container,
    #ytd-player,
    .html5-video-player {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    #player-container,
    #ytd-player,
    .html5-video-player,
    .html5-video-container {
      aspect-ratio: 16 / 9 !important;
      height: auto !important;
      max-height: none !important;
      overflow: hidden !important;
    }

    .html5-video-container {
      width: 100% !important;
      max-width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
    }

    .html5-main-video {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      display: block !important;
    }

    @media (max-width: 1000px) {
      #columns.ytd-watch-flexy,
      ytd-watch-flexy #columns,
      #primary.ytd-watch-flexy,
      ytd-watch-flexy #primary {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  `;
        globalThis.dispatchEvent(new Event('resize'));
    }
    async function autoLoadConfigAndApply() {
        const config = await ns.loadConfig();
        applyLayout(config);
        if (!globalThis.__ytLayoutCustomizerHasResizeHandler) {
            globalThis.__ytLayoutCustomizerHasResizeHandler = true;
            globalThis.addEventListener('resize', () => {
                const current = ns.getCurrentConfig();
                if (!current)
                    return;
                applyLayout(current);
            });
        }
    }
    Object.assign(ns, {
        getEffectiveConfig,
        applyLayout,
        autoLoadConfigAndApply
    });
})();
