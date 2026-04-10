(function () {
  try {
    // 1. Validar se estamos em um Jira ticket
    const jiraRegex = /^https:\/\/jsw\.ibm\.com\/browse\/[A-Z]+-\d+/;
    if (!jiraRegex.test(window.location.href)) {
      alert(
        "This action is only available on a Jira ticket page.\n\n" +
        "Please open a Jira issue (e.g. https://jsw.ibm.com/browse/PROJECT-123)."
      );
      return;
    }

    // 2. Buscar o campo Description do Jira
    // Jira costuma renderizar o conteúdo dentro de [data-testid="issue.views.field.description"]
    const descriptionContainer =
      document.querySelector('[data-testid="issue.views.field.description"]') ||
      document.querySelector('#description-val');

    if (!descriptionContainer) {
      alert("No description field found in this Jira ticket.");
      return;
    }

    const text = descriptionContainer.innerText;

    // 3. Encontrar URLs de Experience Fragments
    const urls = text.match(/https?:\/\/[^\s)]+/g) || [];

    const xfUrls = urls.filter(url =>
      url.includes('/content/experience-fragments/')
    );

    if (xfUrls.length === 0) {
      alert("No Experience Fragment links were found in this Jira ticket.");
      return;
    }

    // 4. Converter e abrir os XFs na treeview correta
    xfUrls.forEach(url => {
      try {
        const u = new URL(url);

        let path = u.pathname;

        // Remover /editor.html se existir
        path = path.replace(/^\/editor\.html/, '');

        // Remover .html
        path = path.replace(/\.html$/, '');

        // Montar URL final da treeview de XFs
        const finalUrl =
          `${u.origin}/aem/experience-fragments.html${path}`;

        window.open(finalUrl, '_blank');
      } catch (e) {
        console.warn("Invalid URL skipped:", url);
      }
    });

  } catch (err) {
    console.error("Sent XF error:", err);
    alert("An unexpected error occurred while processing Experience Fragments.");
  }
})();