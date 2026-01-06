(function () {
  try {
    console.log("URLs.js (Jira Format) executando...");
    
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

    let finalText = "*{color:#FF8B00}Tech QA Report (!){color}* \n\n";
    finalText += "Hi Team\nSome pages have been approved and published, but the pages ... show the following issues:\n\n";

    uniquePaths.forEach((path, index) => {
      const num = index + 1;
      finalText += `*#${num}* _${path} *{color:#00875a}(published){color}* {color:#00875a}*✔*{color}_\n`;
    });

    finalText += `\nThanks!\n\n*TS:* ${boxLink}\n\n*{color:#DE350B}(failed) ✘{color}*_`; 

    console.log("Texto formatado pronto para cópia.");

    navigator.clipboard.writeText(finalText).then(() => {
      console.log("URLs formatadas copiadas com sucesso!");
      alert("Relatório copiado para a área de transferência!"); 
    }).catch(err => {
      const textArea = document.createElement("textarea");
      textArea.value = finalText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      console.log("Fallback: URLs copiadas via execCommand");
    });

  } catch (error) {
    console.error("Erro geral no script:", error);
  }
})();