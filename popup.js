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

document.getElementById("copy-date").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["copy-date.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
        showNotification("Current Date Copied Successfully!");
      });
    });
  });
});

document.getElementById("publish").addEventListener("click", function() {
  const button = this;
  const originalText = button.textContent;
  
  button.classList.add("loading");
  button.textContent = "Copying...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["publish.js"]
    }, () => {
      setTimeout(() => {
        button.classList.remove("loading");
        button.textContent = originalText;
        
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

(function() {
  try {
    const btn = document.getElementById('open-urls');
    if (!btn) return; // do nothing if the button isn't present in popup.html

    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = '...';
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) { btn.textContent = original; return; }
        chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: () => {} }, () => {
          // then inject the content script file
          chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['open-urls.js'] }, () => {
            setTimeout(() => { btn.textContent = original; }, 400);
          });
        });
      });
    });
  } catch (e) {
    console.warn('Open All Links launcher failed:', e);
  }
})();

// v2.2.5 - close popup after sending the message to content script
(() => {
  const btn = document.getElementById('open-urls');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
          // inject open-urls.js logic if it's bundled as a file in extension
          // or call existing content script entry point
          if (typeof window.__openAllLinksInjected === 'function') {
            window.__openAllLinksInjected();
          } else {
            // Fallback: try to append a <script> that points to open-urls.js in extension
            const s = document.createElement('script');
            s.src = chrome.runtime.getURL('open-urls.js');
            (document.head || document.documentElement).appendChild(s);
          }
        }
      });
    } catch (e) {
      console.error('Failed to execute script', e);
    } finally {
      window.close(); 
    }
  });
})();
