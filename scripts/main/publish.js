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
        fontFamily: "'IBM Plex Sans', sans-serif", backdropFilter: "blur(2px)",
        direction: "ltr", textAlign: "left"
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
        background: "rgba(255, 255, 255, 0.95)",
        padding: "20px", borderRadius: "12px", width: "550px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative", direction: "ltr", textAlign: "left"
    });

    box.innerHTML = `
        <h3 style="color: #2c3e50; text-align: center; margin: 0 0 15px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; background: linear-gradient(45deg, #3572EF, #3ABEF9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Automatic Publishing
        </h3>
        <div style="margin-bottom: 15px;">
            <textarea id="bulk-urls" placeholder="Paste the URLs here" 
                style="width: 100%; height: 120px; background: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 12px; outline: none; box-sizing: border-box; direction: ltr; text-align: left;"></textarea>
        </div>
        <div id="status-container" style="display:none; margin-bottom: 15px;">
            <div id="status-log" style="height: 150px; overflow-y: auto; background: #191924; color: #00ff95; padding: 12px; border-radius: 8px; font-size: 11px; font-family: 'Consolas', monospace; line-height: 1.5; border: 1px solid #333; direction: ltr; text-align: left;"></div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="btn-cancel" style="flex: 1; background: #f1f1f1; color: #666; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; text-transform: uppercase; font-size: 11px;">Cancel (ESC)</button>
            <button id="btn-clear" style="flex: 1; background: #ff6060; color: white; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; text-transform: uppercase; font-size: 11px;">Clear</button>
            <button id="btn-start" style="flex: 2; background: linear-gradient(45deg, #3ABEF9, #3572EF); color: white; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; text-transform: uppercase; font-size: 11px; box-shadow: 0 4px 15px rgba(53, 114, 239, 0.3);">Publish</button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const btnStart = document.getElementById("btn-start");
    const btnCancel = document.getElementById("btn-cancel");
    const btnClear = document.getElementById("btn-clear");
    const log = document.getElementById("status-log");
    const statusContainer = document.getElementById("status-container");
    const bulkUrls = document.getElementById("bulk-urls");

    const closeBox = () => {
        document.removeEventListener("keydown", handleEsc);
        overlay.remove();
    };

    btnCancel.onclick = closeBox;

    const handleEsc = (event) => {
        if (event.key === "Escape") {
            closeBox();
        }
    };

    document.addEventListener("keydown", handleEsc);
    btnCancel.onclick = closeBox;

    btnClear.onclick = () => {
        bulkUrls.value = "";
        log.innerHTML = "";
        
        statusContainer.style.display = "none";
        
        btnStart.disabled = false;
        btnStart.style.opacity = "1";
        btnStart.innerText = "Publish";
        btnStart.style.background = "linear-gradient(45deg, #3ABEF9, #3572EF)";
        btnStart.onclick = startPublish;
    };

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
        const text = bulkUrls.value;
        const urls = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        
        if (urls.length === 0) return;

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
                    itemLog.innerHTML = `[${locale}] ${pageName} ... <span style="color: #ff4d4d; font-weight: bold;">✖ ERRO ${response.status}</span>`;
                }
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            log.innerHTML += `<br><span style="color:red;">> Authentication error</span>`;
        }

        btnStart.disabled = false;
        btnStart.style.opacity = "1";
        btnStart.innerText = "Close";
        btnStart.style.background = "linear-gradient(45deg, #00951e, #00c438)";
        
        btnStart.onclick = closeBox;
    };

    btnStart.onclick = startPublish;

})();