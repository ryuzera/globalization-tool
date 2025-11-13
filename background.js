function updateIcon(tabId, url) {
  const isValid = /^https:\/\/jsw\.ibm\.com\/browse\/DSSM-\d+$/.test(url);

  chrome.action.setIcon({
    tabId: tabId,
    path: isValid ? "icons/globe.png" : "icons/globe-off.png"
  });

  if (isValid) {
    chrome.action.enable(tabId);
  } else {
    chrome.action.disable(tabId);
  }
}

// When updated tab 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || tab.url) {
    updateIcon(tabId, changeInfo.url || tab.url);
  }
});

// When user switch tab
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    updateIcon(activeInfo.tabId, tab.url);
  });
});