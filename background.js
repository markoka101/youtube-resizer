function scheduleOpenSettingsModal(tabId) {
	setTimeout(() => {
		chrome.tabs.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' }).catch(console.error);
	}, 100);
}

function injectContentScript(tabId) {
	chrome.scripting
		.executeScript({
			target: { tabId },
			files: ['content.js']
		})
		.then(() => {
			scheduleOpenSettingsModal(tabId);
		})
		.catch((err) => console.error('Script injection failed:', err));
}

function openSettingsModal(tabId) {
	chrome.tabs.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' }).catch((err) => {
		console.log('Content script not initialized, injecting...', err);
		injectContentScript(tabId);
	});
}

chrome.action.onClicked.addListener((tab) => {
	openSettingsModal(tab.id);
});
