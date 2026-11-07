// Draws the iOS widgets to pictures on the Mac that builds the app, so their design can be checked
// without a phone: the same SwiftUI views as in ios/App/PortiaWidget, light and dark.
// Usage: swiftc -parse-as-library tools/render-widgets.swift ios/App/PortiaWidget/WidgetData.swift ios/App/PortiaWidget/WidgetViews.swift -o render && ./render smoke
import SwiftUI
import AppKit

@main
struct RenderWidgets {
    @MainActor static func main() {
        let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
        var over = WidgetStore.sample
        over.eaten = 2790; over.p = 201; over.c = 288; over.f = 96
        var fresh = WidgetStore.sample
        fresh.eaten = 0; fresh.p = 0; fresh.c = 0; fresh.f = 0
        var empty = WidgetStore.sample
        empty.setup = false
        for (name, pal, wall) in [("luminos", WidgetStore.lightDefault, [Color(hex: "#9FB8C9"), Color(hex: "#D9C7E8")]),
                                  ("intunecat", WidgetStore.darkDefault, [Color(hex: "#1B2430"), Color(hex: "#3A2F4F")])] {
            let t = WTheme(pal)
            func card<V: View>(_ v: V, _ w: CGFloat, _ h: CGFloat) -> some View {
                v.padding(16).frame(width: w, height: h).background(t.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .shadow(color: .black.opacity(0.12), radius: 8, y: 3)
            }
            let sheet = VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 18) {
                    card(SmallDayView(fig: WidgetStore.sample, t: t), 170, 170)
                    card(MediumDayView(fig: WidgetStore.sample, t: t), 364, 170)
                }
                HStack(spacing: 18) {
                    card(SmallDayView(fig: over, t: t), 170, 170)
                    card(SmallDayView(fig: fresh, t: t), 170, 170)
                    card(SmallDayView(fig: empty, t: t), 170, 170)
                    card(ScanSmallView(t: t), 170, 170)
                }
                card(MediumDayView(fig: over, t: t), 364, 170)
            }
            .padding(28)
            .background(LinearGradient(colors: wall, startPoint: .topLeading, endPoint: .bottomTrailing))
            .environment(\.colorScheme, name == "luminos" ? .light : .dark)
            let r = ImageRenderer(content: sheet)
            r.scale = 2
            guard let img = r.nsImage, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                  let png = rep.representation(using: .png, properties: [:]) else {
                print("::error::Nu am putut desena widgeturile (\(name))"); exit(1)
            }
            let path = out + "/ios-widgeturi-" + name + ".png"
            do { try png.write(to: URL(fileURLWithPath: path)) } catch { print("::error::\(error)"); exit(1) }
            print("Am desenat " + path)
        }
    }
}
