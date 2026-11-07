import UIKit
import Capacitor

/// Capacitor's view controller, plus the plugins that live in this app's own code
class PortiaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(PortiaWidgetPlugin())
    }
}
