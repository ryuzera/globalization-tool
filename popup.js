document.getElementById("comment-pre").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["comment-urls-pre.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Pre QA Comment Generated!");
      });
    });
  });
});

document.getElementById("comment-pos").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["comment-urls-pos.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Pos QA Comment Generated!");
      });
    });
  });
});


document.getElementById("report-comment-pre").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["report-comment-pre.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Pre QA Report Comment Generated!");
      });
    });
  });
});

document.getElementById("report-comment-pos").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["report-comment-pos.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Pos QA Report Comment Generated!");
      });
    });
  });
});



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
      files: ["jira-info-qa.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Mandatory Infos Copied Successfully!");
      });
    });
  });
});

document.getElementById("copy-infos-self").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["jira-info-self.js"]
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