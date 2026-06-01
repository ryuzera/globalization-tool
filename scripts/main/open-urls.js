(() => {
  const existing = document.getElementById('open-all-links__overlay');
  if (existing) existing.remove();

  try {
    // === (LOCALSTORAGE) ===
    const storageKey = 'auditTool_openedLinks';
    let openedLinks = new Set();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) openedLinks = new Set(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load history', e);
    }

    const saveOpenedLinks = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(openedLinks)));
      } catch (e) {
        console.warn('Failed to save history', e);
      }
    };
    // ============================================

    const contentRoots = Array.from(
      document.querySelectorAll([
        'main', 'article', '.leadspace-container', '.content-page',
        '.table-of-contents', '.article-content-slot', '.body-article-8',
        '.container.responsivegrid:not(.masthead):not(.footer)'
      ].join(','))
    ).filter(root => !root.closest([
      'c4d-masthead-container', 'c4d-footer-container', '.masthead',
      '.footer', '.side-nav-section', 'header', 'footer', 'nav', 'aside',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
    ].join(',')));

    const scope = contentRoots.length > 0 ? contentRoots : [document.body];
    let anchors = [];

    const collectLinks = (root) => {
      anchors.push(...root.querySelectorAll('a[href], [href]'));
      root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          anchors.push(...el.shadowRoot.querySelectorAll('a[href], [href]'));
        }
      });
    };

    scope.forEach(root => collectLinks(root));

    const blockedHosts = new Set(['w3.ibm.com', 'apps.w3.ibm.com']);
    const localePrefix = /^\/[a-z]{2}-[a-z]{2}\//i;
    
    const ALLOWED_LOCALES = [
      "cn-zh", "fr-fr", "de-de", "it-it", "jp-ja", "kr-ko", 
      "br-pt", "es-es", "mx-es", "id-id", "sa-ar", "ae-ar", "qa-ar"
    ];

    const inArticleContext = (a) => !!a.closest([
      '.cms-richtext',
      '.leadspace-article',
      '.leadspace-container',
      '.table-of-contents',
      '.article-content-slot',
      '.body-article-8',
      '.content-page .container'
    ].join(','));

    const ccLcHasEN = (pathname, search) => {
      const inPath = /(?:^|\/)(?:[a-z]{2}[-_]en|en[-_][a-z]{2})(?=\/|$)/i.test(pathname);
      const inQuery = /\b(?:lang|locale|lc|cc)=(?:[a-z]{2}[-_]en|en[-_][a-z]{2}|en|en[-_]us)\b/i.test(search || '');
      return inPath || inQuery;
    };

    const isInvalidLocale = (pathname) => {
      const m = pathname.match(/\/([a-z]{2})[-_]([a-z]{2})(?=\/|$)/i);
      if (!m) return false; 
      const currentLocale = `${m[1].toLowerCase()}-${m[2].toLowerCase()}`;
      return !ALLOWED_LOCALES.includes(currentLocale);
    };

    const enInQuery = (search) => {
      return /\b(?:lang|locale|lc|cc)=(?:[a-z]{2}[-_]en|en[-_][a-z]{2}|en|en[-_]us)\b/i.test(search || '');
    };

    const rawLinks = anchors.filter(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if (a.closest('c4d-masthead-container, c4d-footer-container, .masthead, .footer, .side-nav-section, header, footer, nav, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .video-modal-overlay, .page-modal-wrapper, .share-module, .cds-btn--share-module')) return false;
      
      let style;
      try {
        style = window.getComputedStyle(a);
      } catch {
        return false;
      }
      
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      let u; try { u = new URL(a.href); } catch { return false; }
      if (blockedHosts.has(u.hostname)) return false;
      if (!inArticleContext(a)) return false;
      if (u.hostname === 'www.ibm.com' && localePrefix.test(u.pathname)) { }
      return true;
    });

    const seen = new Set();
    const links = [];

    const getNormalizedUrl = (urlString) => {
      try {
        const u = new URL(urlString);
        const normalizedPath = u.pathname.replace(/\/([a-z]{2}([-_][a-z]{2,3})?)\//i, '/');
        u.searchParams.sort();
        return `${u.hostname}${normalizedPath}${u.search}`;
      } catch (e) {
        return urlString;
      }
    };

    for (const a of rawLinks) {
      const url = a.href;
      if (!url) continue;
      const normalized = getNormalizedUrl(url);
      if (seen.has(normalized)) continue; 
      seen.add(normalized);
      let u; try { u = new URL(url); } catch { continue; }
      const isIBM = u.hostname.endsWith('ibm.com') && u.hostname !== 'ibm.webcasts.com';
      const hasEnLocale = ccLcHasEN(u.pathname, u.search) || enInQuery(u.search);
      const invalidLocale = isInvalidLocale(u.pathname);
      const targetLabel = (a.getAttribute('target') || '').toLowerCase() === '_blank' ? 'New Tab' : 'Same Tab';
      const isInsecure = url.toLowerCase().startsWith('http://');
      let status = 'ok'; 
      let note = '';
      
      if (hasEnLocale) {
        status = isIBM ? 'warning' : 'error';
        note = `${isIBM ? 'IBM' : 'EXTERNAL'} link with EN locale`;
      } else if (invalidLocale) {
        status = 'warning';
        note = `Non-compliant locale detected`;
      } else if (isInsecure) {
        status = 'error';
        note = 'INSECURE HTTP LINK';
      }
      links.push({ url, targetLabel, status, note });
    }

    const overlay = document.createElement('div');
    overlay.id = 'open-all-links__overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '2147483647'
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95vw',
      maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif', boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px', borderBottom: '1px solid #e0e0e0'
    });

    const headerLeft = document.createElement('div');
    headerLeft.style.display = 'flex';
    headerLeft.style.alignItems = 'center';
    headerLeft.style.gap = '12px';
    
    const title = document.createElement('h3');
    title.textContent = 'Link Audit (Locale & Compliance)';
    title.style.margin = '0';
    title.style.fontSize = '18px';

    const clearHistoryBtn = document.createElement('button');
    clearHistoryBtn.textContent = 'Clear History';
    Object.assign(clearHistoryBtn.style, {
      background: 'transparent', border: '1px solid #c6c6c6', borderRadius: '4px',
      fontSize: '12px', padding: '4px 8px', cursor: 'pointer', color: '#161616'
    });
    
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the opened links history?')) {
        openedLinks.clear();
        saveOpenedLinks();
        alert('History cleared! Please close and re-run the script to see changes.');
      }
    });

    headerLeft.appendChild(title);
    headerLeft.appendChild(clearHistoryBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, { border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer' });
    
    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    Object.assign(body.style, { padding: '16px', overflow: 'auto', flex: '1' });

    const list = document.createElement('ol');
    list.style.paddingLeft = '25px';

    const truncate = (t) => (t.length > 75 ? t.slice(0, 72) + '...' : t);

    const checkboxElements = [];
    let lastCheckedIndex = null;

    links.forEach(({ url, targetLabel, status, note }, index) => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';
      
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      const isAlreadyOpened = openedLinks.has(url);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !isAlreadyOpened; 
      checkbox.dataset.url = url;
      checkbox.style.cursor = 'pointer';
      checkbox.style.width = '16px';
      checkbox.style.height = '16px';
      
      checkbox.addEventListener('click', (e) => {
        if (e.shiftKey && lastCheckedIndex !== null) {
          const start = Math.min(lastCheckedIndex, index);
          const end = Math.max(lastCheckedIndex, index);
          const isChecked = checkbox.checked;
          
          for (let i = start; i <= end; i++) {
            checkboxElements[i].checked = isChecked;
          }
        }
        lastCheckedIndex = index;
        updateButtonsState();
      });

      checkboxElements.push(checkbox);

      const linkEl = document.createElement('a');
      linkEl.href = url;
      linkEl.target = '_blank';
      linkEl.textContent = truncate(url);
      linkEl.style.textDecoration = 'none';
      linkEl.style.fontSize = '14px';
      linkEl.style.transition = 'all 0.3s ease';

      if (status === 'error') {
        linkEl.style.color = '#da1e28';
        linkEl.style.fontWeight = 'bold';
      } else if (status === 'warning') {
        linkEl.style.color = '#8a6a00';
        linkEl.style.fontWeight = '600';
      } else {
        linkEl.style.color = '#0f62fe';
      }

      const applyOpenedStyle = (el) => {
        el.style.textDecoration = 'line-through';
        el.style.color = '#24a148';
        el.style.opacity = '0.7';
        if (!el.textContent.includes('✅')) {
          el.innerHTML = `✅ ${el.textContent}`;
        }
      };

      if (isAlreadyOpened) applyOpenedStyle(linkEl);

      const targetSpan = document.createElement('span');
      targetSpan.textContent = `(${targetLabel})`;
      targetSpan.style.fontSize = '11px';
      targetSpan.style.color = '#8d8d8d';
      targetSpan.style.whiteSpace = 'nowrap';

      row.appendChild(checkbox);
      row.appendChild(linkEl);
      row.appendChild(targetSpan);
      li.appendChild(row);

      if (note) {
        const noteEl = document.createElement('div');
        noteEl.style.fontSize = '11px';
        noteEl.style.color = status === 'error' ? '#da1e28' : '#8a6a00';
        noteEl.style.marginTop = '2px';
        noteEl.style.fontWeight = '600';
        noteEl.style.paddingLeft = '24px';
        noteEl.textContent = `⚠️ ${note}`;
        li.appendChild(noteEl);
      }
      list.appendChild(li);
    });

    body.appendChild(list);

    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px'
    });

    const selectAllBtn = document.createElement('button');
    Object.assign(selectAllBtn.style, {
      background: '#e0e0e0', color: '#161616', border: 'none', borderRadius: '4px',
      padding: '10px 20px', fontWeight: '600', cursor: 'pointer', flex: '1'
    });

    const openSelectedBtn = document.createElement('button');
    Object.assign(openSelectedBtn.style, {
      background: '#0f62fe', color: '#fff', border: 'none', borderRadius: '4px',
      padding: '10px 20px', fontWeight: '600', cursor: 'pointer', flex: '2'
    });

    const updateButtonsState = () => {
      const checkedCount = checkboxElements.filter(cb => cb.checked).length;
      
      if (checkedCount === checkboxElements.length && checkedCount > 0) {
        selectAllBtn.textContent = 'Unselect All';
      } else {
        selectAllBtn.textContent = 'Select All';
      }
      
      openSelectedBtn.textContent = `Open selected links (${checkedCount})`;
      openSelectedBtn.disabled = checkedCount === 0;
      openSelectedBtn.style.opacity = checkedCount === 0 ? '0.5' : '1';
      openSelectedBtn.style.cursor = checkedCount === 0 ? 'not-allowed' : 'pointer';
    };

    selectAllBtn.addEventListener('click', () => {
      const allChecked = checkboxElements.every(cb => cb.checked);
      checkboxElements.forEach(cb => cb.checked = !allChecked);
      updateButtonsState();
    });

    const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };

    openSelectedBtn.addEventListener('click', () => {
      const checkedBoxes = checkboxElements.filter(cb => cb.checked);
      
      if (checkedBoxes.length === 0) return;

      if (confirm(`Are you sure you want to open ${checkedBoxes.length} links?`)) {
        checkedBoxes.forEach((cb, i) => {
          setTimeout(() => {
            window.open(cb.dataset.url, '_blank', 'noopener');
            
            openedLinks.add(cb.dataset.url);
            saveOpenedLinks();
            
            const linkEl = cb.parentElement.querySelector('a');
            linkEl.style.textDecoration = 'line-through';
            linkEl.style.color = '#24a148';
            linkEl.style.opacity = '0.7';
            if (!linkEl.textContent.includes('✅')) {
              linkEl.innerHTML = `${linkEl.textContent}`;
            }
            
            cb.checked = false;
            
            if (i === checkedBoxes.length - 1) {
              updateButtonsState();
            }
          }, i * 200);
        });
      }
    });
    
    footer.appendChild(selectAllBtn);
    footer.appendChild(openSelectedBtn);
    
    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    updateButtonsState();

    closeBtn.addEventListener('click', cleanup);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cleanup(); }, { once: true });

  } catch (err) {
    console.error('Audit Tool Error:', err);
  }
})();