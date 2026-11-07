import Foundation
import Capacitor
import WidgetKit

/// Hands the day's figures to the widgets: the app writes one small JSON snapshot into the shared
/// App Group and asks WidgetKit to redraw. Nothing leaves the phone.
@objc(PortiaWidgetPlugin)
public class PortiaWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PortiaWidgetPlugin"
    public let jsName = "PortiaWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        guard let data = call.getString("data"), !data.isEmpty, data.utf8.count < 16_000 else {
            call.reject("Lipsesc datele pentru widget")
            return
        }
        guard let store = UserDefaults(suiteName: "group.com.portia.app") else {
            call.reject("Grupul aplicației nu e disponibil")
            return
        }
        if store.string(forKey: "snapshot") != data {
            store.set(data, forKey: "snapshot")
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}
