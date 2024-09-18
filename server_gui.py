from tkinter import Tk, Label, Button, StringVar
from PIL import Image, ImageTk
import threading
import subprocess
import os
import sys

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

        self.show_logs_button = Button(root, text="Show Logs", command=self.show_logs)
        self.show_logs_button.pack(pady=5)

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
            subprocess.run([sys.executable, 'server_log.py'], check=True)
        except Exception as e:
            print(f"Error: {e}")

    def stop_server(self):
        self.status_var.set("Server stopped")
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.server_running = False

    def show_logs(self):
        # Adjust the path to your `server_log.py` script
        log_script_path = os.path.abspath('C:/Users/Suporte Arion/Documents/GitHub/cadastro-automatico/server_log.py')
        
        # For Windows
        subprocess.Popen(['start', 'cmd', '/k', 'python', log_script_path], shell=True)
        
        # For Linux
        # subprocess.Popen(['xterm', '-e', 'python', log_script_path])

if __name__ == "__main__":
    root = Tk()
    gui = ServerGUI(root)
    root.mainloop()
