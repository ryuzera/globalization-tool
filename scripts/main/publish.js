(function () {
    if (!document.getElementById('font-ibm-plex')) {
        const link = document.createElement('link');
        link.id = 'font-ibm-plex';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap';
        document.head.appendChild(link);
    }

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        background: "linear-gradient(180deg, rgba(107, 134, 255, 0.8) 0%, rgba(25, 25, 36, 0.95) 100%)",
        zIndex: "20000", display: "flex", justifyContent: "center", alignItems: "center",
        fontFamily: "'IBM Plex Sans', sans-serif", backdropFilter: "blur(2px)"
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
        background: "rgba(255, 255, 255, 0.95)",
        padding: "20px", borderRadius: "12px", width: "550px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative"
    });

    box.innerHTML = `
        <h3 style="color: #2c3e50; text-align: center; margin: 0 0 15px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; background: linear-gradient(45deg, #3572EF, #3ABEF9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Automatic Publishing
        </h3>
        <div style="margin-bottom: 10px;">
            <textarea id="bulk-urls" placeholder="Paste the URLs here (Max 20)" 
                style="width: 100%; height: 120px; background: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 12px; outline: none; box-sizing: border-box; resize: none;"></textarea>
            <div id="url-counter" style="font-size: 11px; color: #666; margin-top: 5px; font-weight: 600;">Pages detected: 0 / 20</div>
        </div>
        <div id="status-container" style="display:none; margin-bottom: 15px;">
            <div id="status-log" style="height: 150px; overflow-y: auto; background: #191924; color: #00ff95; padding: 12px; border-radius: 8px; font-size: 11px; font-family: 'Consolas', monospace; line-height: 1.5; border: 1px solid #333;"></div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="btn-cancel" style="flex: 1; background: #f1f1f1; color: #666; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; text-transform: uppercase; font-size: 11px;">Cancel</button>
            <button id="btn-start" style="flex: 2; background: linear-gradient(45deg, #3ABEF9, #3572EF); color: white; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; text-transform: uppercase; font-size: 11px; transition: all 0.3s ease;">Publish</button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const textArea = document.getElementById("bulk-urls");
    const counterDisplay = document.getElementById("url-counter");
    const btnStart = document.getElementById("btn-start");
    const btnCancel = document.getElementById("btn-cancel");
    const log = document.getElementById("status-log");
    const statusContainer = document.getElementById("status-container");

    const validateUrls = () => {
        const urls = textArea.value.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        const count = urls.length;
        
        counterDisplay.innerText = `Pages detected: ${count} / 20`;
        
        if (count > 20) {
            counterDisplay.style.color = "#ff4d4d";
            btnStart.disabled = true;
            btnStart.style.background = "#ccc";
            btnStart.style.cursor = "not-allowed";
            btnStart.style.opacity = "0.7";
            btnStart.innerText = "Limit Exceeded";
        } else {
            counterDisplay.style.color = "#666";
            btnStart.disabled = false;
            btnStart.style.background = "linear-gradient(45deg, #3ABEF9, #3572EF)";
            btnStart.style.cursor = "pointer";
            btnStart.style.opacity = "1";
            btnStart.innerText = "Publish";
        }
        return urls;
    };

    textArea.oninput = validateUrls;

    const closeBox = () => overlay.remove();
    btnCancel.onclick = closeBox;

    function getLocale(path) {
        const parts = path.split('/');
        const localeCandidate = parts.find(p => /^[a-z]{2}(-[a-z]{2,3})?$/.test(p));
        return localeCandidate ? localeCandidate.toUpperCase() : 'N/A';
    }

    async function getCsrfToken() {
        const response = await fetch('/libs/granite/csrf/token.json');
        const data = await response.json();
        return data.token;
    }

    const startPublish = async () => {
        const urls = validateUrls();
        if (urls.length === 0 || urls.length > 20) return;

        btnStart.disabled = true;
        btnStart.style.opacity = "0.6";
        btnStart.innerText = "Publishing...";
        statusContainer.style.display = "block";
        log.innerHTML = "> Process starting...<br>";

        try {
            const token = await getCsrfToken();
            for (const url of urls) {
                let path = url.includes('http') ? new URL(url).pathname : url;
                path = path.replace(/^\/editor\.html/, '').replace(/\.html$/, '');

                const locale = getLocale(path);
                const pageName = path.split('/').pop();
                const itemLog = document.createElement("div");
                itemLog.style.marginBottom = "4px";
                itemLog.innerHTML = `[${locale}] ${pageName} ... <span style="color: #ffd700;">publishing</span>`;
                log.appendChild(itemLog);

                const formData = new URLSearchParams({
                    '_charset_': 'utf-8', 'action': 'activate', 'cmd': 'Activate', 'path': path
                });

                const response = await fetch('/bin/replicate.json', {
                    method: 'POST',
                    headers: { 'CSRF-Token': token, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                if (response.ok) {
                    itemLog.innerHTML = `[${locale}] ${pageName} ... <span style="color: #00ff95; font-weight: bold;">✔ OK</span>`;
                } else {
                    itemLog.innerHTML = `[${locale}] ${pageName} ... <span style="color: #ff4d4d; font-weight: bold;">✖ ERROR ${response.status}</span>`;
                }
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            log.innerHTML += `<br><span style="color:red;">> Authentication error</span>`;
        }

        btnStart.disabled = false;
        btnStart.style.opacity = "1";
        btnStart.style.background = "linear-gradient(45deg, #00951e, #00c438)";
        btnStart.innerText = "Close";
        btnStart.onclick = closeBox;
    };

    btnStart.onclick = startPublish;

})();