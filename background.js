// background.js

function scheduleOpenSettingsModal(tabId) {
	setTimeout(() => {
		chrome.tabs
			.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' })
			.catch((err) => console.error('OPEN_SETTINGS_MODAL failed:', err));
	}, 100);
}

function injectContentAssets(tabId) {
	chrome.scripting
		.insertCSS({
			target: { tabId },
			files: ['content/styles.css']
		})
		.then(() => {
			return chrome.scripting.executeScript({
				target: { tabId },
				files: [
					'dist/content/config.js',
					'dist/content/layout.js',
					'dist/content/dialog.js',
					'dist/content/index.js'
				]
			});
		})
		.then(() => {
			scheduleOpenSettingsModal(tabId);
		})
		.catch((err) => console.error('Asset injection failed:', err));
}

function openSettingsModal(tabId) {
	chrome.tabs.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' }).catch((err) => {
		console.log('Content script not initialized, injecting CSS + JS...', err);
		injectContentAssets(tabId);
	});
}

chrome.action.onClicked.addListener((tab) => {
	if (!tab.id) return;
	openSettingsModal(tab.id);
});
