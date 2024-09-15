let cadastroNumber = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.cadastro_number) {
    cadastroNumber = message.cadastro_number;
  }
});

// Provide the cadastro number when requested by the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.requestCadastroNumber) {
    sendResponse({ cadastroNumber: cadastroNumber });
  }
});
