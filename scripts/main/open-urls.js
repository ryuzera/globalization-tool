
(() => {
  console.log('Open All Links v2.2.6 (Content mode) – generic en detection in cc-lc, margins + robust outside notice + fixes');
  const existing = document.getElementById('open-all-links__overlay');
  if (existing) existing.remove();
  try {
    const contentRoots = Array.from(
      document.querySelectorAll([
        'main',
        'article',
        '.leadspace-container',
        '.content-page',
        '.table-of-contents',
        '.article-content-slot',
        '.body-article-8',
        '.container.responsivegrid:not(.masthead):not(.footer)'
      ].join(','))
    ).filter(root => !root.closest([
      'c4d-masthead-container',
      'c4d-footer-container',
      '.masthead',
      '.footer',
      '.side-nav-section',
      'header', 'footer', 'nav', 'aside',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
    ].join(',')));

    const scope = contentRoots.length > 0 ? contentRoots : [document.body];

    let anchors = [];
    scope.forEach(root => anchors.push(...root.querySelectorAll('a[href]')));

    const blockedHosts = new Set(['w3.ibm.com','apps.w3.ibm.com']);
    const localePrefix = /^\/[a-z]{2}-[a-z]{2}\//i;

    const inArticleContext = (a) => !!a.closest([
      '.cms-richtext', '.leadspace-article', '.table-of-contents', '.article-content-slot', '.body-article-8', '.content-page .container'
    ].join(','));

    const rawLinks = anchors.filter(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if (a.closest('c4d-masthead-container, c4d-footer-container')) return false;
      if (a.closest('.masthead, .footer, .side-nav-section')) return false;
      if (a.closest('header, footer, nav, aside')) return false;
      if (a.closest('[role="navigation"], [role="banner"], [role="contentinfo"]')) return false;
      if (a.closest('.video-modal-overlay, .page-modal-wrapper')) return false;
      if (a.closest('.share-module, .cds-btn--share-module')) return false;
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

    // Helper: detect cc-lc with any 'en' side (en-xx or xx-en)
    const ccLcHasEN = (pathname) => {
      const m = pathname.match(/\/([a-z]{2})-([a-z]{2})(?=\/|$)/i);
      if (!m) return false;
      const [, cc, lc] = m;
      return cc.toLowerCase() === 'en' || lc.toLowerCase() === 'en';
    };

    const enInQuery = (search) => /\b(?:lang|locale|lc|cc)=(?:en|en-[a-z]{2}|[a-z]{2}-en)\b/i.test(search || '');

    for (const a of rawLinks) {
      const url = a.href;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const originalTarget = (a.getAttribute('target') || '').toLowerCase();
      const targetLabel = originalTarget === '_blank' ? 'New Tab' : 'Same Tab';
      const lowerUrl = url.toLowerCase();
      let u; try { u = new URL(url); } catch { continue; }
      const markLocale = ccLcHasEN(u.pathname) || enInQuery(u.search);
      const isInsecure = lowerUrl.startsWith('http://');
      links.push({ url, targetLabel, markLocale, isInsecure });
    }

    const overlay = document.createElement('div');
    overlay.id = 'open-all-links__overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2147483647';

    const panel = document.createElement('div');
    panel.style.background = '#fff';
    panel.style.borderRadius = '10px';
    panel.style.boxShadow = '0 8px 28px rgba(0,0,0,.25)';
    panel.style.width = '700px';
    panel.style.maxWidth = '90vw';
    panel.style.maxHeight = '85vh';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.fontFamily = 'IBM Plex Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '14px 16px';
    header.style.borderBottom = '1px solid #e0e0e0';

    const title = document.createElement('h3');
    title.textContent = 'Checking Links (cc-lc)';
    title.style.margin = '0';
    title.style.fontSize = '18px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.padding = '12px 16px 0 16px';
    body.style.overflow = 'auto';

    const hint = document.createElement('div');
    hint.style.fontSize = '12px';
    hint.style.color = '#6f6f6f';
    hint.style.margin = '2px 0 8px 0';
    hint.textContent = `Found ${links.length} link(s) in content areas.`;

    const list = document.createElement('ol');
    list.style.margin = '8px 0 12px 0px';
    list.style.padding = '0';

    const truncate = (t, m = 60) => (t.length > m ? t.slice(0, m) + '...' : t);

    links.forEach(({ url, targetLabel, markLocale, isInsecure }) => {
      const li = document.createElement('li');
      li.style.margin = '0 0 10px 0';

      const linkEl = document.createElement('a');
      linkEl.href = url;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener';
      linkEl.textContent = truncate(url);

      if (markLocale) {
        linkEl.style.color = '#da1e28';
        linkEl.style.fontWeight = '700';
      } else if (isInsecure) {
        linkEl.style.color = '#da1e28';
      } else {
        linkEl.style.color = '#0f62fe';
      }

      linkEl.style.textDecoration = 'none';
      linkEl.style.cursor = 'pointer';
      linkEl.addEventListener('mouseover', () => (linkEl.style.textDecoration = 'underline'));
      linkEl.addEventListener('mouseout', () => (linkEl.style.textDecoration = 'none'));

      const meta = document.createElement('span');
      meta.textContent = ` — Target: ${targetLabel}`;
      meta.style.fontSize = '11px';
      meta.style.color = '#6f6f6f';

      li.appendChild(linkEl);
      li.appendChild(meta);
      list.appendChild(li);
    });

    body.appendChild(hint);
    body.appendChild(list);

    try {
      const textLC = (document.body.innerText || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const htmlLC = (document.body.innerHTML || '').toLowerCase().replace(/\s+/g, ' ');
      const patterns = [
        /\blinks?\s+reside[s]?\s+outside\s+of\s+ibm\.com\b/,
        /\blinks?\s+reside[s]?\s+outside\s+of\s+<a[^>]*>\s*ibm\.com\s*<\/a>/
      ];
      const matched = patterns.some(rx => rx.test(textLC)) || patterns.some(rx => rx.test(htmlLC));
      if (matched) {
        const warn = document.createElement('div');
        warn.textContent = 'Has text: link resides outside of ibm.com';
        warn.style.color = '#da1e28';
        warn.style.fontWeight = '700';
        warn.style.margin = '8px 0 0 0';
        body.appendChild(warn);
      }
    } catch (e) { console.warn('Warning check failed', e); }

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.gap = '8px';
    footer.style.padding = '12px 16px 16px 16px';

    const openAllBtn = document.createElement('button');
    openAllBtn.textContent = 'Open All Links';
    openAllBtn.style.background = 'linear-gradient(45deg, #3ABEF9, #3572EF)';
    openAllBtn.style.color = '#fff';
    openAllBtn.style.border = 'none';
    openAllBtn.style.borderRadius = '8px';
    openAllBtn.style.padding = '10px 14px';
    openAllBtn.style.fontWeight = '600';
    openAllBtn.style.cursor = 'pointer';

//    footer.appendChild(openAllBtn);
  
panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function showConfirmDialog(onConfirm) {
      const dlg = document.createElement('div');
      dlg.style.position = 'absolute';
      dlg.style.inset = '0';
      dlg.style.background = 'rgba(255,255,255,0.9)';
      dlg.style.display = 'flex';
      dlg.style.alignItems = 'center';
      dlg.style.justifyContent = 'center';

      const box = document.createElement('div');
      box.style.background = '#fff';
      box.style.border = '1px solid #e0e0e0';
      box.style.borderRadius = '8px';
      box.style.boxShadow = '0 4px 16px rgba(0,0,0,.15)';
      box.style.padding = '16px';
      box.style.width = '360px';
      box.style.textAlign = 'center';

      const msg = document.createElement('div');
      msg.textContent = 'Are you sure to open more than 30 URLs?';
      msg.style.marginBottom = '12px';
      msg.style.fontWeight = '600';

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'center';
      row.style.gap = '8px';

      const ok = document.createElement('button');
      ok.textContent = 'Open All Links';
      ok.style.background = 'linear-gradient(45deg, #3ABEF9, #3572EF)';
      ok.style.color = '#fff';
      ok.style.border = 'none';
      ok.style.borderRadius = '6px';
      ok.style.padding = '8px 10px';
      ok.style.cursor = 'pointer';

      const cancel = document.createElement('button');
      cancel.textContent = 'Cancel';
      cancel.style.background = '#e0e0e0';
      cancel.style.color = '#161616';
      cancel.style.border = 'none';
      cancel.style.borderRadius = '6px';
      cancel.style.padding = '8px 10px';
      cancel.style.cursor = 'pointer';

      row.appendChild(ok);
      row.appendChild(cancel);
      box.appendChild(msg);
      box.appendChild(row);
      dlg.appendChild(box);

      panel.style.position = 'relative';
      panel.appendChild(dlg);

      ok.addEventListener('click', () => { dlg.remove(); onConfirm(); });
      cancel.addEventListener('click', () => dlg.remove());
    }

    function openAllNow() {
      const batch = 8; let i = 0;
      function openBatch() {
        const end = Math.min(i + batch, links.length);
        for (; i < end; i++) window.open(links[i].url, '_blank', 'noopener');
        if (i < links.length) setTimeout(openBatch, 60);
      }
      openBatch();
    }

    openAllBtn.addEventListener('click', () => {
      if (links.length > 30) showConfirmDialog(openAllNow); else openAllNow();
    });

    function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      window.removeEventListener('keydown', onKey);
      ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => overlay.removeEventListener(evt, resetIdle));
      if (idleTimer) clearTimeout(idleTimer);
    }

    const onKey = (e) => { if (e.key === 'Escape') cleanup(); };
    closeBtn.addEventListener('click', cleanup);
    window.addEventListener('keydown', onKey);

    let idleTimer = null;
    const IDLE_MS = 2 * 60 * 1000;
    function resetIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => cleanup(), IDLE_MS);
    }
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => overlay.addEventListener(evt, resetIdle));
    resetIdle();
  } catch (err) {
    console.error('Open All Links error:', err);
  }
})();
