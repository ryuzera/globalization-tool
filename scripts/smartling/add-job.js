// /core/add-job.js
(function () {
  const BTN_ID = "btn-addjob";

  function isAemEditor(url) {
    try {
      const u = new URL(url);
      return (
        u.hostname === "prod-cloud-author.aem.ibm.net" &&
        u.pathname.startsWith("/editor.html/")
      );
    } catch {
      return false;
    }
  }

  // ======================================================
  // EXECUTA DENTRO DA ABA DO AEM
  // ======================================================
  function addJobAction() {

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function simulateClick(el) {
      const opts = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        buttons: 1
      };
      try { el.focus(); } catch {}
      el.dispatchEvent(new PointerEvent("pointerdown", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.dispatchEvent(new MouseEvent("click", opts));
    }

    async function waitUntil(fn, timeout = 8000) {
      const start = performance.now();
      while (performance.now() - start < timeout) {
        const val = fn();
        if (val) return val;
        await sleep(120);
      }
      return null;
    }

    // =====================================================
    // 1) GARANTIR QUE O PAINEL “PAGE INFO / PROPERTIES” ABRA
    // =====================================================
    async function openPropertiesPanel() {
      // 1) encontra qualquer ícone que abra o painel
      const icon = await waitUntil(() =>
        document.querySelector('coral-icon[icon="properties"]') ||
        document.querySelector('coral-icon[icon="localization"]') ||
        document.querySelector('button.js-editor-PageInfo-trigger') ||
        document.querySelector('.js-editor-PageInfo-trigger')
      );

      if (!icon) return false;

      simulateClick(icon);
      await sleep(350);

      // 2) esperar o painel renderizar (Smartling aparece dentro dele)
      const smart = await waitUntil(() =>
        document.querySelector("#smartling-job-trigger")
      );

      return !!smart;
    }

    // =====================================================
    // 2) AGORA SIM – Clicar no botão Smartling
    // =====================================================
    async function clickSmartling() {
      const smartBtn = await waitUntil(() =>
        document.querySelector("#smartling-job-trigger")
      );
      if (!smartBtn) return false;
      simulateClick(smartBtn);
      return true;
    }

    // =====================================================
    // 3) Esperar o modal abrir
    // =====================================================
    async function waitForModal() {
      return await waitUntil(() =>
        document.querySelector("coral-dialog[open]")
      );
    }

    // =====================================================
    // 4) Clicar aba Add to Job
    // =====================================================
    async function clickAddToJob() {
      const tab = await waitUntil(() =>
        [...document.querySelectorAll("coral-tab")]
          .find(t => (t.innerText || t.textContent).trim().toLowerCase() === "add to job")
      );
      if (!tab) return false;
      simulateClick(tab);
      return true;
    }

    // -------------------- MAIN FLOW ----------------------
    async function run() {

      // 1️⃣ abrir o painel properties (fundamental)
      const opened = await openPropertiesPanel();
      if (!opened) return { ok: false, msg: "Properties panel did not open" };

      await sleep(250);

      // 2️⃣ clicar Smartling
      const smartOK = await clickSmartling();
      if (!smartOK) return { ok: false, msg: "Smartling trigger failed" };

      await sleep(300);

      // 3️⃣ esperar modal
      const modal = await waitForModal();
      if (!modal) return { ok: false, msg: "Modal failed" };

      await sleep(350);

      // 4️⃣ clicar Add to Job
      const tabOK = await clickAddToJob();
      if (!tabOK) return { ok: false, msg: "Add to Job click failed" };

      return { ok: true };
    }

    return run();
  }

  // ======================================================
  // POPUP HANDLER
  // ======================================================
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById(BTN_ID);
    if (!btn || !chrome?.tabs) return;

    btn.addEventListener("click", async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.url || !isAemEditor(tab.url)) {
          window.close();
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: addJobAction,
        });

      } finally {
        window.close();
      }
    });
  });
})();