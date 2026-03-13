(function () {
  try {
    const container = document.querySelector("#description-val");
    const fullPageText = document.body.innerText;

    if (!container) {
      console.warn("Element #description-val not found.");
      return;
    }

    const text = container.innerText;
    
    const boxMatch = fullPageText.match(/https:\/\/ibm\.ent\.box\.com\/file\/[^\s)\]"']+/);
    const boxLink = boxMatch ? boxMatch[0] : "[Link do Box não encontrado]";

    const rawMatches = text.match(/-?https?:\/\/[^\s)]+/g) || [];
    
    const rawUrls = rawMatches.map(link => link.startsWith('-') ? link.substring(1) : link);

    const paths = [];
    
    const aemPrefix = "https://author-p131558-e1281329.adobeaemcloud.com/editor.html/content/experience-fragments/adobe-cms/language-masters/en/";
    const prodAemPrefix = "https://prod-cloud-author.aem.ibm.net/editor.html/content/experience-fragments/adobe-cms/language-masters/en/";

    rawUrls.forEach(url => {
      let cleanUrl = url.split('?')[0];

      if (cleanUrl.includes("/config/")) {
        try {
          const startIndex = cleanUrl.indexOf("/config/");
          let path = cleanUrl.substring(startIndex);
          path = path.replace(/\.html$/, '');
          paths.push(path);
        } catch (e) {}
      }
      else if (cleanUrl.startsWith(aemPrefix)) {
        let path = cleanUrl.replace(aemPrefix, "");
        path = path.replace(/\.html$/, '');
        if (path) paths.push("/" + path);
      }
      else if (cleanUrl.startsWith(prodAemPrefix)) {
        let path = cleanUrl.replace(prodAemPrefix, "");
        path = path.replace(/\.html$/, '');
        if (path) paths.push("/" + path);
      }
      else if (cleanUrl.includes("/content/experience-fragments/")) {
        try {
          const u = new URL(cleanUrl);
          let path = u.pathname;
          path = path.replace(/^\/editor\.html/, '');
          path = path.replace(/^\/content\/experience-fragments\/adobe-cms\/language-masters\/en/, '');
          path = path.replace(/\.html$/, '');
          paths.push(path);
        } catch (e) {}
      }
      else if (cleanUrl.startsWith("https://www.ibm.com") || cleanUrl.startsWith("http://www.ibm.com")) {
        try {
          const u = new URL(cleanUrl);
          let path = u.pathname;
          path = path.replace(/^\/editor\.html/, '');
          path = path.replace(/^\/content\/adobe-cms\/language-masters\/en/, '');
          path = path.replace(/^\/content\/experience-fragments\/adobe-cms\/language-masters\/en/, '');
          path = path.replace(/\.html$/, '');
          paths.push(path);
        } catch (e) {}
      }
    });

    const uniquePaths = [...new Set(paths)];

    if (uniquePaths.length === 0) {
      alert("Nenhum link válido encontrado para Final Testing.");
      return;
    }

    let finalText = "*{color:#00875a}Tech QA Approved (/){color}* \n\n";
    finalText += "Hi Team\nAll pages that have been approved and published in all locales. Moving the ticket to *Final Testing*!\n\n";

    uniquePaths.forEach((path, index) => {
      const num = index + 1;
      finalText += `*#${num}* _${path} *{color:#00875a}(published){color}* {color:#00875a}*✔*{color}_\n`;
    });

    finalText += `\nThanks!\n\n*TS:* ${boxLink}`; 

    navigator.clipboard.writeText(finalText).then(() => {
      alert("Relatório de Final Testing copiado!"); 
    }).catch(err => {
      const textArea = document.createElement("textarea");
      textArea.value = finalText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    });

  } catch (error) {
    console.error("Erro geral no script:", error);
  }
})();