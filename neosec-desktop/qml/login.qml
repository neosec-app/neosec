import QtQuick
import QtQuick.Controls


Page {
    property color primary: "#36e27b"
    property color background_light: "#f6f6f6"
    property color background_dark: "#121212"
    property color form_background_dark: "#181818"
    property color input_background_dark: "#282828"
    property color text_light: "#ffffff"
    property color text_muted: "#b3b3b3"
    property color error_red: "#d32f2f"

    id: mainWindow

    visible: true
    title: "NeoSec"
    height: 720
    width: 1080

    background: Rectangle {
	    color: background_dark
    }

    Row {
        id: loginHeader
        width: 165
        height: 22
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.leftMargin: 130
        anchors.topMargin: 20

        Image {
            id: loginHeaderLogo
            width: 25
            height: 25
            anchors.verticalCenter: parent.verticalCenter
            source: "images/logo.svg"
            fillMode: Image.PreserveAspectFit
            sourceSize.width: width
            sourceSize.height: height
        }

        Text {
            id: loginHeaderTitle
            color: text_light
            text: qsTr("NEOSEC")
            anchors.verticalCenter: parent.verticalCenter
            font.pixelSize: 24
            font.weight: Font.Bold
            font.family: "Verdana"
        }
    }

    Rectangle {
        id: loginHeaderDeviderBar
        color: text_muted
        anchors.top: loginHeader.bottom
        anchors.topMargin: 20
        anchors.horizontalCenter: parent.horizontalCenter
        width: parent.width - 40
        height: 2
    }

    Rectangle {
        id: loginHolder
        color: "#00000000"
        anchors.top: loginHeaderDeviderBar.bottom
        anchors.bottom: parent.bottom
        anchors.topMargin: 0
        anchors.bottomMargin: 0
        anchors.horizontalCenter: parent.horizontalCenter

        Text {
            id: loginHolderHeader
            text: qsTr("Login to NeoSec")
            color: text_light
            font.weight: 600
            font.pixelSize: 30
            font.family: "Sans Serif"
            anchors.bottom: loginArea.top
            anchors.bottomMargin: 20
            anchors.horizontalCenter: parent.horizontalCenter
        }

        Rectangle {
            id: loginArea
            width: 580
            height: 349
            color: "#00000000"
            anchors.centerIn: parent

            Text {
                id: loginUsernameLabel
                text: qsTr("Email or username")
                color: text_light
                anchors.top: parent.top
                anchors.topMargin: 0
                font.pixelSize: 16
                font.italic: false
                font.weight: Font.Medium
            }

            TextField {
                id: loginUsernameField
                width: parent.width
                height: 50
                anchors.top: loginUsernameLabel.bottom
                anchors.topMargin: 10
                font.pixelSize: 16
                placeholderText: "Enter your email or username"
                placeholderTextColor: text_muted
                leftPadding: 20
                color: text_light
                background: Rectangle {
                    color: background_dark
                    radius: 50
                    border.color: parent.activeFocus ? primary : text_muted
                }
            }

            Text {
                id: loginPasswordLabel
                text: qsTr("Password")
                color: text_light
                anchors.top: loginUsernameField.bottom
                anchors.topMargin: 25
                font.pixelSize: 14
                font.weight: Font.Medium
            }

            TextField {
                id: loginPasswordField
                width: parent.width
                height: 50
                anchors.top: loginPasswordLabel.bottom
                anchors.topMargin: 10
                font.pixelSize: 16
                font.italic: false
                echoMode: TextInput.Password
                placeholderText: "Enter your password"
                placeholderTextColor: text_muted
                leftPadding: 20
                color: text_light
                background: Rectangle {
                    color: background_dark
                    radius: 50
                    border.color: parent.activeFocus ? primary : text_muted
                }
            }

            Button {
                id: loginButton
                width: parent.width
                text: loginButton.enabled ? qsTr("Login") : qsTr("Logging in...")
                font.weight: 650
                font.pixelSize: 20
                height: 50
                anchors.top: loginPasswordField.bottom
                anchors.topMargin: 35
                enabled: false
                HoverHandler {
                    cursorShape: parent.hovered ?
                    (!parent.enabled ? Qt.ForbiddenCursor : Qt.PointingHandCursor) : Qt.ArrowCursor
                }

                background: Rectangle {
                    color: loginButton.enabled ? primary : background_dark
                    radius: 50
                }
                onClicked: {
                    if (loginButton.enabled) {
                        loginButton.enabled = false
                        backend.authenticate(loginUsernameField.text, loginPasswordField.text)
                    }
                }
            }

            Rectangle {
                id: orDevider
                width: parent.width
                color: "#000000"
                anchors.top: loginButton.bottom
                anchors.topMargin: 30

                Rectangle {
                    id: leftOr
                    width: (parent.width - 30) / 2
                    height: 1
                    color: text_muted
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.left: parent.left
                    anchors.leftMargin: 0
                }

                Text {
                    id: or
                    text: qsTr("Or")
                    color: text_muted
                    font.pixelSize: 12
                    anchors.centerIn: parent
                }

                Rectangle {
                    id: rightOr
                    width: (parent.width - 30) / 2
                    height: 1
                    color: text_muted
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.right: parent.right
                    anchors.rightMargin: 0
                }
            }

            Row {
                id: signupContainer
                anchors.top: orDevider.bottom
                anchors.topMargin: 30
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 5
                Text {
                    text: "Don't have an account?"
                    color: text_muted
                    font.pixelSize: 14
                }
                Text {
                    id: signupLink
                    text: "Sign up"
                    color: linkArea.containsMouse ? text_light : primary
                    font.pixelSize: 14
                    font.bold: true
                    Rectangle {
                        anchors.bottom: parent.bottom
                        width: parent.width
                        height: 1
                        color: parent.color
                        visible: linkArea.containsMouse
                    }
                    MouseArea {
                        id: linkArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: Qt.openUrlExternally(signup_url)
                    }
                    Behavior on color {
                        ColorAnimation { duration: 150 }
                    }
                }
            }
            Label {
                id: errorLabel
                color: error_red
                anchors.top: signupContainer.bottom
                anchors.topMargin: 20
                font.pointSize: 10
                font.bold: true
                anchors.horizontalCenter: parent.horizontalCenter
            }

        }
    }

    Connections {
        target: backend
        function onLoginFailed(message) {
            errorLabel.text = message
        }
        function onAuthenticationFinished() {
            loginButton.enabled = true
        }
    }
}
