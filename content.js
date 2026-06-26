(function () {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'OPEN_SETTINGS_MODAL') {
			showOptionsDialog();
		}
	});

	if (globalThis.hasYTCustomizerLoaded) {
		if (typeof autoLoadStoredStyles === 'function') autoLoadStoredStyles();
		return;
	}
	globalThis.hasYTCustomizerLoaded = true;

	function injectPersistentStyles(vCount, sCount, sidebarWidth) {
		let styleTag = document.getElementById('yt-layout-customizer-styles');
		if (!styleTag) {
			styleTag = document.createElement('style');
			styleTag.id = 'yt-layout-customizer-styles';
			document.head.appendChild(styleTag);
		}

		// Inject perfect spacing using YouTube's exact structural variables
		styleTag.innerHTML = `
      ytd-rich-grid-renderer {
        --ytd-rich-grid-items-per-row: ${vCount} !important;
      }
      
      
      ytd-rich-shelf-renderer[is-shorts], 
      ytd-rich-shelf-renderer[is-shorts] ytd-rich-grid-row,
      ytd-rich-shelf-renderer[is-shorts] #contents,
      ytd-rich-shelf-renderer[is-shorts] #items {
        --ytd-rich-shelf-items-per-row: ${sCount} !important;
        --ytd-rich-grid-items-per-row: ${sCount} !important;
        --ytd-rich-grid-posts-per-row: ${sCount} !important;
        
       
        display: flex !important;
        flex-wrap: wrap !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }


      ytd-rich-shelf-renderer[is-shorts] ytd-rich-item-renderer {
       
        width: calc(100% / ${sCount} - (((${sCount} - 1) * var(--ytd-rich-grid-item-margin, 16px)) / ${sCount})) !important;
        max-width: calc(100% / ${sCount}) !important;
        min-width: 120px !important; /* Safety floor margin */
        box-sizing: border-box !important;
        
   
        margin-right: var(--ytd-rich-grid-item-margin, 16px) !important;
        margin-bottom: var(--ytd-rich-grid-item-margin, 16px) !important;
      }

 
      ytd-rich-shelf-renderer[is-shorts] ytd-rich-item-renderer:nth-child(${sCount}n) {
        margin-right: 0 !important;
      }

      #content.ytd-page-manager {
        max-width: 100% !important;
        padding: 0 24px !important;
      }

  
      #secondary.ytd-watch-flexy, ytd-watch-flexy #secondary {
        width: ${sidebarWidth} !important;
        min-width: ${sidebarWidth} !important;
        max-width: ${sidebarWidth} !important;
      }
      #secondary.ytd-watch-flexy ytd-compact-video-renderer, 
      #secondary.ytd-watch-flexy ytd-item-section-renderer {
        width: 100% !important;
        max-width: 100% !important;
      }
      #primary.ytd-watch-flexy, ytd-watch-flexy #primary {
        flex-grow: 1 !important;
        max-width: none !important;
      }
      ytd-watch-flexy {
        max-width: 100% !important;
        width: 100% !important;
      }
      #player-container, .html5-video-container, .html5-main-video, #ytd-player {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
      }
      .html5-video-container {
        aspect-ratio: 16 / 9 !important;
      }
    `;

		globalThis.dispatchEvent(new Event('resize'));
	}

	function autoLoadStoredStyles() {
		chrome.storage.local.get(['sidebarWidth', 'videoCount', 'shortsSize'], (result) => {
			if (!result.sidebarWidth && !result.videoCount && !result.shortsSize) {
				return;
			}
			const savedWidth = result.sidebarWidth || '350px';
			const savedVideoCount = result.videoCount || '5';
			const savedshortsSize = result.shortsSize || '6';
			injectPersistentStyles(savedVideoCount, savedshortsSize, savedWidth);
		});
	}

	function saveDialogSettings(dialog, isWatchPage, savedWidth, savedVideoCount, savedshortsSize) {
		const updatePayload = {};

		if (isWatchPage) {
			updatePayload.sidebarWidth = dialog.querySelector('#input-sidebar').value;
			updatePayload.videoCount = savedVideoCount;
			updatePayload.shortsSize = savedshortsSize;
		} else {
			updatePayload.videoCount = dialog.querySelector('#input-videos').value;
			updatePayload.shortsSize = dialog.querySelector('#input-shorts').value;
			updatePayload.sidebarWidth = savedWidth;
		}

		chrome.storage.local.set(updatePayload, () => {
			dialog.remove();
			injectPersistentStyles(
				updatePayload.videoCount,
				updatePayload.shortsSize,
				updatePayload.sidebarWidth
			);
		});
	}

	function resetDialogSettings(dialog) {
		chrome.storage.local.clear(() => {
			dialog.remove();
			const customStyleBlock = document.getElementById('yt-layout-customizer-styles');
			if (customStyleBlock) customStyleBlock.remove();
			globalThis.dispatchEvent(new Event('resize'));
			alert('Layout configurations wiped! Restoring YouTube defaults...');
			globalThis.location.reload();
		});
	}

	function addInputEnterKeyHandler(
		input,
		dialog,
		isWatchPage,
		savedWidth,
		savedVideoCount,
		savedshortsSize
	) {
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				saveDialogSettings(
					dialog,
					isWatchPage,
					savedWidth,
					savedVideoCount,
					savedshortsSize
				);
			}
		});
	}

	function closeDialog(event) {
		const dialog = event.currentTarget.closest('#yt-customizer-dialog');
		if (dialog) dialog.remove();
	}

	function showOptionsDialog() {
		chrome.storage.local.get(['sidebarWidth', 'videoCount', 'shortsSize'], (result) => {
			const savedWidth = result.sidebarWidth || '280px';
			const savedVideoCount = result.videoCount || '5';
			const savedshortsSize = result.shortsSize || '6';

			const isWatchPage = globalThis.location.pathname.includes('/watch');

			let dialog = document.getElementById('yt-customizer-dialog');
			if (dialog) dialog.remove();

			dialog = document.createElement('div');
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
				width: '320px',
				border: '1px solid #333333'
			});

			let formHTML = `<h3 style="margin-top:0;margin-bottom:16px;color:#ff0000;font-size:18px;">📺 YT Layout Controls</h3>`;

			if (isWatchPage) {
				formHTML += `
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Sidebar Width:</label>
            <input type="text" id="input-sidebar" value="${savedWidth}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>`;
			} else {
				formHTML += `
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Standard Videos Per Row:</label>
            <input type="text" id="input-videos" value="${savedVideoCount}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">Shorts Size (Bigger Number Is Smaller):</label>
            <input type="text" id="input-shorts" value="${savedshortsSize}" style="width:100%;padding:8px;background:#2d2d2d;border:1px solid #444;color:#fff;border-radius:4px;box-sizing:border-box;">
          </div>`;
			}

			formHTML += `
        <div style="display:flex;justify-content:space-between;margin-top:20px;gap:8px;">
          <button id="btn-reset" style="background:#cc0000;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">🔄 Reset</button>
          <div style="display:flex;gap:8px;">
            <button id="btn-cancel" style="background:#444;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button>
            <button id="btn-save" style="background:#0099ff;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">Apply Changes</button>
          </div>
        </div>
      `;

			dialog.innerHTML = formHTML;
			document.body.appendChild(dialog);

			dialog
				.querySelectorAll('input')
				.forEach((input) =>
					addInputEnterKeyHandler(
						input,
						dialog,
						isWatchPage,
						savedWidth,
						savedVideoCount,
						savedshortsSize
					)
				);
			document.getElementById('btn-cancel').addEventListener('click', closeDialog);
			document
				.getElementById('btn-reset')
				.addEventListener('click', () => resetDialogSettings(dialog));
			document
				.getElementById('btn-save')
				.addEventListener('click', () =>
					saveDialogSettings(
						dialog,
						isWatchPage,
						savedWidth,
						savedVideoCount,
						savedshortsSize
					)
				);
		});
	}

	autoLoadStoredStyles();
})();
