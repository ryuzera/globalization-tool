document.getElementById("copy-urls").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["urls.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("URLs Copied Successfully!");
      });
    });
  });
});

document.getElementById("copy-infos").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["jira-info.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Mandatory Infos Copied Successfully!");
      });
    });
  });
});

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 1000);
}