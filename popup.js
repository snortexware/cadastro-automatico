document.addEventListener('DOMContentLoaded', function () {
    // Request the cadastro number from the background script
    chrome.runtime.sendMessage({ requestCadastroNumber: true }, (response) => {
      const cadastroNumberElement = document.getElementById('cadastro-number');
      if (response && response.cadastroNumber) {
        cadastroNumberElement.textContent = response.cadastroNumber;
      } else {
        cadastroNumberElement.textContent = "Número do Cadastro não encontrado.";
      }
    });
  });
  