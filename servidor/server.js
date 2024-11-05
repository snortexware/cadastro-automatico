const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const https = require("https");
const fs = require("fs");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const WebSocket = require("ws");
const schedule = require("node-schedule");
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs", "html");
app.set("views", path.join(__dirname, "views"));

// HTTPS options
const options = {
  key: fs.readFileSync(path.join(__dirname, "local_private_key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "local_certificate.pem")),
};

let driver;
const logs = [];
let successCount = 0;
let errorCount = 0;

function logMessage(message) {
  logs.push(message);
  console.log(message);
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Create HTTPS server
const server = https.createServer(options, app);

// Create WebSocket server
const wsServer = new WebSocket.Server({ server });

wsServer.on("connection", (ws) => {
  console.log("Cliente conectado");
  ws.send("Conectado ao servidor WebSocket");
  ws.send(JSON.stringify({ successCount, errorCount }));
});
app.get("/qr", (req, res) => {
    res.render("qr"); // Ensure this matches your EJS filename
  });
// Routes
app.get("/", (req, res) => {
  res.render("index"); // Ensure this matches your EJS filename
});

app.post("/start", async (req, res) => {
  const {
    name,
    cadastro_number,
    city,
    bairro,
    date,
    period,
    title,
    comentario,
  } = req.body;

  logMessage(
    "Dados recebidos: " +
      JSON.stringify({
        name,
        cadastro_number,
        city,
        bairro,
        date,
        period,
        title,
        comentario,
      })
  );

  if (!driver) {
    const chromeOptions = new chrome.Options()
      .addArguments("--headless=old")
      .addArguments("--disable-gpu")
      .addArguments("--window-size=1920,1080");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(chromeOptions)
      .build();

    try {
      await driver.get("http://172.16.6.10/sistema-ls/index.php");
      await driver
        .findElement(By.name("txt_usuario"))
        .sendKeys("lucas.moreira@gramnet.com.br");
      await driver.findElement(By.name("txt_senha")).sendKeys("Lucas.moreira1");
      await driver.findElement(By.xpath('//button[@type="submit"]')).click();
      await driver.wait(
        until.urlIs("http://172.16.6.10/sistema-ls/administrativo.php?pagina"),
        10000
      );
      await driver.get(
        "http://172.16.6.10/sistema-ls/administrativo.php?pagina=adicionarsuporte"
      );

      logMessage("Login realizado com sucesso!");

      const button = await driver.wait(
        until.elementLocated(By.css(".btn.btn-success")),
        10000
      );
      await driver.wait(until.elementIsVisible(button), 50000);
      await button.click();

      const modal = await driver.wait(
        until.elementLocated(By.id("addUsuarioModal")),
        10000
      );
      await driver.wait(until.elementIsVisible(modal), 10000);

      await driver
        .wait(until.elementLocated(By.id("codCliente")), 30000)
        .sendKeys(cadastro_number);
      await driver
        .wait(until.elementLocated(By.id("nome")), 10000)
        .sendKeys(name);

      function formatDate(dateStr) {
        const currentYear = new Date().getFullYear();
        const [day, month] = dateStr.split("/");
        return `${day}${month}${currentYear}`;
      }

      const dataInput = await driver.wait(
        until.elementLocated(By.name("data")),
        10000
      );
      await dataInput.clear();
      await dataInput.sendKeys(formatDate(date));

      await driver
        .wait(until.elementLocated(By.name("periodo")), 10000)
        .sendKeys(period);
      await driver
        .wait(until.elementLocated(By.name("cidade")), 10000)
        .sendKeys(city);
      await driver
        .wait(until.elementLocated(By.name("bairro")), 10000)
        .sendKeys(bairro);
      await driver
        .wait(until.elementLocated(By.name("comentario")), 10000)
        .sendKeys(title);

      logMessage("Todos os dados foram inseridos com sucesso");

      await driver.wait(until.elementLocated(By.id("CadUser")), 10000).click();
      await driver
        .wait(
          until.elementLocated(By.css("button.swal2-confirm.swal2-styled")),
          10000
        )
        .click();

      logMessage("Cadastro concluído com sucesso");
      successCount++;
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ successCount, errorCount }));
        }
      });

      res.status(200).json({ message: "Automação iniciada com sucesso" });
    } catch (error) {
      logMessage(`Erro durante a automação: ${error}`);
      errorCount++;
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ successCount, errorCount }));
        }
      });
      res.status(500).json({ message: `Erro: ${error.toString()}` });
    } finally {
      await driver.quit();
      driver = null;
    }
  } else {
    res.status(400).json({ message: "Automação já está em execução." });
  }
});

// Start the server
const PORT = 4443;
server.listen(PORT, () => {
  logMessage(`Iniciando servidor HTTPS na porta ${PORT}...`);
});

// Export the server instance
module.exports = server;

async function checkAtendimentos() {
  try {
    await driver.get("https://megazap.chat/login.html");
    console.log("Navigated to login page.");

    await driver.findElement(By.id("email")).sendKeys("lucas.gramnet");
    await driver.findElement(By.id("password")).sendKeys("Lucas.moreira2");
    await driver
      .findElement(
        By.css(".btn.btn-lg.btn-block.m-t-20.bgm-black.waves-effect.ng-binding")
      )
      .click();
    console.log("Login attempt made.");

    await driver.wait(
      until.urlContains("https://megazap.chat/index.html#/atendimentos/chat"),
      10000
    );
    console.log("Login successful!");

    let closeButton = await driver.wait(
      until.elementLocated(By.css('[ng-click="close()"]')),
      5000
    );
    await closeButton.click();
    console.log("Closed any modal.");

    let parentDiv = await driver.findElement(By.id("atendimentos-ativos"));
    let activeItems = await parentDiv.findElements(By.css('div[id^="ativo-"]'));
    console.log(`Found ${activeItems.length} active attendances.`);

    for (let item of activeItems) {
      let itemId = await item.getAttribute("id");
      console.log(`Processing item with ID: ${itemId}`);

      await driver.executeScript("arguments[0].scrollIntoView(true);", item);
      await driver.sleep(1000);
      await driver.executeScript("arguments[0].click();", item);
      await driver.sleep(1000);
      let atendimentoContent = await item.findElement(
        By.css(".atendimento-item-content")
      );
      let tagsContainerExists = await atendimentoContent.findElements(
        By.css(".tags-container.ng-scope")
      );

      if (tagsContainerExists.length > 0) {
        console.log(`tags-container found inside item ${itemId}`);

        let tags = await atendimentoContent.findElements(
          By.css(".item-tag.ng-binding.ng-scope")
        );
        for (let tag of tags) {
          let tagText = await tag.getText();
          tagText = tagText.trim();

          if (tagText.includes("RESOLVIDO")) {
            console.log(
              `Tag "RESOLVIDO" found for item ${itemId}. Finalizing...`
            );

            let finalizeIcon = await driver.wait(
              until.elementLocated(
                By.css(".icone.no-mobile.i-finalizar.ng-scope")
              ),
              5000
            );
            await driver.executeScript(
              "arguments[0].scrollIntoView(true);",
              finalizeIcon
            );
            await finalizeIcon.click();

            let selectElement = await driver.wait(
              until.elementLocated(
                By.css("select.form-control.select-simples")
              ),
              5000
            );
            await driver.executeScript(
              "arguments[0].value = '7656';",
              selectElement
            );
            await driver.executeScript(
              "arguments[0].dispatchEvent(new Event('change'));",
              selectElement
            );

            let finalizeButton = await driver.wait(
              until.elementLocated(
                By.css('[ng-click="onFinalizarAtendimento()"]')
              ),
              5000
            );
            await finalizeButton.click();
            console.log(`Atendimento ${itemId} finalized.`);
          } else if (tagText.includes("SEM CONEXÃO")) {
            console.log(
              `Tag "SEM CONEXÃO" found for item ${itemId}. Transferring...`
            );

            let transferIcon = await driver.wait(
              until.elementLocated(
                By.css(".icone.no-mobile.i-transferir.ng-scope")
              ),
              5000
            );
            await transferIcon.click();

            let selecionaDep = await driver.wait(
              until.elementLocated(
                By.css('[ng-change="onSelecionarDepartamento()"]')
              ),
              5000
            );
            await driver.executeScript(
              "arguments[0].value = '34214';",
              selecionaDep
            );
            await driver.executeScript(
              "arguments[0].dispatchEvent(new Event('change'));",
              selecionaDep
            );

            let select1 = await driver.wait(
              until.elementLocated(
                By.css('select[ng-model="departamentoSelecionado.atendenteId"]')
              ),
              5000
            );
            await driver.executeScript("arguments[0].value = '0';", select1);
            await driver.executeScript(
              "arguments[0].dispatchEvent(new Event('change'));",
              select1
            );

            let enviar = await driver.wait(
              until.elementLocated(By.css('[ng-click="onModalInserir()"]'))
            );
            await enviar.click();
            console.log(`Atendimento ${itemId} transferred.`);
          }
        }
      }
    }
  } catch (error) {
    logMessage("Erro ao finalizar os atendimentos");
  }
}

const agendarNoite = schedule.scheduleJob("45 21 * * *", function () {
  checkAtendimentos();
});
console.log("Agendado para as 21:45");

const agendarTarde = schedule.scheduleJob("00 18 * * *", function () {
  checkAtendimentos();
});
console.log("Agendado para as 18:00");
app.use(express.static(path.join(__dirname, "public")));




