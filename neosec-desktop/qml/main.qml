import QtQuick
import QtQuick.Controls

ApplicationWindow {
    id: root
    width: 1080
    height: 720
    visible: true
    color: "black"

    Loader {
        id: pageLoader
        anchors.fill: parent
        source: "login.qml"
    }

    Connections {
        target: backend

        function onLoginSuccess(username) {
            pageLoader.source = "home.qml"
            pageLoader.item.username = username;
        }
        function onLogout() {
            pageLoader.source = "login.qml"
        }
    }
}
