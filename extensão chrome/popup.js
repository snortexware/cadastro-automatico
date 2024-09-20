document.addEventListener('DOMContentLoaded', () => {
  const cadastroNumberElement = document.getElementById('cadastro-number');
  const nameElement = document.getElementById('name');
  const cityElement = document.getElementById('city');
  const bairroElement = document.getElementById('bairro');
  const dateElement = document.getElementById('date');
  const periodElement = document.getElementById('period');
  const titleElement = document.getElementById('title');
  const successCountElement = document.getElementById('success-count');
  const errorCountElement = document.getElementById('error-count');

  // Fetch all relevant data
  chrome.storage.local.get(['cadastroNumber', 'name', 'city', 'bairro', 'date', 'period', 'title', 'successCount', 'errorCount'], (result) => {
    cadastroNumberElement.textContent = 'Número do Cadastro: ' + (result.cadastroNumber || 'Não encontrado');
    nameElement.textContent = 'Nome: ' + (result.name || 'Não encontrado');
    cityElement.textContent = 'Cidade: ' + (result.city || 'Não encontrado');
    bairroElement.textContent = 'Bairro: ' + (result.bairro || 'Não encontrado');
    dateElement.textContent = 'Data: ' + (result.date || 'Não encontrado');
    periodElement.textContent = 'Período: ' + (result.period || 'Não encontrado');
    titleElement.textContent = 'Título: ' + (result.title || 'Não encontrado');
    successCountElement.textContent = 'Sucessos: ' + (result.successCount || 0);
    errorCountElement.textContent = 'Erros: ' + (result.errorCount || 0);
    
    if (result.errorCount > 0) {
      alert("Houve erros na última operação. Verifique os dados.");
    }
  });
});
