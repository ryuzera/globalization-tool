(function () {
  try {
    console.log("jira-info.js executando...");

    function getText(selector) {
      const el = document.querySelector(selector);
      return el ? el.textContent.trim() : "";
    }

    function getFirstName(selector) {
      const el = document.querySelector(selector);
      if (!el) return "";

      const fullText = el.textContent.trim();
      const firstName = fullText.split(' ')[0];
      return firstName;
    }

    function getSpecificWordFromComment() {
      const targetWords = ["Core", "Custom", "Elite", "Standard", "Core - AIT"];
      const actionBodies = document.querySelectorAll(".action-body.flooded");
      
      console.log("Elementos action-body.flooded encontrados:", actionBodies.length);
      
      for (let actionBody of actionBodies) {
        const paragraphs = actionBody.querySelectorAll("p");
        console.log("Parágrafos neste comentário:", paragraphs.length);
        
        for (let p of paragraphs) {
          const text = p.textContent.trim();
          const textLower = text.toLowerCase(); 
          console.log("Texto do parágrafo:", text);
          
          for (let word of targetWords) {
            if (textLower.includes(word.toLowerCase())) {
              console.log("Palavra encontrada:", word);
              return word;
            }
          }
        }
      }
      
      alert("Nenhum workflow - Core, Custom, Elite ou Standard - foi encontrado!");
      return "";
    }

    function getInterestedParty() {
      const interestedPartyContainer = document.querySelector("#customfield_11001-val");
      if (!interestedPartyContainer) return "";

      const names = Array.from(interestedPartyContainer.querySelectorAll(".user-hover"))
        .map(el => el.textContent.trim())
        .filter(name => name.length > 0);

      return names.join(", ");
    }

    const line1 = getText("#key-val");
    const line2 = "Globalization";
    const line3 = getText("#components-field");
    const line4 = getSpecificWordFromComment(); 
    const line5 = "";
    const line6 = getFirstName("#assignee-val");
    const line7 = getInterestedParty();
    const line8 = "";
    const line9 = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const lines = [line1, line2, line3, line4, line5, line6, line7, line8, line9];
    const finalText = lines.join("\n");

    console.log("Texto final que será copiado:", finalText);

    navigator.clipboard.writeText(finalText).then(() => {
      console.log("Informações copiadas com sucesso!");
    }).catch(err => {
      const textArea = document.createElement("textarea");
      textArea.value = finalText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      console.log("Fallback: Informações copiadas via execCommand");

    });
  } catch (error) {
    console.error("Erro geral no script:", error);
  }
})();