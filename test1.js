document.getElementById('sendData').addEventListener('click', () => {
  fetch('http://127.0.0.1:5000/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'Hello from Chrome extension' })
  })
  .then(response => response.json())
  .then(data => console.log(data));
});
