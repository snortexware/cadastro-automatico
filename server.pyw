from http.server import BaseHTTPRequestHandler, HTTPServer
import ssl
import threading
import json
import os
from tkinter import Tk, Label, Button, StringVar, messagebox
from PIL import Image, ImageTk
import subprocess
import sys
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

# Ensure dependencies are installed
packages = [
    'Pillow',
    'selenium',
    'webdriver-manager',
]

def install(package):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

def ensure_dependencies():
    for package in packages:
        try:
            __import__(package)
        except ImportError:
            print(f'{package} not found. Installing...')
            install(package)
        else:
            print(f'{package} is already installed.')

ensure_dependencies()

class RequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            cadastro_number = data.get('cadastro_number')
            city = data.get('city')
            bairro = data.get('bairro')
            date = data.get('date')
            period = data.get('period')
            title = data.get('title')
            name = data.get('name')

            if all([cadastro_number, city, bairro, date, period, title, name]):
                current_year = datetime.now().year

                try:
                    parsed_date = datetime.strptime(date, "%d/%m/%Y")
                except ValueError:
                    try:
                        parsed_date = datetime.strptime(date + f"/{current_year}", "%d/%m/%Y")
                    except ValueError:
                        print(f"Error parsing date: {date}")
                        parsed_date = None

                formatted_date = parsed_date.strftime("%d%m%Y") if parsed_date else date

                stored_data = {
                    "cadastro_number": cadastro_number,
                    "city": city,
                    "bairro": bairro,
                    "date": formatted_date,
                    "period": period,
                    "comentario": title,
                    "name": name
                }

                print(f"Received data: {stored_data}")

                chrome_options = Options()
                chrome_options.add_argument("--headless=new")
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)

                try:
                    driver.get('http://172.16.6.10/sistema-ls/index.php')

                    email_field = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.NAME, 'txt_usuario'))
                    )
                    password_field = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.NAME, 'txt_senha'))
                    )

                    email_field.send_keys('lucas.moreira@gramnet.com.br')
                    password_field.send_keys('Lucas.moreira1')

                    login_button = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((By.XPATH, '//button[@type="submit"]'))
                    )
                    login_button.click()

                    WebDriverWait(driver, 10).until(
                        EC.url_changes('http://172.16.6.10/sistema-ls/index.php')
                    )

                    if driver.current_url != 'http://172.16.6.10/sistema-ls/index.php':
                        print("Logado com sucesso!")

                        ul_element = WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.XPATH, '//ul[contains(@class, "nav navbar-nav side-nav")]'))
                        )

                        li_elements = ul_element.find_elements(By.TAG_NAME, 'li')
                        if len(li_elements) > 3:
                            fourth_li = li_elements[3]

                            submenu_a = WebDriverWait(driver, 10).until(
                                EC.element_to_be_clickable((By.XPATH, './/a[contains(@data-target, "#submenu-5")]'))
                            )
                            submenu_a.click()

                            nested_ul = WebDriverWait(driver, 10).until(
                                EC.presence_of_element_located((By.XPATH, '//ul[@id="submenu-5"]'))
                            )

                            li_elements = nested_ul.find_elements(By.TAG_NAME, 'li')
                            if li_elements:
                                first_li = li_elements[0]
                                link_a = first_li.find_element(By.XPATH, './/a')
                                link_a.click()

                                print("Link alvo clicado com sucesso!")

                                WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.CSS_SELECTOR, '[data-target="#addUsuarioModal"]'))
                                )

                                modal_trigger = WebDriverWait(driver, 10).until(
                                    EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-target="#addUsuarioModal"]'))
                                )
                                modal_trigger.click()

                                time.sleep(2)

                                cod_cliente_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.ID, 'codCliente'))
                                )
                                cod_cliente_input.clear()
                                cod_cliente_input.send_keys(stored_data['cadastro_number'])

                                nome_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.ID, 'nome'))
                                )
                                nome_input.clear()
                                nome_input.send_keys(stored_data['name'])

                                date_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.NAME, 'data'))
                                )
                                date_input.clear()
                                date_input.send_keys(formatted_date)

                                period_select = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.NAME, 'periodo'))
                                )
                                period_select.send_keys(stored_data['period'])

                                city_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.NAME, 'cidade'))
                                )
                                city_input.send_keys(stored_data['city'])

                                bairro_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.ID, 'bairro'))
                                )
                                bairro_input.send_keys(stored_data['bairro'])

                                comentario_input = WebDriverWait(driver, 10).until(
                                    EC.presence_of_element_located((By.ID, 'comentario'))
                                )
                                comentario_input.send_keys(stored_data['comentario'])

                                cadastrar_click = WebDriverWait(driver, 10).until(
                                    EC.element_to_be_clickable((By.ID, 'CadUser'))
                                )
                                cadastrar_click.click()

                                button = WebDriverWait(driver, 10).until(
                                    EC.element_to_be_clickable((By.CSS_SELECTOR, 'button.swal2-confirm.swal2-styled'))
                                )
                                button.click()
                                print("Botão clicado com sucesso.")

                            else:
                                print("Nenhum <li> encontrado no submenu.")
                        else:
                            print("O 4º <li> não foi encontrado.")
                    else:
                        print("Falha no login")

                except Exception as e:
                    print(f"Ocorreu um erro: {e}")

                finally:
                    driver.quit()

                response = {
                    "message": "Dados recebidos e processados com sucesso",
                    "received_data": stored_data
                }
            else:
                response = {
                    "message": "Dados necessários ausentes",
                    "received_data": {}
                }

        except Exception as e:
            response = {"message": f"Error: {str(e)}"}

        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

def run_server(server_class=HTTPServer, handler_class=RequestHandler, port=4443, 
               certfile='C:/Users/Suporte Arion/Documents/GitHub/cadastro-automatico/certificate.pem', 
               keyfile='C:/Users/Suporte Arion/Documents/GitHub/cadastro-automatico/server.pem') -> None:
    if not os.path.isfile(certfile):
        raise FileNotFoundError(f"Certificate file not found: {certfile}")
    if not os.path.isfile(keyfile):
        raise FileNotFoundError(f"Key file not found: {keyfile}")
    
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    context.load_cert_chain(certfile=certfile, keyfile=keyfile)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f'Starting HTTPS server on port {port}...')
    httpd.serve_forever()

class ServerGUI:
    def __init__(self, root):
        self.root = root
        self.server_thread = None
        self.server_running = False
        self.logo_path = 'logo.png'  # Path to your logo image

        self.root.title("Server GUI")

        self.status_var = StringVar()
        self.status_var.set("Server stopped")

        self.label = Label(root, textvariable=self.status_var)
        self.label.pack(pady=10)

        self.start_button = Button(root, text="Start Server", command=self.start_server)
        self.start_button.pack(pady=5)

        self.stop_button = Button(root, text="Stop Server", command=self.stop_server, state="disabled")
        self.stop_button.pack(pady=5)

        self.display_logo()

    def display_logo(self):
        if os.path.isfile(self.logo_path):
            image = Image.open(self.logo_path)
            image.thumbnail((300, 300))
            photo = ImageTk.PhotoImage(image)
            self.logo_label = Label(self.root, image=photo)
            self.logo_label.image = photo
            self.logo_label.pack(pady=10)
        else:
            print(f"Logo path does not exist: {self.logo_path}")

    def start_server(self):
        if not self.server_running:
            self.server_thread = threading.Thread(target=self.run_server)
            self.server_thread.start()
            self.status_var.set("Server running")
            self.start_button.config(state="disabled")
            self.stop_button.config(state="normal")
            self.server_running = True

    def run_server(self):
        try:
            run_server(certfile='C:/Users/Suporte Arion/Documents/GitHub/cadastro-automatico/certificate.pem', 
                       keyfile='C:/Users/Suporte Arion/Documents/GitHub/cadastro-automatico/server.pem')
        except Exception as e:
            print(f"Error: {e}")

    def stop_server(self):
        self.status_var.set("Server stopped")
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.server_running = False

if __name__ == "__main__":
    root = Tk()
    gui = ServerGUI(root)
    root.mainloop()