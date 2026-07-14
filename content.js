(function () {
	// Prevent multiple initializations on SPA navigations
	if (globalThis.hasYTCustomizerLoaded) {
		autoLoadConfigAndApply();
		return;
	}
	globalThis.hasYTCustomizerLoaded = true;

	const DEFAULT_CONFIG = {
		mode: 'manual', // 'manual' | 'adaptive'
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

	/*
    	Messaging: open settings modal from background or popup.
   */
	chrome.runtime.onMessage.addListener((message) => {
		if (message?.action === 'OPEN_SETTINGS_MODAL') {
			showOptionsDialog();
		}
	});

	/*
		Storage helpers.
	 */
	function loadConfig() {
		return new Promise((resolve) => {
			chrome.storage.local.get(['layoutConfig'], (result) => {
				const stored = result.layoutConfig || {};
				const config = { ...DEFAULT_CONFIG, ...stored };
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

	/*
   		Compute effective layout based on mode and window size.
   */
	function getEffectiveConfig(config) {
		if (config.mode !== 'adaptive') {
			return config;
		}

		const width = window.innerWidth || document.documentElement.clientWidth || 1920;
		const bp =
			config.adaptiveBreakpoints.find((b) => width <= b.maxWidth) ||
			config.adaptiveBreakpoints.at(-1);

		return {
			...config,
			videosPerRow: bp.videosPerRow,
			shortsPerRow: bp.shortsPerRow,
			sidebarWidth: bp.sidebarWidth
		};
	}

	/*
   		Inject or update a single <style> tag with all layout rules.
   */
	function applyLayout(config) {
		const effective = getEffectiveConfig(config);

		let styleTag = document.getElementById('yt-layout-customizer-styles');
		if (!styleTag) {
			styleTag = document.createElement('style');
			styleTag.id = 'yt-layout-customizer-styles';
			document.head.appendChild(styleTag);
		}

		styleTag.textContent = `
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
        width: calc(100% / ${effective.shortsPerRow} - (((${effective.shortsPerRow} - 1) * var(--ytd-rich-grid-item-margin, 16px)) / ${effective.shortsPerRow})) !important;
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
        padding: 0 24px !important;
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
      }

      ytd-watch-flexy {
        max-width: 100% !important;
        width: 100% !important;
      }

      #player-container,
      .html5-video-container,
      .html5-main-video,
      #ytd-player {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
      }

      .html5-video-container {
        aspect-ratio: 16 / 9 !important;
      }
    `;

		// Force YouTube to reconsider layout.
		globalThis.dispatchEvent(new Event('resize'));
	}

	/*
   		Initial load: read config and apply styles.
   */
	async function autoLoadConfigAndApply() {
		const config = await loadConfig();
		applyLayout(config);

		// Re-apply on resize when in adaptive mode.
		if (!globalThis.__ytLayoutCustomizerHasResizeHandler) {
			globalThis.__ytLayoutCustomizerHasResizeHandler = true;
			globalThis.addEventListener('resize', () => {
				if (!currentConfig) return;
				applyLayout(currentConfig);
			});
		}
	}

	/*
		Dialog helpers.
   */
	function closeDialog(dialog) {
		if (dialog?.parentNode) {
			dialog.remove();
		}
	}

	function resetSettings() {
		chrome.storage.local.remove('layoutConfig', () => {
			const styleTag = document.getElementById('yt-layout-customizer-styles');
			if (styleTag) styleTag.remove();
			globalThis.location.reload();
		});
	}

	function addInputEnterKeyHandler(input, onSubmit) {
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				onSubmit();
			}
		});
	}

	/*
    	Build and show the options dialog.
   */
	function showOptionsDialog() {
		loadConfig().then((config) => {
			const isWatchPage = globalThis.location.pathname.includes('/watch');

			let existing = document.getElementById('yt-customizer-dialog');
			if (existing) existing.remove();

			const dialog = document.createElement('div');
			dialog.id = 'yt-customizer-dialog';
			Object.assign(dialog.style, {
				position: 'fixed',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				backgroundColor: '#1f1f1f',
				color: '#ffffff',
				padding: '24px',
				borderRadius: '12px',
				boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
				zIndex: '100000',
				fontFamily: 'Roboto, Arial, sans-serif',
				width: '340px',
				border: '1px solid #333333'
			});

			let formHTML = `
        <h3 style="margin-top:0;margin-bottom:16px;color:#ff0000;font-size:18px;">📺 YT Layout Controls</h3>
        <div style="margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#aaa;">
            <input type="checkbox" id="input-adaptive" ${config.mode === 'adaptive' ? 'checked' : ''} />
            <span>Adaptive layout (Automatically adjusts based on window size)</span>
          </label>
        </div>
      `;

			if (isWatchPage) {
				formHTML += `
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Sidebar Width:</label>
            <input type="text" id="input-sidebar" value="${config.sidebarWidth}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>
        `;
			} else {
				formHTML += `
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Standard Videos Per Row (manual mode):</label>
            <input type="number" min="1" max="12" id="input-videos" value="${config.videosPerRow}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Shorts Per Row (manual mode):</label>
            <input type="number" min="1" max="12" id="input-shorts" value="${config.shortsPerRow}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>
        `;
			}

			formHTML += `
        <div style="display:flex;justify-content:space-between;margin-top:20px;gap:8px;">
          <button id="btn-reset" style="background:#cc0000;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">Reset</button>
          <div style="display:flex;gap:8px;">
            <button id="btn-cancel" style="background:#444;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button>
            <button id="btn-save" style="background:#0099ff;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">Apply Changes</button>
          </div>
        </div>
      `;

			dialog.innerHTML = formHTML;
			document.body.appendChild(dialog);

			const adaptiveCheckbox = dialog.querySelector('#input-adaptive');
			const sidebarInput = dialog.querySelector('#input-sidebar');
			const videosInput = dialog.querySelector('#input-videos');
			const shortsInput = dialog.querySelector('#input-shorts');

			const submit = () => {
				const nextConfig = { ...config };
				nextConfig.mode = adaptiveCheckbox?.checked ? 'adaptive' : 'manual';

				if (isWatchPage && sidebarInput) {
					nextConfig.sidebarWidth = sidebarInput.value || DEFAULT_CONFIG.sidebarWidth;
				} else {
					if (videosInput) {
						const vVal = Number.parseInt(videosInput.value, 10);
						if (!Number.isNaN(vVal) && vVal > 0) nextConfig.videosPerRow = vVal;
					}
					if (shortsInput) {
						const sVal = Number.parseInt(shortsInput.value, 10);
						if (!Number.isNaN(sVal) && sVal > 0) nextConfig.shortsPerRow = sVal;
					}
				}

				saveConfig(nextConfig).then(() => {
					applyLayout(nextConfig);
					closeDialog(dialog);
				});
			};

			// Enter key handling
			dialog.querySelectorAll('input').forEach((input) => {
				addInputEnterKeyHandler(input, submit);
			});

			dialog
				.querySelector('#btn-cancel')
				.addEventListener('click', () => closeDialog(dialog));
			dialog.querySelector('#btn-reset').addEventListener('click', () => {
				closeDialog(dialog);
				resetSettings();
			});
			dialog.querySelector('#btn-save').addEventListener('click', submit);
		});
	}

	// Kick off initial load.
	autoLoadConfigAndApply();
})();
