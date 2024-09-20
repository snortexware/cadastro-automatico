let hasFetched = false; // Flag to track if fetch has been executed

function playErrorSound() {
  const audio = new Audio(chrome.runtime.getURL('https://www.myinstants.com/media/sounds/daf-error.mp3'));
  audio.play().catch(error => console.error('Error playing sound:', error));
}

setTimeout(() => {
  if (hasFetched) return; // Exit if already fetched

  const tableElements = document.querySelectorAll("table");

  if (tableElements.length > 2) {
    const table2 = tableElements[2];
    const tbody = table2.querySelector("tbody");
    if (!tbody) {
      alert("Nenhum tbody encontrado na 3ª tabela.");
      return;
    }

    const rows = tbody.querySelectorAll("tr");
    let name = 'Unknown';

    if (rows.length > 2) {
      const row3 = rows[2];
      const secondTd3 = row3.querySelectorAll("td")[1];
      if (secondTd3) {
        const nameElement = secondTd3.querySelector("b");
        name = nameElement ? nameElement.textContent.trim() : 'Unknown';
      }
    }

    const table7 = tableElements[7];
    const tbody7 = table7.querySelector("tbody");
    if (!tbody7) {
      alert("Nenhum tbody encontrado na 8ª tabela.");
      return;
    }
    
    const rows7 = tbody7.querySelectorAll("tr");
    let title = 'Unknown'; 
    let date = 'Unknown'; 
    let period = 'Unknown'; 
    let city = 'Unknown'; 
    let bairro = 'Unknown'; 
    let cadastroNumber = 'Unknown';

    if (rows7.length > 8) {
      const row7 = rows7[6];
      const secondTd7 = row7.querySelectorAll("td")[1];
      title = secondTd7 ? secondTd7.textContent.trim() : 'Unknown';

      const row9 = rows7[8];
      const secondTd9 = row9.querySelectorAll("td")[1];
      if (secondTd9) {
        const pElements9 = secondTd9.querySelectorAll("p");
        pElements9.forEach(p => {
          const dateMatch = p.textContent.trim().match(/Dia:\s*(\d{2}\/\d{2})/);
          if (dateMatch && dateMatch[1]) {
            date = dateMatch[1];
          }

          const periodMatch = p.textContent.trim().match(/Período:\s*(Dia Todo|Manhã|Tarde|manha|dia todo|tarde)(?=\s|$)/i);
          if (periodMatch && periodMatch[1]) {
            period = periodMatch[1].toLowerCase() === "manha" ? "Manhã" : periodMatch[1].toLowerCase();
          }
        });
      }

      const tdElement = document.querySelector('td[colspan="2"]');
      const boldElement = tdElement ? tdElement.querySelector('b') : null;
      const tdElement1 = document.getElementsByClassName('listas');

      if (tdElement && boldElement && tdElement1.length > 3) {
        const boldElement1 = tdElement1[3];
        const cityText = boldElement1.textContent;

        const addressMatch = cityText.match(/^([^,]+),\s*([A-Z]{2}),\s*[^,]+,\s*[^,]+,\s*([^,]+),\s*CEP:\s*\d{8}/);
        if (addressMatch) {
          city = addressMatch[1].trim(); 
          bairro = addressMatch[3].trim(); 
        }

        if (boldElement && boldElement.textContent.includes("Informação cadastral")) {
          const match = boldElement.textContent.match(/Número do Cadastro:\s*(\d+)/);
          if (match && match[1]) {
            cadastroNumber = match[1];
          }
        }
      }
    }

    const comentarioElement = document.querySelector('#comentario');
    const comentario = comentarioElement ? comentarioElement.value : 'Sem comentário';

    // Store the values in chrome.storage.local
    chrome.storage.local.set({
      cadastroNumber,
      name,
      city,
      bairro,
      date,
      period,
      title,
      comentario
    });

    // Send data to server
    hasFetched = true;

    fetch('https://localhost:4443/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cadastro_number: cadastroNumber,
        city: city,
        bairro: bairro,
        date: date,
        period: period,
        title: title,
        name: name,
        comentario: comentario
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        chrome.storage.local.get(['successCount'], (result) => {
          const newSuccessCount = (result.successCount || 0) + 1;
          chrome.storage.local.set({ successCount: newSuccessCount });
        });
      }
    })
    .catch(error => {
      playErrorSound();
      alert("Erro ao enviar os dados: " + error.message);
      chrome.storage.local.get(['errorCount'], (result) => {
        const newErrorCount = (result.errorCount || 0) + 1;
        chrome.storage.local.set({ errorCount: newErrorCount });
      });
    });

  } else {
    alert("3ª tabela não encontrada.");
  }
}, 2500);
