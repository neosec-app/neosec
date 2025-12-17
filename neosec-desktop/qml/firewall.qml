import QtQuick
import QtQuick.Controls

Item {
    id: root
    width: 780
    height: 720
    Text {
        text: qsTr("Firewall Page")
        anchors.fill: parent
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        font.pointSize: 30
        font.bold: true
        color: "orange"
    }
}
