from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
from webdriver_manager.chrome import ChromeDriverManager
import time  # Importing for adding pauses

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
        cadastro_number = data.get('cadastro_number')
        city = data.get('city')
        date = data.get('date')
        period = data.get('period')
        title = data.get('title')
        name = data.get('name')
        bairro = data.get('bairro')

        # Check if all necessary data is present
        if all([cadastro_number, city, date, period, title, name]):
            # Store the data in a variable
            stored_data = {
                "cadastro_number": cadastro_number,
                "city": city,
                "date": date,
                "bairro": bairro,
                "period": period,
                "title": title,
                "name": name
            }

            # Log the received data
            print(f"Received data: {stored_data}")

            # Configure Selenium WebDriver using webdriver_manager
            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument("--headless")  # Optional: Start maximized
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)

            try:
                # Access the login page
                driver.get('http://172.16.6.10/sistema-ls/index.php')

                # Perform login
                email_field = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.NAME, 'txt_usuario'))
                )
                password_field = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.NAME, 'txt_senha'))
                )

                # Fill in email and password
                email_field.send_keys('lucas.moreira@gramnet.com.br')
                password_field.send_keys('Lucas.moreira1')

                # Click login button
                login_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[@type="submit"]'))
                )
                login_button.click()

                # Wait for page to load or URL to change
                WebDriverWait(driver, 5).until(
                    EC.url_changes('http://172.16.6.10/sistema-ls/index.php')
                )

                # Check if login was successful
                if driver.current_url != 'http://172.16.6.10/sistema-ls/index.php':
                    print("Logado com sucesso!")

                    # Locate the UL with class "nav navbar-nav side-nav"
                    ul_element = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.XPATH, '//ul[contains(@class, "nav navbar-nav side-nav")]'))
                    )

                    # Locate the 4th LI inside the UL
                    li_elements = ul_element.find_elements(By.TAG_NAME, 'li')
                    if len(li_elements) > 3:
                        fourth_li = li_elements[3]  # The 4th <li>, indexed as 3

                        # Wait for the link with data-target="#submenu-5" to be clickable
                        submenu_a = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, './/a[contains(@data-target, "#submenu-5")]'))
                        )
                        submenu_a.click()

                        # Wait for submenu to open and locate the first item inside it
                        nested_ul = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, '//ul[@id="submenu-5"]'))
                        )

                        # Get all <li> elements in the submenu
                        li_elements = nested_ul.find_elements(By.TAG_NAME, 'li')
                        if li_elements:
                            # Select the first <li> and get the first child <a> element
                            first_li = li_elements[0]
                            link_a = first_li.find_element(By.XPATH, './/a')

                            # Click the link
                            link_a.click()

                            print("Successfully clicked the target link!")

                            # Wait for the modal to be present and clickable
                            WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-target="#addUsuarioModal"]'))
                            )

                            # Click on the element to open the modal
                            modal_trigger = WebDriverWait(driver, 5).until(
                                EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-target="#addUsuarioModal"]'))
                            )
                            modal_trigger.click()

                            # Adding a pause to ensure modal and its elements are fully loaded
                            time.sleep(2)  # Optional: Adjust the duration if needed

                            # Select the input with id="codCliente"
                            cod_cliente_input = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.ID, 'codCliente'))
                            )
                            cod_cliente_input.clear()  # Clear the field before entering new value
                            cod_cliente_input.send_keys(stored_data['cadastro_number'])

                            # Select the input with id="nome"
                            nome_input = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.ID, 'nome'))
                            )
                            nome_input.clear()  # Clear the field before entering new value
                            nome_input.send_keys(stored_data['name'])

                            # Format the date to dd/mm/yyyy
                            today = datetime.now()
                            formatted_date = today.strftime('%d/%m/%Y')
                            date_input = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.NAME, 'data'))
                            )
                            date_input.clear()  # Clear the field before entering new value
                            date_input.send_keys(formatted_date)

                            # Set the value for the select element
                            period_select = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.NAME, 'periodo'))
                            )
                            period_select.send_keys(stored_data['period'])

                            cidade_select = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.NAME, 'cidade'))
                            )
                            cidade_select.send_keys(stored_data['city'])

                            bairro_select = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.ID, 'bairro'))
                            )
                            bairro_select.send_keys(stored_data['bairro'])

                            comentario_select = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.ID, 'comentario'))
                            )
                            comentario_select.send_keys(stored_data['title'])
                              # Ensure the value is a valid option

                            cadastrar_click = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.ID, 'CadUser'))
                            )
                            cadastrar_click.click();

                            ok_click = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, 'button.swal2-confirm.swal2-styled')))
                            ok_click.click()
                            print("Form fields have been filled.")

                        else:
                            print("No <li> elements found in the submenu.")
                    else:
                        print("O 4º <li> não foi encontrado.")
                else:
                    print("Falha no login")

            except Exception as e:
                print(f"Ocorreu um erro: {e}")

            finally:
                # Keep the browser open for manual inspection
                input("Pressione Enter para fechar o navegador...")
                driver.quit()

            # Send a response indicating success
            response = {
                "message": "Data received and processed successfully",
                "received_data": stored_data
            }
        else:
            # Send a response indicating missing data
            response = {
                "message": "Missing necessary data",
                "received_data": stored_data
            }

        # Set the headers
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
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
