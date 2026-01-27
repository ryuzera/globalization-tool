(function () {
  try {
    const descContainer = document.querySelector("#description-val");
    const fullPageText = document.body.innerText;
    
    if (!descContainer) {
      console.warn("Element #description-val not found.");
      return;
    }

    const descriptionText = descContainer.innerText;
    
    const boxMatch = fullPageText.match(/https:\/\/ibm\.ent\.box\.com\/file\/[^\s)\]"']+/);
    const boxLink = boxMatch ? boxMatch[0] : "[Link do Box não encontrado]";

    const allUrls = descriptionText.match(/https?:\/\/[^\s)]+/g) || [];
    const paths = [];
    const aemPrefix = "https://author-p131558-e1281329.adobeaemcloud.com/editor.html/content/experience-fragments/adobe-cms/language-masters/en/";

    allUrls.forEach(url => {
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
      alert("Nenhuma URL válida encontrada na descrição.");
      return;
    }

    const failedInput = prompt("Total de links: " + uniquePaths.length + "\nDigite os números que FALHARAM (ex: 1, 3):\nDeixe em branco caso nenhuma FALHOU.");
    const failedNumbers = failedInput 
      ? failedInput.split(/[\s,.-]+/).map(n => parseInt(n.trim())) 
      : [];

    let finalText = "*{color:#FF8B00}Tech QA Report (!){color}* \n\n";
    finalText += "Hi Team\nSome pages have been approved, but the pages ... show the following issues:\n\n";

    uniquePaths.forEach((path, index) => {
      const num = index + 1;
      
      if (failedNumbers.includes(num)) {
        finalText += `*#${num}* _${path} *{color:#DE350B}(failed){color}* {color:#DE350B}*✘*{color}_\n`;
      } else {
        finalText += `*#${num}* _${path} *{color:#00875a}(approved){color}* {color:#00875a}*✔*{color}_\n`;
      }
    });

    finalText += `\nThanks!\n\n*TS:* ${boxLink}`; 

    navigator.clipboard.writeText(finalText).then(() => {
      alert("Relatório copiado para a área de transferência!"); 
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