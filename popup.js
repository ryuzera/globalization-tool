document.addEventListener('DOMContentLoaded', function() {
    
    // --- CONFIGURATION ---
    const lmLocales = ["zh_cn", "fr", "de", "it", "ja", "ko_kr", "pt_br", "es_es", "es_la", "id", "ar"];
    const previewLocales = ["cn/zh", "fr/fr", "de/de", "it/it", "jp/ja", "kr/ko", "br/pt", "es/es", "mx/es", "id/id", "sa/ar", "ae/ar", "qa/ar"];
    const groupColors = ["blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

    // --- DOM ELEMENTS ---
    const menuView = document.getElementById('menu-view');
    const loaderView = document.getElementById('loader-view');
    const stepInput = document.getElementById('step-input');
    const stepSelection = document.getElementById('step-selection');
    
    const qaButtons = document.getElementById('qa-buttons');
    const openLoaderBtn = document.getElementById('open-loader');
    const rawInput = document.getElementById('rawInput');
    
    const ticketContainer = document.getElementById('ticket-container');
    const ticketDisplay = document.getElementById('ticket-display');
    const btnClearTicket = document.getElementById('btn-clear-ticket');

    const btnTsHeader = document.getElementById('btn-ts-header'); 
    const btnTrackingMain = document.getElementById('btn-tracking-main'); 

    const localeContainer = document.getElementById('localeContainer');
    const modeSelect = document.getElementById('mode-select');
    
    const chkEnSource = document.getElementById('chk-en-source');
    const chkEnLive = document.getElementById('chk-en-live');
    const lblEnLive = document.getElementById('lbl-en-live');

    const tabPages = document.getElementById('tab-pages');
    const tabXFrags = document.getElementById('tab-xfrags');
    const wrapperPages = document.getElementById('wrapper-pages');
    const wrapperXFrags = document.getElementById('wrapper-xfrags');
    const pagesListContainer = document.getElementById('pagesListContainer');
    const xfragsListContainer = document.getElementById('xfragsListContainer');
    const countPagesSpan = document.getElementById('count-pages');
    const countXFragsSpan = document.getElementById('count-xfrags');
    const btnLaunch = document.getElementById('btnLaunch');

    const toggleLocales = document.getElementById('toggleLocales');
    const togglePages = document.getElementById('togglePages');
    const toggleXFrags = document.getElementById('toggleXFrags');

    // --- HELPER FUNCTIONS ---

    function openTrackingSheet(btnElement) {
        if (!btnElement) return;
        const originalText = btnElement.textContent;
        btnElement.style.opacity = "0.7";
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if(!tabs[0]) { btnElement.style.opacity = "1"; return; }
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const boxLink = links.find(a => a.href && (a.href.includes('box.com') || a.href.includes('ibm.box.com')));
                    if(boxLink) return boxLink.href;
                    const bodyText = document.body.innerText;
                    const match = bodyText.match(/https:\/\/(ibm\.)?(.+\.)?box\.com\/s\/[a-zA-Z0-9]+/);
                    return match ? match[0] : null;
                }
            }, (results) => {
                btnElement.style.opacity = "1";
                if (results && results[0] && results[0].result) {
                    chrome.tabs.create({ url: results[0].result });
                } else {
                    alert("No Box Tracking Sheet link found on this page.");
                }
            });
        });
    }

    function switchTab(type) {
        chrome.storage.local.set({ activeTab: type });
        if (type === 'pages') {
            tabPages.classList.add('active');
            tabXFrags.classList.remove('active');
            wrapperPages.classList.add('active');
            wrapperXFrags.classList.remove('active');
            btnLaunch.style.background = "#0f62fe"; 
        } else {
            tabPages.classList.remove('active');
            tabXFrags.classList.add('active');
            wrapperPages.classList.remove('active');
            wrapperXFrags.classList.add('active');
            btnLaunch.style.background = "#da1e28"; 
        }
    }

    function updateCounters() {
        const allLocales = document.querySelectorAll('.chk-locale');
        const checkedLocales = document.querySelectorAll('.chk-locale:checked');
        const localeCounter = document.getElementById('locale-counter');
        if (localeCounter) {
            localeCounter.innerText = `(${checkedLocales.length}/${allLocales.length})`;
        }
        const allPages = pagesListContainer.querySelectorAll('.chk-link');
        const checkedPages = pagesListContainer.querySelectorAll('.chk-link:checked');
        countPagesSpan.innerText = `(${checkedPages.length})`;
        const allXFrags = xfragsListContainer.querySelectorAll('.chk-link');
        const checkedXFrags = xfragsListContainer.querySelectorAll('.chk-link:checked');
        countXFragsSpan.innerText = `(${checkedXFrags.length})`;
    }

    function toggleRoleSwitch(disable) {
        const switcher = document.querySelector('.role-switch');
        if(disable) switcher.classList.add('disabled');
        else switcher.classList.remove('disabled');
    }

    function renderLocales(mode, savedSelection = null) {
        if(!localeContainer) return;
        localeContainer.innerHTML = '';
        const listToRender = (mode.includes('lm')) ? lmLocales : previewLocales;
        listToRender.forEach(loc => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            const isChecked = savedSelection ? savedSelection.includes(loc) : true;
            const checkedAttr = isChecked ? 'checked' : '';
            div.innerHTML = `<input type="checkbox" class="chk-locale" value="${loc}" ${checkedAttr}> ${loc}`;
            localeContainer.appendChild(div);
        });
        updateCounters();
    }

    function saveNavState(screen, step) {
        chrome.storage.local.set({ currentScreen: screen, currentStep: step });
    }

    function updateTicketUI(ticketId) {
        if (ticketId && ticketId.trim() !== "") {
            ticketDisplay.textContent = ticketId;
            ticketContainer.classList.add('active');
            chrome.storage.local.set({ savedTicket: ticketId });
        } else {
            ticketDisplay.textContent = "";
            ticketContainer.classList.remove('active');
        }
    }

    function applyRole(role) {
        if (role === 'dev') {
            // Se houver lógica específica para esconder/mostrar botões baseados em role, aplique aqui.
            // Por enquanto, mostra tudo.
        } 
    }

    // --- ANALYZER (Lógica Pura - Sem UI) ---
    function analyzeLinks(text) {
        if (!text || !text.trim()) return null;

        const lines = text.split(/\s+/);
        const foundPages = [];
        const foundXFrags = [];

        lines.forEach(line => {
            let clean = line.trim();
            // Tenta decodificar, se falhar, ignora
            try { clean = decodeURIComponent(clean); } catch(e) { return; }
            if(!clean) return;

            // FILTROS: Jira e Box
            if (clean.includes('box.com') || clean.includes('jsw.ibm.com') || clean.includes('jira')) return;

            if (clean.match(/^https?:\/\//)) {
                try {
                    const urlObj = new URL(clean);
                    if (urlObj.hostname.includes('jsw.ibm.com') || urlObj.hostname.includes('jira')) return;
                    clean = urlObj.pathname;
                } catch (e) { return; }
            }

            clean = clean.replace(/^(https?:\/\/)?(www\.)?ibm\.com/, "")
                         .replace(/^(https?:\/\/)?prod-cloud-author\.aem\.ibm\.net/, "")
                         .replace(/^(https?:\/\/)?author-.*\.adobeaemcloud\.com/, "");
            
            // Segurança final
            if (clean.includes('box.com') || clean.includes('jsw.ibm.com') || clean.includes('browse/')) return;

            const isXFrag = clean.includes('/experience-fragments/');
            
            if(clean.includes('?')) clean = clean.split('?')[0];
            if(clean.includes('#')) clean = clean.split('#')[0];
            if(!clean.endsWith('.html')) clean = clean + '.html';
            
            clean = clean.replace(/^\/editor\.html/, '')
                         .replace(/^\/mnt\/overlay\/wcm\/core\/content\/sites\/properties\.html/, '');

            // Lógica de Âncora (Anchor)
            let processed = false;
            
            // A. Language Masters
            const lmRegex = /.*\/language-masters\/[a-z0-9_-]+\//;
            if (lmRegex.test(clean)) {
                clean = clean.replace(lmRegex, '/');
                processed = true;
            }
            // B. Locale
            if (!processed) {
                const localeRegex = /^\/content\/[^/]+\/[a-z0-9_-]+\/[a-z0-9_-]+\//;
                if (localeRegex.test(clean)) {
                    clean = clean.replace(localeRegex, '/');
                    processed = true;
                }
            }
            // C. Live Link
            if (!processed) {
                const liveRegex = /^\/[a-z]{2}-[a-z]{2}\//;
                if (liveRegex.test(clean)) {
                    clean = clean.replace(liveRegex, '/');
                    processed = true;
                }
            }
            // D. XFrag Deep
            if (!processed && isXFrag) {
                const xfragDeepRegex = /\/experience-fragments\/[^/]+\/.*\/[a-z0-9_-]+\/[a-z0-9_-]+\//;
                if (xfragDeepRegex.test(clean)) {
                    clean = clean.replace(xfragDeepRegex, '/');
                    processed = true;
                }
            }
            
            clean = clean.replace('//', '/');
            if(!clean.startsWith('/')) clean = '/' + clean;

            if (isXFrag) {
                if(!foundXFrags.includes(clean)) foundXFrags.push(clean);
            } else {
                if(!foundPages.includes(clean)) foundPages.push(clean);
            }
        });

        if (foundPages.length === 0 && foundXFrags.length === 0) return null;
        return { pages: foundPages, xfrags: foundXFrags };
    }

    // --- RENDERER (Desenha a tela) ---
    function renderResults(pages, xfrags, savedPages = null, savedXFrags = null) {
        pagesListContainer.innerHTML = '';
        pages.forEach(link => {
            const div = document.createElement('div');
            div.className = 'link-item';
            const isChecked = savedPages ? savedPages.includes(link) : true;
            const checkedAttr = isChecked ? 'checked' : '';
            div.innerHTML = `<input type="checkbox" class="chk-link page-link" value="${link}" ${checkedAttr}> ${link}`;
            pagesListContainer.appendChild(div);
        });

        xfragsListContainer.innerHTML = '';
        xfrags.forEach(link => {
            const div = document.createElement('div');
            div.className = 'link-item';
            const isChecked = savedXFrags ? savedXFrags.includes(link) : true;
            const checkedAttr = isChecked ? 'checked' : '';
            div.innerHTML = `<input type="checkbox" class="chk-link xfrag-link" value="${link}" ${checkedAttr}> ${link}`;
            xfragsListContainer.appendChild(div);
        });

        stepInput.style.display = 'none';
        document.getElementById('step-selection').style.display = 'block';
        updateCounters();
    }

    // --- INITIALIZATION ---
    chrome.storage.local.get([
        'userRole', 'savedLinks', 'savedTicket', 'currentScreen', 'currentStep', 
        'linkMode', 'enSource', 'enLive', 'activeTab', 'selectedLocales', 'selectedPages', 'selectedXFrags', 'accordionsState'
    ], (data) => {
        
        if (data.userRole) {
            const radio = document.querySelector(`input[name="role"][value="${data.userRole}"]`);
            if(radio) { radio.checked = true; applyRole(data.userRole); }
        }
        
        if (data.linkMode) { modeSelect.value = data.linkMode; } 
        else { modeSelect.value = 'locale-preview'; }
        renderLocales(modeSelect.value, data.selectedLocales);

        if (data.enSource) {
            chkEnSource.checked = true; chkEnLive.disabled = false; lblEnLive.style.color = "#333";
        } else {
            chkEnSource.checked = false; chkEnLive.disabled = true; lblEnLive.style.color = "#999";
        }
        if (data.enLive && data.enSource) chkEnLive.checked = true;

        if (data.savedLinks) rawInput.value = data.savedLinks;
        if (data.savedTicket) updateTicketUI(data.savedTicket);

        // Restaurar Accordions
        if (data.accordionsState) {
            const accs = document.getElementsByClassName("accordion");
            Array.from(accs).forEach((acc, index) => {
                if (data.accordionsState.includes(index)) {
                    acc.classList.add("active");
                    const panel = acc.nextElementSibling;
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            });
        }

        // Silent Restore (Loader)
        const screen = data.currentScreen || 'menu';
        const step = data.currentStep || 'input';

        if (screen === 'loader') {
            menuView.style.display = 'none';
            loaderView.style.display = 'block';
            toggleRoleSwitch(true);

            if (step === 'selection' && data.savedLinks && data.savedLinks.trim() !== '') {
                const results = analyzeLinks(data.savedLinks);
                if (results) {
                    renderResults(results.pages, results.xfrags, data.selectedPages, data.selectedXFrags);
                    
                    let targetTab = 'pages';
                    if (data.activeTab) {
                        targetTab = data.activeTab;
                    } else if (results.xfrags.length > 0 && results.pages.length === 0) {
                        targetTab = 'xfrags';
                    }
                    switchTab(targetTab);
                } else {
                    stepInput.style.display = 'block';
                    stepSelection.style.display = 'none';
                    saveNavState('loader', 'input');
                }
            } else {
                stepInput.style.display = 'block';
                stepSelection.style.display = 'none';
            }
        } else {
            toggleRoleSwitch(false);
        }
    });

    // --- EVENT LISTENERS ---

    if(btnTsHeader) btnTsHeader.addEventListener('click', () => openTrackingSheet(btnTsHeader));
    if(btnTrackingMain) btnTrackingMain.addEventListener('click', () => openTrackingSheet(btnTrackingMain));

    tabPages.addEventListener('click', () => switchTab('pages'));
    tabXFrags.addEventListener('click', () => switchTab('xfrags'));

    document.querySelectorAll('input[name="role"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const role = e.target.value;
            chrome.storage.local.set({ userRole: role });
            applyRole(role);
        });
    });

    modeSelect.addEventListener('change', (e) => {
        const newMode = e.target.value;
        chrome.storage.local.set({ linkMode: newMode });
        renderLocales(newMode, null); 
        chrome.storage.local.remove('selectedLocales');
    });

    chkEnSource.addEventListener('change', () => {
        chrome.storage.local.set({ enSource: chkEnSource.checked });
        if (chkEnSource.checked) {
            chkEnLive.disabled = false;
            lblEnLive.style.color = "#333";
        } else {
            chkEnLive.disabled = true;
            chkEnLive.checked = false;
            lblEnLive.style.color = "#999";
            chrome.storage.local.set({ enLive: false });
        }
    });

    chkEnLive.addEventListener('change', () => {
        chrome.storage.local.set({ enLive: chkEnLive.checked });
    });

    rawInput.addEventListener('input', () => {
        chrome.storage.local.set({ savedLinks: rawInput.value });
        if(rawInput.value.trim() === "") {
            chrome.storage.local.remove(['selectedPages', 'selectedXFrags']);
        }
        const msg = document.getElementById('auto-save-msg');
        msg.textContent = "Saved";
        setTimeout(() => msg.textContent = "", 1000);
    });

    function clearAll() {
        rawInput.value = '';
        updateTicketUI(null);
        chrome.storage.local.remove(['savedLinks', 'savedTicket', 'selectedLocales', 'selectedPages', 'selectedXFrags']);
        stepInput.style.display = 'block';
        stepSelection.style.display = 'none';
        chrome.storage.local.set({ currentScreen: 'loader', currentStep: 'input' });
        pagesListContainer.innerHTML = '';
        xfragsListContainer.innerHTML = '';
    }

    document.getElementById('btnClear').addEventListener('click', clearAll);
    if(btnClearTicket) btnClearTicket.addEventListener('click', clearAll);

    // --- ANALYZE LOGIC ---
    const btnParse = document.getElementById('btnParse');

    btnParse.addEventListener('click', () => {
        const text = rawInput.value;
        if (!text || !text.trim()) return alert("Please paste links first.");

        const results = analyzeLinks(text);

        if (!results) {
            return alert("No valid links found.");
        }

        renderResults(results.pages, results.xfrags, null, null);

        if(results.xfrags.length > 0 && results.pages.length === 0) {
            switchTab('xfrags');
        } else {
            switchTab('pages');
        }

        saveNavState('loader', 'selection');
    });

    // --- SELECT ALL TOGGLES ---
    if(toggleLocales) {
        toggleLocales.onclick = () => {
            const boxes = document.querySelectorAll('.chk-locale');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
            const currentSelected = Array.from(document.querySelectorAll('.chk-locale:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedLocales: currentSelected });
        };
    }

    if(togglePages) {
        togglePages.onclick = () => {
            const boxes = pagesListContainer.querySelectorAll('.chk-link');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
            const currentSelected = Array.from(pagesListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedPages: currentSelected });
        };
    }

    if(toggleXFrags) {
        toggleXFrags.onclick = () => {
            const boxes = xfragsListContainer.querySelectorAll('.chk-link');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
            const currentSelected = Array.from(xfragsListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedXFrags: currentSelected });
        };
    }

    // Global Listener
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('chk-locale')) {
            updateCounters();
            const currentSelected = Array.from(document.querySelectorAll('.chk-locale:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedLocales: currentSelected });
        }
        else if (e.target.classList.contains('page-link')) {
            updateCounters();
            const currentSelected = Array.from(pagesListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedPages: currentSelected });
        }
        else if (e.target.classList.contains('xfrag-link')) {
            updateCounters();
            const currentSelected = Array.from(xfragsListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
            chrome.storage.local.set({ selectedXFrags: currentSelected });
        }
    });

    // --- LAUNCH LOGIC ---
    btnLaunch.addEventListener('click', async () => {
        const selectedLocales = Array.from(document.querySelectorAll('.chk-locale:checked')).map(cb => cb.value);
        const selectedPages = Array.from(pagesListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
        const selectedXFrags = Array.from(xfragsListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);

        const mode = modeSelect.value;
        const openEnSource = chkEnSource.checked;
        const isLiveMode = chkEnLive.checked;

        const totalLinks = selectedPages.length + selectedXFrags.length;

        if ((selectedLocales.length === 0 && !openEnSource) || totalLinks === 0) {
            return alert("Select at least 1 locale and 1 link (Page or XFrag).");
        }
        
        let totalTabs = (selectedLocales.length * totalLinks);
        if (openEnSource) totalTabs += totalLinks;

        if(totalTabs > 30 && !confirm(`Opening ${totalTabs} tabs. Confirm?`)) return;
        if(!chrome.tabGroups) return alert("Missing tabGroups permission.");

        const buildUrl = (path, localeCode, isEnSource, isLive) => {
            const baseUrl = "https://prod-cloud-author.aem.ibm.net";
            const isXFrag = selectedXFrags.includes(path); 
            const rootPrefix = isXFrag ? "/content/experience-fragments/adobe-cms" : "/content/adobe-cms";

            if (isEnSource && isLive) {
                if(isXFrag) return null; 
                return `https://www.ibm.com/us-en${path}`;
            }

            let midPath = "";
            if (isEnSource) {
                 midPath = mode.includes('lm') ? "/language-masters/en" : "/us/en";
            } else {
                midPath = mode.includes('lm') ? `/language-masters/${localeCode}` : `/${localeCode}`;
            }

            const fullPath = `${rootPrefix}${midPath}${path}`;

            if (mode.includes('edit')) {
                return `${baseUrl}/editor.html${fullPath}`;
            } else {
                return `${baseUrl}${fullPath}?wcmmode=disabled`;
            }
        };

        if (openEnSource) {
            const tabIds = [];
            const allSelected = [...selectedPages, ...selectedXFrags];

            for (const path of allSelected) {
                const url = buildUrl(path, 'en', true, isLiveMode);
                if(url) {
                    const tab = await chrome.tabs.create({ url: url, active: false });
                    tabIds.push(tab.id);
                }
            }
            if (tabIds.length > 0) {
                const groupId = await chrome.tabs.group({ tabIds: tabIds });
                await chrome.tabGroups.update(groupId, { 
                    title: isLiveMode ? "EN (LIVE)" : "EN (SOURCE)", 
                    color: "grey" 
                });
            }
        }

        for (let i = 0; i < selectedLocales.length; i++) {
            const locCode = selectedLocales[i];
            const tabIds = [];
            const allSelected = [...selectedPages, ...selectedXFrags];

            for (const path of allSelected) {
                const url = buildUrl(path, locCode, false, false);
                if(url) {
                    const tab = await chrome.tabs.create({ url: url, active: false });
                    tabIds.push(tab.id);
                }
            }
            if (tabIds.length > 0) {
                const groupId = await chrome.tabs.group({ tabIds: tabIds });
                await chrome.tabGroups.update(groupId, { 
                    title: locCode.toUpperCase(), 
                    color: groupColors[i % groupColors.length] 
                });
            }
        }
    });

    const btnImport = document.getElementById('btn-import-jira');
    if(btnImport) {
        btnImport.addEventListener('click', () => {
            btnImport.textContent = "...";
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if(!tabs[0]) return;
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        let ticket = "";
                        const keyVal = document.querySelector("#key-val");
                        const breadcrumb = document.querySelector("[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item']");
                        if (keyVal) ticket = keyVal.innerText;
                        else if (breadcrumb) ticket = breadcrumb.innerText;
                        else {
                            const match = window.location.pathname.match(/([A-Z]+-\d+)/);
                            if(match) ticket = match[1];
                        }
                        const descEl = document.querySelector("#description-val");
                        const descText = descEl ? descEl.innerText : document.body.innerText;
                        return { ticket: ticket, text: descText };
                    }
                }, (results) => {
                    btnImport.textContent = "Import Jira";
                    if (results && results[0] && results[0].result) {
                        const data = results[0].result;
                        if(data.ticket) updateTicketUI(data.ticket);
                        const urls = data.text.match(/https?:\/\/[^\s"']+/g) || [];
                        if(urls.length > 0) {
                            rawInput.value = urls.join('\n');
                            rawInput.dispatchEvent(new Event('input'));
                        } else {
                            alert("No links found.");
                        }
                    } else {
                        alert("Error: Are you on a Jira page?");
                    }
                });
            });
        });
    }

    openLoaderBtn.addEventListener('click', () => { 
        menuView.style.display = 'none'; 
        loaderView.style.display = 'block';
        toggleRoleSwitch(true); 
        
        const currentRole = document.querySelector('input[name="role"]:checked').value;
        if(currentRole === 'qa') {
            modeSelect.value = 'locale-preview';
        } else {
            modeSelect.value = 'lm-edit';
        }
        renderLocales(modeSelect.value);

        saveNavState('loader', 'input');
    });

    document.getElementById('btn-back').addEventListener('click', () => { 
        loaderView.style.display = 'none'; 
        menuView.style.display = 'block';
        stepInput.style.display = 'block';
        stepSelection.style.display = 'none';
        toggleRoleSwitch(false); 
        saveNavState('menu', null);
    });

    const scripts = [
        { id: "copy-urls", file: "urls.js", msg: "URLs Copied!" },
        { id: "copy-infos", file: "jira-info-qa.js", msg: "Infos Copied!" },
        { id: "copy-infos-self", file: "jira-info-self.js", msg: "Infos Copied!" },
        { id: "comment-pre", file: "comment-urls-pre.js", msg: "Comment Generated!" },
        { id: "comment-pos", file: "comment-urls-pos.js", msg: "Comment Generated!" },
        { id: "report-comment-pre", file: "report-comment-pre.js", msg: "Report Generated!" },
        { id: "report-comment-pos", file: "report-comment-pos.js", msg: "Report Generated!" },
        { id: "copy-date", file: "copy-date.js", msg: "Current Date Copied Successfully!" }
    ];

    scripts.forEach(s => {
        const btn = document.getElementById(s.id);
        if(btn) {
            btn.addEventListener("click", () => {
                const originalText = btn.textContent;
                btn.textContent = "...";
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if(!tabs[0]) return;
                    chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: [s.file] }, () => {
                        setTimeout(() => { btn.textContent = originalText; alert(s.msg); }, 500);
                    });
                });
            });
        }
    });

    const btnPublish = document.getElementById('publish');
    if(btnPublish) {
        btnPublish.addEventListener("click", () => {
            const originalText = btnPublish.textContent;
            btnPublish.textContent = "...";
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if(!tabs[0]) return;
                chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ["publish.js"] }, () => {
                    setTimeout(() => { btnPublish.textContent = originalText; }, 500);
                });
            });
        });
    }

    const btnOpenUrls = document.getElementById('open-urls');
    if(btnOpenUrls) {
        btnOpenUrls.addEventListener("click", () => {
            const originalText = btnOpenUrls.textContent;
            btnOpenUrls.textContent = "...";
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if(!tabs[0]) return;
                chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ["open-urls.js"] }, () => {
                    window.close(); 
                });
            });
        });
    }

    // --- ACCORDION LOGIC (NOVA) ---
    const acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
            // Save state
            const openIndexes = [];
            for(let j=0; j<acc.length; j++) {
                if(acc[j].classList.contains("active")) openIndexes.push(j);
            }
            chrome.storage.local.set({ accordionsState: openIndexes });
        });
    }
});