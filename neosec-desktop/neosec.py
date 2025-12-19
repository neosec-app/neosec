from PySide6.QtCore import QObject, Signal, Slot, QRunnable, QThreadPool
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtWidgets import QApplication
import sys
import requests
import pathlib
import json

signup_url = "https://neosec-mauve.vercel.app/"
auth_url = "https://neosec.onrender.com/api/auth/login"
verification_url = "https://neosec.onrender.com/api/auth/verify"
base_dir = pathlib.Path(__file__).resolve().parent
main_qml = base_dir / "qml" / "main.qml"
data_dir = pathlib.Path.home() / ".local" / "share" / "neosec"
data_dir.mkdir(parents=True, exist_ok=True)
auth_file = data_dir / "auth.json"

class AuthWorker(QRunnable):
    def __init__(self, user, password, backend_signals, parent=None):
        super().__init__(parent)
        self.user = user
        self.password = password
        self.signals = backend_signals

    def run(self):
        if self.user and self.password:
            try: 
                auth_file.unlink(missing_ok=True)
                authenticationResponse = requests.post(auth_url, data={"email": self.user, "password": self.password}, timeout=10).json()
                message = authenticationResponse.get("message")
                if authenticationResponse.get('success'):
                    auth_file.write_text(json.dumps(authenticationResponse, indent=4))
                    self.signals.loginFileSaved.emit()
                else:
                    self.signals.loginFailed.emit(message)
            except Exception as e:
                print(f"AuthWorker error: {e}")
                self.signals.loginFailed.emit("Timed out trying to reach server.")
        else:
            self.signals.loginFailed.emit("Please enter valid email and password")
        self.signals.authenticationFinished.emit()

class AuthFileWorker(QRunnable):
    def __init__(self, backend_signals, parent=None):
        super().__init__(parent)
        self.signals = backend_signals

    def run(self):
        if auth_file.exists():
            try:
                auth_data = json.loads(auth_file.read_text())
                token = auth_data.get("token")
                if token:
                    response = requests.get(verification_url, headers={"Authorization": f"Bearer {token}"}, timeout=10).json()
                    if response.get("success"):
                        username = f"{response.get('email')} ({response.get('role')})"
                        self.signals.loginSuccess.emit(username)
                    else:
                        self.signals.loginFailed.emit("Authentication token expired")
                        os.remove(auth_file)
            except Exception as e:
                print(f"AuthFileWorker error: {e}")
                self.signals.loginFailed.emit("Timed out trying to reach server.")

        self.signals.authenticationFinished.emit()

class Backend(QObject):
    loginSuccess = Signal(str)
    loginFailed = Signal(str)
    loginFileSaved = Signal()
    logout = Signal()
    authenticationFinished = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.thread_pool = QThreadPool.globalInstance()
        self.loginFileSaved.connect(self.checkSavedAuth)

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
        auth_file.unlink(missing_ok=True)
        self.logout.emit()
        self.authenticationFinished.emit()

app = QApplication(sys.argv)
backend = Backend()
engine = QQmlApplicationEngine()
engine.rootContext().setContextProperty("backend", backend)
engine.rootContext().setContextProperty("signup_url", signup_url)
engine.load(str(main_qml))
if not engine.rootObjects():
    sys.exit(-1)
backend.checkSavedAuth()
sys.exit(app.exec())
