(function () {
  const BTN_ID = 'btn-joblabel';

  function formatDateISO(d = new Date()) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function isJiraBrowseUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname !== 'jsw.ibm.com') return false;
      return /^\/browse\/[A-Z]+-\d+(\b|\/|\?|#)?/i.test(u.pathname);
    } catch { return false; }
  }

  // Função que será executada DENTRO da aba (contexto da página Jira)
  function collectFromJiraPage() {
    function getKey() {
      const m = location.pathname.match(/\/browse\/([A-Z]+-\d+)/i);
      if (m) return m[1];
      const el = document.querySelector('#key-val'); // fallback (view antiga)  ← referência do seu jira-info-qa.js
      return el ? el.textContent.trim() : '?DSSM?';
    }

    function getWorkflow() {
      const target = ["Core", "Custom", "Elite", "Standard", "Core - AIT"];
      // comentários (padrão usado no seu script)
      const commentRoots = [
        '.action-body.flooded',
        '#activitymodule',
        '[data-test-id="activity-feed.ui.activity-feed"]',
      ];
      let text = '';
      for (const sel of commentRoots) {
        const root = document.querySelector(sel);
        if (root) text += ' ' + (root.innerText || '');
      }
      if (!text) text = document.body.innerText || '';
      const lower = text.toLowerCase();
      for (const w of target) {
        if (lower.includes(w.toLowerCase())) return w;
      }
      return '?Workflow?';
    }

    function getSegment() {
      // tentar encontrar a área de descrição em UIs antigas e novas
      const descSelectors = [
        '#description-val',
        '#descriptionmodule .mod-content',
        '[data-test-id="issue-field-description"]',
        'section[data-testid="issue.views.issue-details.foundation.description"]',
        '[data-testid="issue.views.issue-details.foundation.description"]',
      ];
      let root = null;
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el) { root = el; break; }
      }
      // Coletar a primeira URL
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
      } catch {
        return '?Segment?';
      }
    }

    return { dssm: getKey(), workflow: getWorkflow(), segment: getSegment() };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById(BTN_ID);
    if (!btn || !chrome?.tabs || !chrome?.scripting) return;

    btn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab?.url) return;

      if (!isJiraBrowseUrl(tab.url)) {
        alert('Is not a Jira Page');
        return;
      }

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectFromJiraPage
      });

      const d = formatDateISO();
      const dssm = result?.dssm || '?DSSM?';
      const wf   = result?.workflow || '?Workflow?';
      const seg  = result?.segment || '?Segment?';

      const label = `${dssm} - ${wf} - ${seg} - ${d}`;

      const ok = confirm(`Job Label:\n\n${label}\n\nCopy to clipboard?`);
      if (!ok) return;

      try {
        await navigator.clipboard.writeText(label);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = label;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    });
  });
})();
