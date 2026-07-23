function openSettingsModal(tabId) {
	chrome.tabs.sendMessage(tabId, { action: 'OPEN_SETTINGS_MODAL' }).catch((err) => {
		console.error('Failed to open settings modal:', err);
	});
}

chrome.action.onClicked.addListener((tab) => {
	if (!tab.id) return;
	openSettingsModal(tab.id);
});
