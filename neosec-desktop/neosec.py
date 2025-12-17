from PySide6.QtCore import QObject, Signal, Slot, QRunnable, QThreadPool
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtWidgets import QApplication
import sys
import requests
import os
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
auth_url = "https://neosec.onrender.com/api/auth/login"
dashboard_url = "https://neosec.onrender.com/api/dashboard"
auth_file = f"{base_dir}/data/auth.json"

class AuthWorker(QRunnable):
    def __init__(self, user, password, backend_signals, parent=None):
        super().__init__(parent)
        self.user = user
        self.password = password
        self.signals = backend_signals

    def run(self):
        if self.user and self.password:
            try: 
                authenticationResponse = requests.post(auth_url, data={"email": self.user, "password": self.password}, timeout=10).json()
                message = authenticationResponse.get("message")
                if authenticationResponse.get('success'):
                    with open(auth_file, 'w') as file:
                        json.dump(authenticationResponse, file, indent=4)
                    username = authenticationResponse.get("user").get("email")
                    self.signals.loginSuccess.emit(username)
                else:
                    self.signals.loginFailed.emit(message)
            except:
                self.signals.loginFailed.emit("Timed out trying to reach server.")
        else:
            self.signals.loginFailed.emit("Please enter valid email and password")
        self.signals.authenticationFinished.emit()

class AuthFileWorker(QRunnable):
    def __init__(self, backend_signals, parent=None):
        super().__init__(parent)
        self.signals = backend_signals

    def run(self):
        if os.path.exists(auth_file):
            with open(auth_file, "r") as file:
                authenticationResponse = json.load(file)
            token = authenticationResponse.get("token")
            username = authenticationResponse.get("user", {}).get("email")
            if token and username:
                try:
                    response = requests.get(dashboard_url, headers={"Authorization": f"Bearer {token}"}, timeout=10).json()
                    if response.get("success"):
                        self.signals.loginSuccess.emit(username)
                    else:
                        self.signals.loginFailed.emit("Authentication token expired")
                        os.remove(auth_file)
                except:
                        self.signals.loginFailed.emit("Timed out trying to reach server.")

        self.signals.authenticationFinished.emit()

class Backend(QObject):
    loginSuccess = Signal(str)
    loginFailed = Signal(str)
    logout = Signal()
    authenticationFinished = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.thread_pool = QThreadPool.globalInstance()

    @Slot()
    def checkSavedAuth(self):
        worker = AuthFileWorker(self)
        self.thread_pool.start(worker)

    @Slot(str, str)
    def authenticate(self, user, password):
        worker = AuthWorker(user, password, self)
        self.thread_pool.start(worker)

    @Slot()
    def handleLogout(self):
        if os.path.exists(auth_file):
            os.remove(auth_file)
        self.logout.emit()
        self.authenticationFinished.emit()

app = QApplication(sys.argv)
backend = Backend()
engine = QQmlApplicationEngine()
engine.rootContext().setContextProperty("backend", backend)
engine.load(f"{base_dir}/qml/main.qml")
if not engine.rootObjects():
    sys.exit(-1)
backend.checkSavedAuth()
sys.exit(app.exec())
