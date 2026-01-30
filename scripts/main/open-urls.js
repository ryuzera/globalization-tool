(() => {
  console.log('Open All Links v2.4.0 – Locale & Compliance Audit');
  const existing = document.getElementById('open-all-links__overlay');
  if (existing) existing.remove();

  try {
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
    scope.forEach(root => anchors.push(...root.querySelectorAll('a[href]')));

    const blockedHosts = new Set(['w3.ibm.com', 'apps.w3.ibm.com']);
    const localePrefix = /^\/[a-z]{2}-[a-z]{2}\//i;
    
    const ALLOWED_LOCALES = [
      "cn-zh", "fr-fr", "de-de", "it-it", "jp-ja", "kr-ko", 
      "br-pt", "es-es", "mx-es", "id-id", "sa-ar", "ae-ar", "qa-ar"
    ];

    const inArticleContext = (a) => !!a.closest([
      '.cms-richtext', '.leadspace-article', '.table-of-contents', 
      '.article-content-slot', '.body-article-8', '.content-page .container'
    ].join(','));

    const ccLcHasEN = (pathname) => {
      const m = pathname.match(/\/([a-z]{2})[-_]([a-z]{2})(?=\/|$)/i);
      if (!m) return false;
      const cc = m[1].toLowerCase();
      const lc = m[2].toLowerCase();
      const combinations = [`${cc}-${lc}`, `${cc}_${lc}`];
      const specials = ['en-gl', 'gb-en', 'en-us', 'en_us'];
      return cc === 'en' || lc === 'en' || combinations.some(c => specials.includes(c));
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
      const style = window.getComputedStyle(a);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      let u; try { u = new URL(a.href); } catch { return false; }
      if (blockedHosts.has(u.hostname)) return false;
      if (!inArticleContext(a)) return false;
      if (u.hostname === 'www.ibm.com' && localePrefix.test(u.pathname)) return false;
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
      const hasEnLocale = ccLcHasEN(u.pathname) || enInQuery(u.search);
      const invalidLocale = isInvalidLocale(u.pathname);
      
      const targetLabel = (a.getAttribute('target') || '').toLowerCase() === '_blank' ? 'New Tab' : 'Same Tab';
      const isInsecure = url.toLowerCase().startsWith('http://');

      let status = 'ok'; 
      let note = '';

      if (hasEnLocale) {
        status = isIBM ? 'warning' : 'error';
        note = `${isIBM ? 'IBM' : 'EXTERNAL'} link with EN locale`;
      } 
      else if (invalidLocale) {
        status = 'warning';
        note = `Non-compliant locale detected`;
      }
      else if (isInsecure) {
        status = 'error';
        note = 'INSECURE HTTP LINK';
      }

      links.push({ url, targetLabel, status, note });
    }

    // --- Interface Visual ---
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
    header.innerHTML = `<h3 style="margin:0; font-size:18px;">Link Audit (Locale & Compliance)</h3>`;
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px', borderBottom: '1px solid #e0e0e0'
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, { border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer' });
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    Object.assign(body.style, { padding: '16px', overflow: 'auto', flex: '1' });

    const list = document.createElement('ol');
    list.style.paddingLeft = '25px';

    const truncate = (t) => (t.length > 75 ? t.slice(0, 72) + '...' : t);

    links.forEach(({ url, targetLabel, status, note }) => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'baseline';
      row.style.gap = '8px';

      const linkEl = document.createElement('a');
      linkEl.href = url;
      linkEl.target = '_blank';
      linkEl.textContent = truncate(url);
      linkEl.style.textDecoration = 'none';
      linkEl.style.fontSize = '14px';

      if (status === 'error') {
        linkEl.style.color = '#da1e28';
        linkEl.style.fontWeight = 'bold';
      } else if (status === 'warning') {
        linkEl.style.color = '#8a6a00';
        linkEl.style.fontWeight = '600';
      } else {
        linkEl.style.color = '#0f62fe';
      }

      const targetSpan = document.createElement('span');
      targetSpan.textContent = `(${targetLabel})`;
      targetSpan.style.fontSize = '11px';
      targetSpan.style.color = '#8d8d8d';
      targetSpan.style.whiteSpace = 'nowrap';

      row.appendChild(linkEl);
      row.appendChild(targetSpan);
      li.appendChild(row);

      if (note) {
        const noteEl = document.createElement('div');
        noteEl.style.fontSize = '11px';
        noteEl.style.color = status === 'error' ? '#da1e28' : '#8a6a00';
        noteEl.style.marginTop = '2px';
        noteEl.style.fontWeight = '600';
        noteEl.textContent = `⚠️ ${note}`;
        li.appendChild(noteEl);
      }

      list.appendChild(li);
    });

    body.appendChild(list);

    const footer = document.createElement('div');
    footer.style.padding = '16px';
    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
    closeBtn.addEventListener('click', cleanup);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cleanup(); }, { once: true });

  } catch (err) {
    console.error('Open All Links error:', err);
  }
})();