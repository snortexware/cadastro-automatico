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


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate.pem')),
};


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


const server = https.createServer(options, app);


const wsServer = new WebSocket.Server({ server });

wsServer.on('connection', (ws) => {
    console.log('Cliente conectado');
    ws.send('Conectado ao servidor WebSocket');
    ws.send(JSON.stringify({ successCount, errorCount }));
});


app.get('/', (req, res) => {
    res.render('index'); 
});

app.post('/start', async (req, res) => {
    const { name, cadastro_number, city, bairro, date, period, title, comentario } = req.body;

    logMessage('Dados recebidos: ' + JSON.stringify({ name, cadastro_number, city, bairro, date, period, title, comentario }));

    // Esse projeto foi realizado para uma automação em especifico utilizando selenium
    // Então caso queira reutilizar o codigo, modifique todos os elementos e componentes de acordo com o site que estão utilizando
    if (!driver) {
        const chromeOptions = new chrome.Options()
            .addArguments('--headless=new')
            .addArguments('--disable-gpu');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

        try {
            await driver.get('yourwebsite');
            await driver.findElement(By.name('')).sendKeys('');
            await driver.findElement(By.name('')).sendKeys('');
            await driver.findElement(By.xpath('//button[@type="submit"]')).click();
            await driver.wait(until.urlIs(''), 10000);
            await driver.get('');

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


const PORT = 4443;
server.listen(PORT, () => {
    logMessage(`Iniciando servidor HTTPS na porta ${PORT}...`);
});


module.exports = server;
