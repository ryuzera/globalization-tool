(function () {
  try {
    console.log("URLs.js (Jira Format - Approved) executando...");
    
    const container = document.querySelector("#description-val");
    const fullPageText = document.body.innerText;

    if (!container) {
      console.warn("Element #description-val not found.");
      return;
    }

    const text = container.innerText;
    
    const boxMatch = fullPageText.match(/https:\/\/ibm\.ent\.box\.com\/file\/[^\s)\]"']+/);
    const boxLink = boxMatch ? boxMatch[0] : "[Link do Box não encontrado]";

    const rawUrls = text.match(/https?:\/\/[^\s)]+/g) || [];
    const paths = [];

    rawUrls.forEach(url => {
      if (url.startsWith("https://www.ibm.com") || url.startsWith("http://www.ibm.com")) {
        try {
          const u = new URL(url);
          let path = u.pathname;

          path = path.replace(/^\/editor\.html/, '');
          path = path.replace(/^\/content\/adobe-cms\/language-masters\/en/, '');
          path = path.replace(/^\/content\/experience-fragments\/adobe-cms\/language-masters\/en/, '');
          path = path.replace(/\.html$/, '');
          path = path.replace(/\?.*$/, '');

          paths.push(path);
        } catch (e) {
          console.warn("URL unavailable:", url);
        }
      }
    });

    const uniquePaths = [...new Set(paths)];

    if (uniquePaths.length === 0) {
      console.warn("No IBM URLs found.");
      alert("Nenhum link https://www.ibm.com foi encontrado na descrição.");
      return;
    }

    let finalText = "*{color:#00875a}Tech QA Approved (/){color}* \n\n";
    finalText += "Hi Team\nAll pages that have been approved are ready for *Globalization*!\n\n";

    uniquePaths.forEach((path, index) => {
      const num = index + 1;
      finalText += `*#${num}* _${path} *{color:#00875a}(approved){color}* {color:#00875a}*✔*{color}_\n`;
    });

    finalText += `\nThanks!\n\n*TS:* ${boxLink}`; 

    console.log("Texto formatado pronto para cópia.");

    navigator.clipboard.writeText(finalText).then(() => {
      console.log("URLs formatadas copiadas com sucesso!");
      alert("Relatório de Aprovação copiado!"); 
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