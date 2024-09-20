const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Ignore certificate errors
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        callback(0); // 0 means accept the certificate
    });

    mainWindow.maximize(); // Start maximized
    mainWindow.loadURL('https://localhost:4443'); // Load your Express server URL

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Start the server
fork('server.js'); // Replace 'server.js' with your actual server filename

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
