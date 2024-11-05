
let ws;

function connectWebSocket() {
    ws = new WebSocket('wss://192.168.88.183:4443');

    ws.onopen = () => {
        console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse('{"status": "Conectado ao servidor com sucesso"}');
        if (message.successCount !== undefined) {
            chrome.storage.local.set({ successCount: message.successCount });
        }
        if (message.errorCount !== undefined) {
            chrome.storage.local.set({ errorCount: message.errorCount });
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(connectWebSocket, 5000); 
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}


connectWebSocket();
