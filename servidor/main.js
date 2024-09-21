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

  
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        callback(0); 
    });

    mainWindow.maximize(); 
    mainWindow.loadURL('https://localhost:4443'); 

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}


fork('server.js');

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
