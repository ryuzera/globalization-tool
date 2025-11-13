(function () {
  try {
    console.log("URLs.js executando...");
    
    const container = document.querySelector("#description-val");
    if (!container) {
      console.warn("Element #description-val not found.");
      return;
    }

    const text = container.innerText;
    console.log("Texto encontrado:", text);
    
    const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
    console.log("URLs encontradas:", urls);
    
    const paths = [];

    urls.forEach(url => {
      try {
        const u = new URL(url);
        let path = u.pathname;

        path = path.replace(/^\/editor\.html/, '');

        path = path.replace(/^\/content\/adobe-cms\/language-masters\/en/, '');
        path = path.replace(/^\/content\/experience-fragments\/adobe-cms\/language-masters\/en/, '');

        path = path.replace(/\.html$/, '');
        path = path.replace(/\?.*$/, '');

        paths.push(path);
        console.log("URL processada:", url, "->", path);
      } catch (e) {
        console.warn("URL unavailable:", url);
      }
    });

    const uniquePaths = [...new Set(paths)];
    const finalText = uniquePaths.join("\n");

    if (uniquePaths.length === 0) {
      console.warn("No URLs found.");
      return;
    }

    console.log("Texto final a ser copiado:", finalText);

    navigator.clipboard.writeText(finalText).then(() => {
      console.log("URLs copiadas com sucesso!");
      
    }).catch(err => {
      console.error("Error copying:", err);
      
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