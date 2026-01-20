document.addEventListener('DOMContentLoaded', function() {
    
    // --- CONFIGURATION ---
    
    const lmLocales = [
        "zh_cn", "fr", "de", "it", "ja", "ko_kr", "pt_br", "es_es", "es_la", "id", "ar"
    ];

    const previewLocales = [
        "cn/zh", "fr/fr", "de/de", "it/it", "jp/ja", "kr/ko", "br/pt", 
        "es/es", "mx/es", "id/id", "sa/ar", "ae/ar", "qa/ar"
    ];

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

    // Referência ao botão do header
    const btnTsHeader = document.getElementById('btn-ts-header');

    const localeContainer = document.getElementById('localeContainer');
    const modeSelect = document.getElementById('mode-select');
    
    // EN Source References
    const chkEnSource = document.getElementById('chk-en-source');
    const chkEnLive = document.getElementById('chk-en-live');
    const lblEnLive = document.getElementById('lbl-en-live');

    // Tab References
    const tabPages = document.getElementById('tab-pages');
    const tabXFrags = document.getElementById('tab-xfrags');
    const wrapperPages = document.getElementById('wrapper-pages');
    const wrapperXFrags = document.getElementById('wrapper-xfrags');
    const pagesListContainer = document.getElementById('pagesListContainer');
    const xfragsListContainer = document.getElementById('xfragsListContainer');
    const countPagesSpan = document.getElementById('count-pages');
    const countXFragsSpan = document.getElementById('count-xfrags');
    const btnLaunch = document.getElementById('btnLaunch');

    // Toggle Select All References
    const toggleLocales = document.getElementById('toggleLocales');
    const togglePages = document.getElementById('togglePages');
    const toggleXFrags = document.getElementById('toggleXFrags');

    // --- HELPER FUNCTIONS ---

    // Lógica para abrir Tracking Sheet (Box)
    function openTrackingSheet(btnElement) {
        if (!btnElement) return;
        btnElement.style.opacity = "0.7";
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if(!tabs[0]) {
                 btnElement.style.opacity = "1";
                 return;
            }
            
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    // 1. Busca link direto <a> com box.com
                    const links = Array.from(document.querySelectorAll('a'));
                    const boxLink = links.find(a => a.href && (a.href.includes('box.com') || a.href.includes('ibm.box.com')));
                    if(boxLink) return boxLink.href;

                    // 2. Fallback: Busca URL no texto da página
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

    // Switch between Pages (Blue) and XFrags (Red) tabs
    function switchTab(type) {
        if (type === 'pages') {
            tabPages.classList.add('active');
            tabXFrags.classList.remove('active');
            wrapperPages.classList.add('active');
            wrapperXFrags.classList.remove('active');
            btnLaunch.style.background = "#0f62fe"; // Blue button
        } else {
            tabPages.classList.remove('active');
            tabXFrags.classList.add('active');
            wrapperPages.classList.remove('active');
            wrapperXFrags.classList.add('active');
            btnLaunch.style.background = "#da1e28"; // Red button
        }
    }

    // Update numbers (X/Y) for Locales and both Link lists
    function updateCounters() {
        // Locales
        const allLocales = document.querySelectorAll('.chk-locale');
        const checkedLocales = document.querySelectorAll('.chk-locale:checked');
        const localeCounter = document.getElementById('locale-counter');
        if (localeCounter) {
            localeCounter.innerText = `(${checkedLocales.length}/${allLocales.length})`;
        }

        // Pages
        const allPages = pagesListContainer.querySelectorAll('.chk-link');
        const checkedPages = pagesListContainer.querySelectorAll('.chk-link:checked');
        countPagesSpan.innerText = `(${checkedPages.length})`;

        // XFrags
        const allXFrags = xfragsListContainer.querySelectorAll('.chk-link');
        const checkedXFrags = xfragsListContainer.querySelectorAll('.chk-link:checked');
        countXFragsSpan.innerText = `(${checkedXFrags.length})`;
    }

    function toggleRoleSwitch(disable) {
        const switcher = document.querySelector('.role-switch');
        if(disable) switcher.classList.add('disabled');
        else switcher.classList.remove('disabled');
    }

    function renderLocales(mode) {
        if(!localeContainer) return;
        localeContainer.innerHTML = '';
        
        const listToRender = (mode.includes('lm')) ? lmLocales : previewLocales;

        listToRender.forEach(loc => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `<input type="checkbox" class="chk-locale" value="${loc}" checked> ${loc}`;
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
        if (role === 'dev') qaButtons.style.display = 'none';
        else qaButtons.style.display = 'flex';
    }
    

    // --- INITIALIZATION ---
    // [FIX] Adicionado 'enSource' e 'enLive' para recuperar memória
    chrome.storage.local.get(['userRole', 'savedLinks', 'savedTicket', 'currentScreen', 'currentStep', 'linkMode', 'enSource', 'enLive'], (data) => {
        // Role Memory Logic
        if (data.userRole) {
            const radio = document.querySelector(`input[name="role"][value="${data.userRole}"]`);
            if(radio) {
                radio.checked = true;
                applyRole(data.userRole);
            }
        }

        if (data.linkMode) {
            modeSelect.value = data.linkMode;
        } else {
            modeSelect.value = 'locale-preview'; 
        }
        renderLocales(modeSelect.value);

        // [FIX] Memória dos Checkboxes EN
        if (data.enSource) {
            chkEnSource.checked = true;
            chkEnLive.disabled = false;
            lblEnLive.style.color = "#333";
        } else {
            chkEnSource.checked = false;
            chkEnLive.disabled = true;
            lblEnLive.style.color = "#999";
        }

        if (data.enLive && data.enSource) {
            chkEnLive.checked = true;
        }

        if (data.savedLinks) rawInput.value = data.savedLinks;
        if (data.savedTicket) updateTicketUI(data.savedTicket);

        const screen = data.currentScreen || 'menu';
        const step = data.currentStep || 'input';

        if (screen === 'loader') {
            menuView.style.display = 'none';
            loaderView.style.display = 'block';
            toggleRoleSwitch(true);

            if (step === 'selection' && data.savedLinks && data.savedLinks.trim() !== '') {
                setTimeout(() => document.getElementById('btnParse').click(), 50); 
            } else {
                stepInput.style.display = 'block';
                stepSelection.style.display = 'none';
            }
        } else {
            toggleRoleSwitch(false);
        }
    });

    // --- EVENT LISTENERS ---

    // Event Listener para o botão TS do header
    if(btnTsHeader) {
        btnTsHeader.addEventListener('click', () => openTrackingSheet(btnTsHeader));
    }

    // Tabs
    tabPages.addEventListener('click', () => switchTab('pages'));
    tabXFrags.addEventListener('click', () => switchTab('xfrags'));

    // Roles Persistence
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
        renderLocales(newMode);
    });

    // EN Source Toggle [FIX: Salva no Storage]
    chkEnSource.addEventListener('change', () => {
        chrome.storage.local.set({ enSource: chkEnSource.checked }); // Save state
        
        if (chkEnSource.checked) {
            chkEnLive.disabled = false;
            lblEnLive.style.color = "#333";
        } else {
            chkEnLive.disabled = true;
            chkEnLive.checked = false;
            lblEnLive.style.color = "#999";
            chrome.storage.local.set({ enLive: false }); // Reset live if source off
        }
    });

    // EN Live Toggle [FIX: Salva no Storage]
    chkEnLive.addEventListener('change', () => {
        chrome.storage.local.set({ enLive: chkEnLive.checked }); // Save state
    });

    // Inputs
    rawInput.addEventListener('input', () => {
        chrome.storage.local.set({ savedLinks: rawInput.value });
        const msg = document.getElementById('auto-save-msg');
        msg.textContent = "Saved";
        setTimeout(() => msg.textContent = "", 1000);
    });

    function clearAll() {
        rawInput.value = '';
        updateTicketUI(null);
        chrome.storage.local.remove(['savedLinks', 'savedTicket']);
        stepInput.style.display = 'block';
        stepSelection.style.display = 'none';
        chrome.storage.local.set({ currentScreen: 'loader', currentStep: 'input' });
        // Reset lists
        pagesListContainer.innerHTML = '';
        xfragsListContainer.innerHTML = '';
    }

    document.getElementById('btnClear').addEventListener('click', clearAll);
    if(btnClearTicket) btnClearTicket.addEventListener('click', clearAll);

    // --- ANALYZE LOGIC (REFINADA: BOX FIX & ANCHOR FIX) ---
    const btnParse = document.getElementById('btnParse');

    btnParse.addEventListener('click', () => {
        const text = rawInput.value;
        if (!text || !text.trim()) return alert("Please paste links first.");

        const lines = text.split('\n');
        
        const foundPages = [];
        const foundXFrags = [];

        lines.forEach(line => {
            let clean = line.trim();
            if(!clean) return;

            // [FIX] 1. Bloqueio Imediato de links do Box
            if (clean.includes('box.com')) return;

            // 2. Limpeza de Domínio Genérica
            if (clean.match(/^https?:\/\//)) {
                try {
                    const urlObj = new URL(clean);
                    clean = urlObj.pathname;
                } catch (e) { return; }
            }

            // Fallback para cópias manuais
            clean = clean.replace(/^(https?:\/\/)?(www\.)?ibm\.com/, "")
                         .replace(/^(https?:\/\/)?prod-cloud-author\.aem\.ibm\.net/, "")
                         .replace(/^(https?:\/\/)?author-.*\.adobeaemcloud\.com/, "");
            
            // Segurança extra contra Box e caminhos vazios
            if(clean.includes('box.com') || clean === "/" || clean === "") return;

            // 3. Identificar Tipo
            const isXFrag = clean.includes('experience-fragments');

            // 4. Normalização Básica
            if(clean.includes('?')) clean = clean.split('?')[0];
            if(clean.includes('#')) clean = clean.split('#')[0];
            if(!clean.endsWith('.html')) clean = clean + '.html';
            
            clean = clean.replace(/^\/editor\.html/, '')
                         .replace(/^\/mnt\/overlay\/wcm\/core\/content\/sites\/properties\.html/, '');

            // [FIX] 5. Lógica de Extração por Âncora (Anchor Logic)
            // Substitui a lógica antiga rígida por uma que procura o padrão de pastas
            
            let processed = false;

            // A. Padrão Language Master (/language-masters/CODE/)
            const lmRegex = /.*\/language-masters\/[a-z0-9_-]+\//;
            if (lmRegex.test(clean)) {
                clean = clean.replace(lmRegex, '/');
                processed = true;
            }

            // B. Padrão Locale (/content/PROJETO/PAIS/LINGUA/)
            if (!processed) {
                // Procura por /content/ + qualquer projeto + /xx/xx/
                const localeRegex = /^\/content\/[^/]+\/[a-z0-9_-]+\/[a-z0-9_-]+\//;
                if (localeRegex.test(clean)) {
                    clean = clean.replace(localeRegex, '/');
                    processed = true;
                }
            }

            // C. Padrão Live Link (/us-en/)
            if (!processed) {
                const liveRegex = /^\/[a-z]{2}-[a-z]{2}\//;
                if (liveRegex.test(clean)) {
                    clean = clean.replace(liveRegex, '/');
                    processed = true;
                }
            }

            // D. Fallback para XFrags profundos (caso não caia no LM)
            if (!processed && isXFrag) {
                // Tenta achar a estrutura .../xx/xx/ no meio do caminho
                const xfragDeepRegex = /\/experience-fragments\/[^/]+\/.*\/[a-z0-9_-]+\/[a-z0-9_-]+\//;
                if (xfragDeepRegex.test(clean)) {
                    clean = clean.replace(xfragDeepRegex, '/');
                    processed = true;
                }
            }
            
            clean = clean.replace('//', '/');
            if(!clean.startsWith('/')) clean = '/' + clean;

            // 6. Distribuição
            if (isXFrag) {
                if(!foundXFrags.includes(clean)) foundXFrags.push(clean);
            } else {
                // Validação de página: deve ter tamanho mínimo e terminar em html
                if(clean.length > 5 && clean.endsWith('.html') && !foundPages.includes(clean)) {
                    foundPages.push(clean);
                }
            }
        });

        if(foundPages.length === 0 && foundXFrags.length === 0) return alert("No valid links found.");

        // Render Pages (Blue List)
        pagesListContainer.innerHTML = '';
        foundPages.forEach(link => {
            const div = document.createElement('div');
            div.className = 'link-item';
            div.innerHTML = `<input type="checkbox" class="chk-link page-link" value="${link}" checked> ${link}`;
            pagesListContainer.appendChild(div);
        });

        // Render XFrags (Red List)
        xfragsListContainer.innerHTML = '';
        foundXFrags.forEach(link => {
            const div = document.createElement('div');
            div.className = 'link-item';
            div.innerHTML = `<input type="checkbox" class="chk-link xfrag-link" value="${link}" checked> ${link}`;
            xfragsListContainer.appendChild(div);
        });
        
        // Auto-switch tab based on content
        if(foundXFrags.length > 0 && foundPages.length === 0) {
            switchTab('xfrags');
        } else {
            switchTab('pages');
        }

        document.getElementById('step-input').style.display = 'none';
        document.getElementById('step-selection').style.display = 'block';
        saveNavState('loader', 'selection');
        updateCounters();
    });

    // --- SELECT ALL TOGGLES ---

    // Locales Select All (Fixed)
    if(toggleLocales) {
        toggleLocales.onclick = () => {
            const boxes = document.querySelectorAll('.chk-locale');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
        };
    }

    // Pages Select All
    if(togglePages) {
        togglePages.onclick = () => {
            const boxes = pagesListContainer.querySelectorAll('.chk-link');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
        };
    }

    // XFrags Select All
    if(toggleXFrags) {
        toggleXFrags.onclick = () => {
            const boxes = xfragsListContainer.querySelectorAll('.chk-link');
            const allChecked = Array.from(boxes).every(b => b.checked);
            boxes.forEach(b => b.checked = !allChecked);
            updateCounters();
        };
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('chk-locale') || e.target.classList.contains('chk-link')) {
            updateCounters();
        }
    });

    // --- LAUNCH LOGIC ---
    btnLaunch.addEventListener('click', async () => {
        const selectedLocales = Array.from(document.querySelectorAll('.chk-locale:checked')).map(cb => cb.value);
        
        // Collect checked items from BOTH lists
        const selectedPages = Array.from(pagesListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);
        const selectedXFrags = Array.from(xfragsListContainer.querySelectorAll('.chk-link:checked')).map(cb => cb.value);

        const mode = modeSelect.value;
        const openEnSource = chkEnSource.checked;
        const isLiveMode = chkEnLive.checked;

        const totalLinks = selectedPages.length + selectedXFrags.length;

        // Validation
        if ((selectedLocales.length === 0 && !openEnSource) || totalLinks === 0) {
            return alert("Select at least 1 locale and 1 link (Page or XFrag).");
        }
        
        let totalTabs = (selectedLocales.length * totalLinks);
        if (openEnSource) totalTabs += totalLinks;

        if(totalTabs > 30 && !confirm(`Opening ${totalTabs} tabs. Confirm?`)) return;
        if(!chrome.tabGroups) return alert("Missing tabGroups permission.");

        // Function to build URL based on Type (Page vs XFrag)
        const buildUrl = (path, localeCode, isEnSource, isLive) => {
            const baseUrl = "https://prod-cloud-author.aem.ibm.net";
            const isXFrag = selectedXFrags.includes(path); 
            
            // 1. Root Prefix
            const rootPrefix = isXFrag ? "/content/experience-fragments/adobe-cms" : "/content/adobe-cms";

            // 2. Live Link (Only for Pages)
            if (isEnSource && isLive) {
                if(isXFrag) return null; // XFrags usually don't have direct Live URLs
                return `https://www.ibm.com/us-en${path}`;
            }

            // 3. Middle Path (Context)
            let midPath = "";
            if (isEnSource) {
                 // Source: Language Master or US EN
                 midPath = mode.includes('lm') ? "/language-masters/en" : "/us/en";
            } else {
                // Target Locale
                midPath = mode.includes('lm') ? `/language-masters/${localeCode}` : `/${localeCode}`;
            }

            // 4. Full Path
            const fullPath = `${rootPrefix}${midPath}${path}`;

            // 5. Editor vs Preview
            if (mode.includes('edit')) {
                return `${baseUrl}/editor.html${fullPath}`;
            } else {
                return `${baseUrl}${fullPath}?wcmmode=disabled`;
            }
        };

        // --- LOOP 1: EN Source ---
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

        // --- LOOP 2: Target Locales ---
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

    // --- LEGACY/JIRA IMPORTS ---
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
        // Botões novos da v1.9 integrados
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
                        setTimeout(() => { btn.textContent = originalText; alert(s.msg); }, 10);
                    });
                });
            });
        }
    });

    // LISTENERS ESPECIAIS (UNIFICAÇÃO)
    const btnPublish = document.getElementById('publish');
    if(btnPublish) {
        btnPublish.addEventListener("click", () => {
            const originalText = btnPublish.textContent;
            btnPublish.textContent = "...";
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if(!tabs[0]) return;
                chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ["publish.js"] }, () => {
                    setTimeout(() => { btnPublish.textContent = originalText; }, 10);
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
                    window.close(); // Fecha o popup
                });
            });
        });
    }
});