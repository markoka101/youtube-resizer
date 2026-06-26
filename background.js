function scheduleOpenSettingsModal(tabId) {
	setTimeout(() => {
		chrome.tabs
			.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' })
			.catch((e) => console.error(e));
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
		.catch((execErr) => console.error('Script injection failed:', execErr));
}

function openSettingsModal(tabId) {
	chrome.tabs.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' }).catch((err) => {
		console.log(
			'Orphaned tab detected or content script uninitialized. Injecting manually...',
			err
		);
		injectContentScript(tabId);
	});
}

chrome.action.onClicked.addListener((tab) => {
	openSettingsModal(tab.id);
});
