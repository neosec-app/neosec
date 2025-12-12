import QtQuick
import QtQuick.Controls

Page {
    id: page
    anchors.centerIn: parent
    height: 720
    width: 1080

    property color primary: "#36e27b"
    property color background_light: "#f6f6f6"
    property color background_dark: "#121212"
    property color form_background_dark: "#181818"
    property color input_background_dark: "#282828"
    property color text_light: "#ffffff"
    property color text_muted: "#b3b3b3"
    property color error_red: "#d32f2f"
    property string username: " "
    property string currentSelection: "dashboardBtn"

    Rectangle {
        id: bg
        color: background_dark
        anchors.fill: parent
    }

    Rectangle {
        id: leftBar
        width: 300
        color: form_background_dark
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.bottom: parent.bottom

        Rectangle {
            id: titleBar
            anchors.top: parent.top
            anchors.topMargin: 10
            width: parent.width - 40
            height: 80
            anchors.horizontalCenter: parent.horizontalCenter
            color: "transparent"

            Image {
                id: logo
                height: parent.height - 10
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.leftMargin: 5
                source: "images/logo.svg"
                fillMode: Image.PreserveAspectFit
                sourceSize.width: width
                sourceSize.height: height
            }

            Text {
                id: titleLabel
                text: qsTr("NEOSEC")
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: text_light
                anchors.top: parent.top
                anchors.topMargin: 20
                anchors.left: logo.right
                anchors.leftMargin: 5
            }

            Text {
                id: usernameLable
                text: username
                color: text_muted
                font.pixelSize: 12
                anchors.left: titleLabel.left
                anchors.top: titleLabel.bottom
            }
        }

        Column {
            id: menuBar
            anchors.top: titleBar.bottom
            anchors.topMargin: 30
            spacing: 2
            width: parent.width - 20
            anchors.horizontalCenter: parent.horizontalCenter
            Button {
                id: dashboardBtn
                height: 50
                width: parent.width
                onClicked: {
                    page.currentSelection = "dashboardBtn"
                }
                contentItem: Row {
                    spacing: 10
                    anchors.left: parent.left
                    anchors.leftMargin: 20
                    Image {
                        id: dashboardLogo
                        height: parent.height
                        source: "images/profile.svg"
                        fillMode: Image.PreserveAspectFit
                        sourceSize.width: width
                        sourceSize.height: height
                    }
                    Text {
                        id: dashboardBtnLabel
                        text: "Dashboard"
                        anchors.verticalCenter: parent.verticalCenter
                        font.weight: Font.Medium
                        font.pointSize: 12
                        color: text_light
                    }
                }
                background: Rectangle {
                    color: page.currentSelection === "dashboardBtn" ? background_dark : form_background_dark
                    radius: 5
                }
            }
            Button {
                id: vpnBtn
                height: 50
                width: parent.width
                onClicked: {
                    page.currentSelection = "vpnBtn"
                }
                contentItem: Row {
                    spacing: 10
                    anchors.left: parent.left
                    anchors.leftMargin: 20
                    Image {
                        id: vpnLogo
                        height: parent.height
                        source: "images/vpn.svg"
                        fillMode: Image.PreserveAspectFit
                        sourceSize.width: width
                        sourceSize.height: height
                    }
                    Text {
                        id: vpnBtnLabel
                        text: "VPN"
                        anchors.verticalCenter: parent.verticalCenter
                        font.weight: Font.Medium
                        font.pointSize: 12
                        color: text_light
                    }
                }
                background: Rectangle {
                    color: page.currentSelection === "vpnBtn" ? background_dark : form_background_dark
                    radius: 5
                }
            }
            Button {
                id: firewallBtn
                height: 50
                width: parent.width
                onClicked: {
                    page.currentSelection = "firewallBtn"
                }
                contentItem: Row {
                    spacing: 10
                    anchors.left: parent.left
                    anchors.leftMargin: 20
                    Image {
                        id: firewallLogo
                        height: parent.height
                        source: "images/firewall.svg"
                        fillMode: Image.PreserveAspectFit
                        sourceSize.width: width
                        sourceSize.height: height
                    }
                    Text {
                        id: firewallBtnLabel
                        text: "Firewall"
                        anchors.verticalCenter: parent.verticalCenter
                        font.weight: Font.Medium
                        font.pointSize: 12
                        color: text_light
                    }
                }
                background: Rectangle {
                    color: page.currentSelection === "firewallBtn" ? background_dark : form_background_dark
                    radius: 5
                }
            }
        }

        Button {
            id: logoutBtn
            width: parent.width - 20
            anchors.horizontalCenter: parent.horizontalCenter
            height: 40
            anchors.bottom: parent.bottom
            anchors.bottomMargin: 30
            onClicked: backend.handleLogout()
            contentItem: Text {
                id: logoutBtnLabel
                text: "Logout"
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                font.pointSize: 12
                font.weight: Font.DemiBold
                anchors.centerIn: parent
                color: text_light
            }
            background: Rectangle {
                color: error_red
                radius: 5
            }
        }

    }
}
