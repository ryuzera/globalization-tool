// /core/sent-to-translate.js
(function () {
  const BTN_ID = 'btn-sent-to-translate';

  function isAemEditorUrl(url) {
    try {
      const u = new URL(url);
      const isAuthor = u.hostname === 'prod-cloud-author.aem.ibm.net';
      const isEditor = u.pathname.startsWith('/editor.html/');
      return isAuthor && isEditor;
    } catch { return false; }
  }

  // ======================= Jira (executa dentro da aba Jira) =======================
  function collectFromJiraPage() {
    function getKey() {
      const m = location.pathname.match(/\/browse\/([A-Z]+-\d+)/i);
      if (m) return m[1];
      const el = document.querySelector('#key-val'); // fallback (view antiga)
      return el ? el.textContent.trim() : '?DSSM?';
    }
    function getWorkflow() {
      const target = ["Core", "Custom", "Elite", "Standard", "Core - AIT"];
      const pools = [
        '.action-body.flooded',
        '#activitymodule',
        '[data-test-id="activity-feed.ui.activity-feed"]'
      ];
      let text = '';
      for (const sel of pools) {
        const root = document.querySelector(sel);
        if (root) text += ' ' + (root.innerText || '');
      }
      if (!text) text = document.body.innerText || '';
      const lower = text.toLowerCase();
      for (const w of target) if (lower.includes(w.toLowerCase())) return w;
      return '?Workflow?';
    }
    function getSegment() {
      const descSelectors = [
        '#description-val',
        '#descriptionmodule .mod-content',
        '[data-test-id="issue-field-description"]',
        'section[data-testid="issue.views.issue-details.foundation.description"]',
        '[data-testid="issue.views.issue-details.foundation.description"]'
      ];
      let root = null;
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el) { root = el; break; }
      }
      let firstUrl = null;
      if (root) {
        const a = root.querySelector('a[href]');
        if (a && a.href) firstUrl = a.href;
        if (!firstUrl) {
          const txt = root.innerText || '';
          const m = txt.match(/https?:\/\/[^\s)]+/);
          if (m) firstUrl = m[0];
        }
      }
      if (!firstUrl) return '?Segment?';
      try {
        const u = new URL(firstUrl);
        const parts = u.pathname.split('/').filter(Boolean);
        return parts[0] ? `/${parts[0]}/` : '?Segment?';
      } catch { return '?Segment?'; }
    }
    return { dssm: getKey(), workflow: getWorkflow(), segment: getSegment() };
  }

  // ======================= AEM (executa dentro da aba AEM) =======================
  function aemClickSmartlingAndFill(label, opts = {}) {
    const { openDropdown = true, waitForSelectAll = true } = opts;

    const SMARTLING_SEL = '#smartling-job-trigger';
    const PAGEINFO_TOGGLE_SELS = [
      'button[title*="Page Info" i]',
      'button[title*="Page Information" i]',
      'button[aria-label*="Page Info" i]',
      '[data-foundation-tracking-event="page-info"]',
      '.js-editor-PageInfo-openPopover',
      '.js-editor-PageInfo-trigger'
    ];

    const LANG_DROPDOWN_SELS = [
      'button._coral-FieldButton._coral-Dropdown-trigger.smartling-touch-js-coral3-language-selector-popup-button',
      'span.coral-InputGroup-button > button._coral-FieldButton._coral-Dropdown-trigger.smartling-touch-js-coral3-language-selector-popup-button'
    ];

    const TAGLIST_SELECTOR = 'coral-taglist[name="targetLocaleCodes"]';
    const ALLOWED = new Set(['ar','id','zh_cn','fr','de','it','ja','ko_kr','pt_br','es_es','es_la']);

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function q(root, sel) { return (root || document).querySelector(sel); }
    function qa(root, sel) { return Array.from((root || document).querySelectorAll(sel)); }

    function isVisible(el) {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') return false;
      if (el.offsetParent === null && s.position !== 'fixed') return false;
      for (let n = el; n; n = n.parentNode) if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return false;
      return true;
    }
    function isEnabled(el) {
      return el && !el.disabled && el.getAttribute('disabled') === null && el.getAttribute('aria-disabled') !== 'true';
    }
    function simulateClick(el) {
      const opts = { view: window, bubbles: true, cancelable: true, composed: true, buttons: 1 };
      try { el.focus(); } catch {}
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
    }
    function waitFor(predicate, { timeout = 6000, interval = 120 } = {}) {
      return new Promise(resolve => {
        const start = performance.now();
        const tryNow = () => {
          const v = predicate();
          if (v) return resolve(v);
          if (performance.now() - start >= timeout) return resolve(null);
          setTimeout(tryNow, interval);
        };
        const mo = new MutationObserver(() => {
          const v = predicate();
          if (v) { try { mo.disconnect(); } catch {} resolve(v); }
        });
        try { mo.observe(document.documentElement || document.body, { childList: true, subtree: true }); } catch {}
        tryNow();
      });
    }

    function findPageInfoToggle() {
      for (const sel of PAGEINFO_TOGGLE_SELS) { const el = q(null, sel); if (el) return el; }
      const candidates = qa(null, 'button, [role="button"], [is="coral-button"], coral-button');
      return candidates.find(el => (el.title || el.ariaLabel || '').toLowerCase().includes('page info')) || null;
    }
    function findSmartlingBtn() {
      let btn = q(null, SMARTLING_SEL);
      if (btn) return btn;
      const candidates = qa(null, 'button, [role="button"], [is="coral-button"], coral-button');
      const byText = candidates.find(el => (el.innerText || el.textContent || '').trim().toLowerCase().includes('smartling: translate as job'));
      if (byText) return byText;
      btn = q(null, 'button.smartling-menu-item-bound._coral-Button--primary');
      return btn || null;
    }

    async function ensurePageInfoOpen() {
      let btn = findSmartlingBtn();
      if (isVisible(btn) && isEnabled(btn)) return true;
      const toggle = findPageInfoToggle();
      if (toggle) simulateClick(toggle);
      btn = await waitFor(() => {
        const b = findSmartlingBtn();
        return (b && isVisible(b) && isEnabled(b)) ? b : null;
      }, { timeout: 5000, interval: 120 });
      return !!btn;
    }

    async function waitModalAndFill(label) {
      const inputSelectors = [
        'input[name="jobName"]',
        'input.coral-Form-field[name="jobName"]',
        'input[is="coral-textfield"][name="jobName"]',
        'input._coral-Textfield[name="jobName"]'
      ];
      const inputEl = await waitFor(() => {
        for (const sel of inputSelectors) {
          const el = q(null, sel);
          if (el && isVisible(el)) return el;
        }
        return null;
      }, { timeout: 6000, interval: 120 });

      if (!inputEl) return { ok: false, message: 'jobName input not found', modalRoot: null };

      const modalRoot =
        inputEl.closest('coral-dialog') ||
        q(null, 'coral-dialog[open]') ||
        inputEl.closest('.coral-Dialog, ._coral-Dialog') ||
        document.body;

      try {
        inputEl.focus();
        inputEl.value = label;
        inputEl.setAttribute('value', label);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, message: 'label filled', modalRoot };
      } catch (e) {
        return { ok: false, message: 'fill failed: ' + (e && e.message ? e.message : String(e)), modalRoot };
      }
    }

    async function openLangDropdown(modalRoot) {
      // tenta dentro do modal; se não achar, tenta no documento (algumas instâncias rendem fora)
      let btn = null; let tries = 3;
      while (!btn && tries-- > 0) {
        for (const sel of LANG_DROPDOWN_SELS) {
          btn = q(modalRoot, sel) || q(null, sel);
          if (btn && isVisible(btn) && isEnabled(btn)) break;
        }
        if (!btn) await sleep(120);
      }
      if (!btn) return { ok: false, message: 'language dropdown button not found' };

      // alguns Coral exigem dois cliques para abrir/forçar foco no popover
      simulateClick(btn);
      await sleep(120);
      simulateClick(btn);
      await sleep(150);

      return { ok: true };
    }

    async function pruneAfterUserSelection(modalRoot) {
      const taglist = await waitFor(() => {
        const el = q(modalRoot, TAGLIST_SELECTOR) || q(null, TAGLIST_SELECTOR);
        return (el && isVisible(el)) ? el : null;
      }, { timeout: 6000, interval: 120 });
      if (!taglist) return { ok: false, message: 'taglist not found' };

      // Espera você clicar em "Select All" (ou alguma seleção) → ao menos 1 tag
      const populated = await waitFor(
        () => qa(taglist, 'coral-tag._coral-Tags-item').length > 0,
        { timeout: 12000, interval: 120 }
      );
      if (!populated) return { ok: false, message: 'no tags added (click Select All, then wait a moment)' };

      async function removeTag(tag) {
        const removeBtn = q(tag, 'button._coral-Tags-item-removeButton');
        if (!removeBtn || removeBtn.getAttribute('aria-disabled') === 'true') return false;

        const removal = new Promise(resolve => {
          const mo = new MutationObserver(() => {
            if (!tag.isConnected) { try { mo.disconnect(); } catch {} resolve(true); }
          });
          try { mo.observe(taglist, { childList: true, subtree: true }); } catch { resolve(false); }
          setTimeout(() => { try { mo.disconnect(); } catch {} resolve(!tag.isConnected); }, 900);
        });

        simulateClick(removeBtn);
        try { removeBtn.click(); } catch {}
        await sleep(80);

        return await removal;
      }

      let safety = 150, changed = true;
      while (changed && safety-- > 0) {
        changed = false;
        const tags = qa(taglist, 'coral-tag._coral-Tags-item');
        for (const tag of tags) {
          const val = (tag.getAttribute('value') || '').trim();
          if (!ALLOWED.has(val)) {
            const ok = await removeTag(tag);
            if (ok) changed = true;
            await sleep(60);
          }
        }
      }

      const remaining = qa(taglist, 'coral-tag._coral-Tags-item').map(t => (t.getAttribute('value') || '').trim());
      const allAllowed = remaining.every(v => ALLOWED.has(v));
      return { ok: allAllowed, message: allAllowed ? 'locales pruned' : 'some locales could not be removed: ' + remaining.join(', ') };
    }

    // ————— fluxo principal no AEM —————
    return (async () => {
      const opened = await ensurePageInfoOpen();
      if (!opened) return { ok: false, message: 'Smartling trigger not visible/enabled' };

      const btn = findSmartlingBtn();
      if (!btn) return { ok: false, message: 'Smartling trigger not found' };

      try { simulateClick(btn); } catch (e) { return { ok: false, message: 'click failed: ' + String(e) }; }

      const filled = await waitModalAndFill(label);
      if (!filled.ok) return filled;
      const modalRoot = filled.modalRoot || document;

      if (openDropdown) {
        const dd = await openLangDropdown(modalRoot);
        if (!dd.ok) return dd; // deixa o Select All visível
      }

      if (waitForSelectAll) {
        const pruned = await pruneAfterUserSelection(modalRoot);
        return pruned.ok ? { ok: true, message: 'done' } : pruned;
      }

      return { ok: true, message: 'label filled (dropdown opened)' };
    })();
  }

  // ======================= Orquestração no popup =======================
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById(BTN_ID);
    if (!btn || !chrome?.tabs) return;

    btn.addEventListener('click', async () => {
      try {
        const [aemTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!aemTab?.id || !aemTab?.url || !isAemEditorUrl(aemTab.url)) { window.close(); return; }

        // Coleta (Jira)
        let jiraData = { dssm: '?DSSM?', workflow: '?Workflow?', segment: '?Segment?' };
        try {
          const tabs = await chrome.tabs.query({ currentWindow: true });
          const jiraTab = tabs.find(t => {
            try {
              const u = new URL(t.url || '');
              return u.hostname === 'jsw.ibm.com' && /^\/browse\/[A-Z]+-\d+(\b|\/|\?|#)?/i.test(u.pathname);
            } catch { return false; }
          });
          if (jiraTab?.id && chrome.scripting?.executeScript) {
            const [{ result }] = await chrome.scripting.executeScript({
              target: { tabId: jiraTab.id },
              func: collectFromJiraPage
            });
            if (result) jiraData = result;
          } else if (jiraTab?.url) {
            const m = jiraTab.url.match(/\/browse\/([A-Z]+-\d+)/i);
            if (m) jiraData.dssm = m[1];
          }
        } catch {}

        const todayISO = new Date().toISOString().slice(0,10); // YYYY-MM-DD
        const label = `${jiraData.dssm || '?DSSM?'} - ${jiraData.workflow || '?Workflow?'} - ${jiraData.segment || '?Segment?'} - ${todayISO}`;

        // Fire-and-forget: injeta no AEM e fecha popup imediatamente
        if (chrome.scripting?.executeScript) {
          chrome.scripting.executeScript({
            target: { tabId: aemTab.id },
            args: [label, { openDropdown: true, waitForSelectAll: true }],
            func: aemClickSmartlingAndFill
          });
        }
      } finally {
        try { window.close(); } catch {}
      }
    });
  });
})();