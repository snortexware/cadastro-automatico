const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// HTTPS Configuration
const options = {
    key: fs.readFileSync(path.join(__dirname, 'server.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate.pem')),
};

// Store the WebDriver instance globally
let driver;

// Render the form
app.get('/', (req, res) => {
    res.render('index'); // This will render views/index.ejs
});

// Start automation
app.post('/start', async (req, res) => {
    const { codCliente, nome } = req.body;

    if (!driver) {
        const chromeOptions = new chrome.Options().addArguments('--start-maximized');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
        
        try {
            await driver.get('http://172.16.6.10/sistema-ls/index.php');
            await driver.findElement(By.name('txt_usuario')).sendKeys('lucas.moreira@gramnet.com.br');
            await driver.findElement(By.name('txt_senha')).sendKeys('Lucas.moreira1');
            await driver.findElement(By.xpath('//button[@type="submit"]')).click();
            await driver.wait(until.urlIs('http://172.16.6.10/sistema-ls/administrativo.php?pagina'), 10000);
            await driver.get('http://172.16.6.10/sistema-ls/administrativo.php?pagina=adicionarsuporte');

            console.log("Logado com sucesso!");

            const button = await driver.wait(
                until.elementLocated(By.css('.btn.btn-success')),
                10000
            );
            await driver.wait(until.elementIsVisible(button), 10000);
            await button.click();

            const modal = await driver.wait(until.elementLocated(By.id('addUsuarioModal')), 10000);
            await driver.wait(until.elementIsVisible(modal), 10000);

            const codClienteInput = await driver.wait(
                until.elementLocated(By.id('codCliente')),
                10000
            );
            await driver.wait(until.elementIsVisible(codClienteInput), 10000);
            await codClienteInput.click();
            await codClienteInput.clear();
            await codClienteInput.sendKeys(codCliente);

            const nomeInput = await driver.wait(
                until.elementLocated(By.id('nome')),
                10000
            );
            await driver.wait(until.elementIsVisible(nomeInput), 10000);
            await nomeInput.click();
            await nomeInput.clear();
            await nomeInput.sendKeys(nome);

            console.log("Inserido nome completo");

            res.status(200).json({ message: "Automation started successfully" });

        } catch (error) {
            console.error(`Error during automation: ${error}`);
            res.status(500).json({ message: `Error: ${error.toString()}` });
        }
    } else {
        res.status(400).json({ message: "Automation is already running." });
    }
});

// Stop automation
app.post('/stop', async (req, res) => {
    if (driver) {
        await driver.quit();
        driver = null; // Reset driver instance
        res.status(200).json({ message: "Automation stopped successfully." });
    } else {
        res.status(400).json({ message: "No automation is running." });
    }
});

// Start HTTPS server
const PORT = 4443;
https.createServer(options, app).listen(PORT, () => {
    console.log(`Starting HTTPS server on port ${PORT}...`);
});
