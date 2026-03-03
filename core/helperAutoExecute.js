const scriptName = "helperAutoExecute.js";

chrome.storage.sync.get(scriptName, (data) => { 
    if (data[scriptName]) {
        function afterWindowLoaded() {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: false,
                view: window,
            });
        
            let clicked = false;
        
            const autoExec = () => {
                if (clicked) return;
                const helperButton = document.querySelector('#ibm-qa-help');
                if (helperButton) {
                    setTimeout(() => { 
                        helperButton.dispatchEvent(clickEvent); 
                    }, 1000);
                    clicked = true;
                }
            };
            
            const observer = new MutationObserver(() => {
                autoExec();
            });
        
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        if (document.readyState !== 'complete') {
            window.addEventListener('load', afterWindowLoaded);
        } else {
            afterWindowLoaded();
        }
    }
});