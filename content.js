setTimeout(() => {
  console.log("Script started...");


  const tableElements = document.querySelectorAll("table");
  console.log("Total tables found:", tableElements.length);

  if (tableElements.length > 2) {
    
    const table2 = tableElements[2];
    const tbody = table2.querySelector("tbody");
    if (!tbody) {
      console.error("No tbody found in the 3rd table.");
      return;
    }
    const rows = tbody.querySelectorAll("tr");
    console.log("Total rows found in tbody:", rows.length);

    let name = 'Unknown'; 

    if (rows.length > 2) {
      const row3 = rows[2];
      const secondTd3 = row3.querySelectorAll("td")[1];
      if (secondTd3) {
        const nameElement = secondTd3.querySelector("b");
        name = nameElement ? nameElement.textContent.trim() : 'Unknown';
        console.log("Name extracted:", name);
      } else {
        console.error("Second <td> in the 3rd row not found.");
      }
    } else {
      console.error("Not enough rows in the 3rd table.");
    }

    // Extract data from the 8th table
    const tableElements7 = document.querySelectorAll("table");
    const table7 = tableElements7[7]; // Access the 8th table
    const tbody7 = table7.querySelector("tbody");
    if (!tbody7) {
      console.error("No tbody found in the 8th table.");
      return;
    }
    const rows7 = tbody7.querySelectorAll("tr");

    let title = 'Unknown'; 
    let date = 'Unknown'; 
    let period = 'Unknown'; 

    if (rows7.length > 8) {
      const row7 = rows7[6];
      const secondTd7 = row7.querySelectorAll("td")[1];
      title = secondTd7 ? secondTd7.textContent.trim() : 'Unknown';
      console.log("Title extracted:", title);

      const row9 = rows7[8];
      const secondTd9 = row9.querySelectorAll("td")[1];
      if (secondTd9) {
        const pElements9 = secondTd9.querySelectorAll("p");
        pElements9.forEach(p => {
          console.log("Processing <p> element:", p.textContent.trim());

          const dateMatch = p.textContent.trim().match(/Dia:\s*(\d{2}\/\d{2})/);
          if (dateMatch && dateMatch[1]) {
            date = dateMatch[1];
            console.log("Date extracted:", date);
          }

          const periodMatch = p.textContent.trim().match(/Período:\s*(Dia Todo|Manhã|Tarde|manha|dia todo|tarde)(?=\s|$)/i);
          if (periodMatch && periodMatch[1]) {
            period = periodMatch[1]
            switch(periodMatch[1].toLowerCase()){
              case "Manha":
                period = "Manhã"
              break
              case "manha":
                period = "Manhã"
              break
              case "tarde": 
              period = "Tarde"
              break
              case "dia todo": 
              period = "Dia Todo"
              break
              default: period = periodMatch[1]
              break
            }
            console.log("Period extracted:", period);
          }
        });
      } else {
        console.error("Second <td> in the 9th row not found.");
      }

      
      const tdElement = document.querySelector('td[colspan="2"]');
      const boldElement = tdElement ? tdElement.querySelector('b') : null;
      const tdElement1 = document.getElementsByClassName('listas');

      let city = 'Unknown'; 
      let bairro = 'Unknown'; 

      if (tdElement && boldElement && tdElement1.length > 3) {
        const boldElement1 = tdElement1[3];
        const cityText = boldElement1.textContent;

        
        console.log("Full address text:", cityText);

        
        const addressMatch = cityText.match(/^([^,]+),\s*([A-Z]{2}),\s*[^,]+,\s*[^,]+,\s*([^,]+),\s*CEP:\s*\d{8}/);
        if (addressMatch) {
          city = addressMatch[1].trim(); 
          bairro = addressMatch[3].trim(); 

          console.log("City extracted:", city);
          console.log("Bairro extracted:", bairro);
        } else {
          console.error("Unable to extract city and bairro from the text. Check the regex pattern and text format.");
        }

        if (boldElement && boldElement.textContent.includes("Informação cadastral")) {
          const match = boldElement.textContent.match(/Número do Cadastro:\s*(\d+)/);
          if (match && match[1]) {
            const cadastroNumber = match[1];
            console.log("Número do Cadastro:", cadastroNumber);

           
            const comentarioElement = document.querySelector('#comentario');
            const comentario = comentarioElement ? comentarioElement.value : 'No comment';
            console.log("Comentário extracted:", comentario);

            
            fetch('https://localhost:4443/submit', {
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
              console.log("Server response:", data);
            })
            .catch(error => {
              console.error("Error in fetch:", error);
            });

          } else {
            console.error("Número do Cadastro não encontrado.");
          }
        } else {
          console.error("Elemento <b> com 'Informação cadastral' não foi encontrado.");
        }
      } else {
        console.error("Elemento necessário não foi encontrado.");
      }
    } else {
      console.error("Not enough rows in the 8th table.");
    }
  } else {
    console.error("3rd table not found.");
  }
}, 2500);
