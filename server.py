from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class RequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow all origins
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_POST(self):
        # Parse the JSON data from the request
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        # Extract fields from the data
        cadastro_number = data.get('cadastro_number', 'Unknown')
        city = data.get('city', 'Unknown')
        date = data.get('date', 'Unknown')
        period = data.get('period', 'Unknown')
        title = data.get('title', 'Unknown')
        name = data.get('name', 'Unknown')

        # Log the received data
        print(f"Received cadastro_number: {cadastro_number}, city: {city}, date: {date}, period: {period}, title: {title}, name: {name}")

        # Set the headers
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

        # Send a response
        response = {
            "message": "Data received",
            "cadastro_number": cadastro_number,
            "city": city,
            "date": date,
            "period": period,
            "title": title,
            "name": name
        }
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

def run(server_class=HTTPServer, handler_class=RequestHandler, port=50000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting server on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    run()

def do_POST(self):
    print(f"Content-Length: {self.headers['Content-Length']}")
    content_length = int(self.headers['Content-Length'])
    post_data = self.rfile.read(content_length)
    print(f"Raw POST data: {post_data}")
    # Continue with JSON parsing...