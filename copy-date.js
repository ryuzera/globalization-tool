(function () {
  try {
    const container = document.querySelector("#description-val");
    if (!container) return;

    const text = container.innerText;
    const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
    const uniqueUrls = [...new Set(urls)];
    const totalLinks = uniqueUrls.length;

    if (totalLinks === 0) {
      console.warn("Nenhum link encontrado.");
      return;
    }

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const dataFormatada = `${mes}/${dia}/${ano}`;

    const listaDatas = Array(totalLinks).fill(dataFormatada).join("\n");

    navigator.clipboard.writeText(listaDatas).then(() => {
      alert(`${totalLinks} linhas de data copiadas!`);
    }).catch(err => {
      const textArea = document.createElement("textarea");
      textArea.value = listaDatas;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    });

  } catch (error) {
    console.error("Erro no script de datas:", error);
  }
})();