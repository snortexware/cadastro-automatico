const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const WebSocket = require('ws');

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// HTTPS options
const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate.pem')),
};

// Initialize variables
let driver;
const logs = [];
let successCount = 0;
let errorCount = 0;

// Function to log messages and send to WebSocket clients
function logMessage(message) {
    logs.push(message);
    console.log(message);
    if (wsServer) {
        wsServer.clients.forEach(client => {
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

wsServer.on('connection', (ws) => {
    console.log('Cliente conectado');
    ws.send('Conectado ao servidor WebSocket');
    ws.send(JSON.stringify({ successCount, errorCount }));
});

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Ensure this matches your EJS filename
});

app.post('/start', async (req, res) => {
    const { name, cadastro_number, city, bairro, date, period, title, comentario } = req.body;

    logMessage('Dados recebidos: ' + JSON.stringify({ name, cadastro_number, city, bairro, date, period, title, comentario }));

    if (!driver) {
        const chromeOptions = new chrome.Options()
            .addArguments('--headless=new')
            .addArguments('--disable-gpu');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

        try {
            await driver.get('http://172.16.6.10/sistema-ls/index.php');
            await driver.findElement(By.name('txt_usuario')).sendKeys('lucas.moreira@gramnet.com.br');
            await driver.findElement(By.name('txt_senha')).sendKeys('Lucas.moreira1');
            await driver.findElement(By.xpath('//button[@type="submit"]')).click();
            await driver.wait(until.urlIs('http://172.16.6.10/sistema-ls/administrativo.php?pagina'), 10000);
            await driver.get('http://172.16.6.10/sistema-ls/administrativo.php?pagina=adicionarsuporte');

            logMessage("Login realizado com sucesso!");

            const button = await driver.wait(until.elementLocated(By.css('.btn.btn-success')), 10000);
            await driver.wait(until.elementIsVisible(button), 50000);
            await button.click();

            const modal = await driver.wait(until.elementLocated(By.id('addUsuarioModal')), 10000);
            await driver.wait(until.elementIsVisible(modal), 10000);

            await driver.wait(until.elementLocated(By.id('codCliente')), 30000).sendKeys(cadastro_number);
            await driver.wait(until.elementLocated(By.id('nome')), 10000).sendKeys(name);

            function formatDate(dateStr) {
                const currentYear = new Date().getFullYear();
                const [day, month] = dateStr.split('/');
                return `${day}${month}${currentYear}`; 
            }

            const dataInput = await driver.wait(until.elementLocated(By.name('data')), 10000);
            await dataInput.clear();
            await dataInput.sendKeys(formatDate(date));         
            
            await driver.wait(until.elementLocated(By.name('periodo')), 10000).sendKeys(period);
            await driver.wait(until.elementLocated(By.name('cidade')), 10000).sendKeys(city);
            await driver.wait(until.elementLocated(By.name('bairro')), 10000).sendKeys(bairro);
            await driver.wait(until.elementLocated(By.name('comentario')), 10000).sendKeys(title);

            logMessage("Todos os dados foram inseridos com sucesso");

            await driver.wait(until.elementLocated(By.id('CadUser')), 10000).click();
            await driver.wait(until.elementLocated(By.css('button.swal2-confirm.swal2-styled')), 10000).click();

            logMessage("Cadastro concluído com sucesso");
            successCount++;
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ successCount, errorCount }));
                }
            });

            res.status(200).json({ message: "Automação iniciada com sucesso" });
        } catch (error) {
            logMessage(`Erro durante a automação: ${error}`);
            errorCount++;
            wsServer.clients.forEach(client => {
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
