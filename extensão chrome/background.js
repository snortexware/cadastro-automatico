// background.js
let ws;

function connectWebSocket() {
    ws = new WebSocket('wss://localhost:4443'); // Adjust the URL as necessary

    ws.onopen = () => {
        console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.successCount !== undefined) {
            chrome.storage.local.set({ successCount: message.successCount });
        }
        if (message.errorCount !== undefined) {
            chrome.storage.local.set({ errorCount: message.errorCount });
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Start the WebSocket connection when the service worker is activated
connectWebSocket();
