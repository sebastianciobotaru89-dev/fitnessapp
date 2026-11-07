import WidgetKit
import SwiftUI

struct DayEntry: TimelineEntry {
    let date: Date
    let fig: DayFigures
}

struct DayProvider: TimelineProvider {
    func placeholder(in context: Context) -> DayEntry { DayEntry(date: Date(), fig: WidgetStore.sample) }

    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        let s = WidgetStore.load()
        let fig = (s == nil && context.isPreview) ? WidgetStore.sample : WidgetStore.figures(s, at: Date())
        completion(DayEntry(date: Date(), fig: fig))
    }

    // Today as it is now, then an empty new day from midnight until the app is opened again
    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        let now = Date()
        let s = WidgetStore.load()
        let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
        let entries = [
            DayEntry(date: now, fig: WidgetStore.figures(s, at: now)),
            DayEntry(date: midnight, fig: WidgetStore.figures(s, at: midnight.addingTimeInterval(60)))
        ]
        completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(3_600))))
    }
}

struct DayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    let entry: DayEntry

    var body: some View {
        let fig = entry.fig
        let t = WTheme(scheme == .dark ? fig.dark : fig.light)
        content(fig, t)
            .widgetURL(URL(string: "portia://azi"))
    }

    @ViewBuilder
    private func content(_ fig: DayFigures, _ t: WTheme) -> some View {
        switch family {
        case .systemMedium:
            MediumDayView(fig: fig, t: t).containerBackground(t.surface, for: .widget)
        case .accessoryCircular:
            Gauge(value: min(1, max(0, fig.fraction))) {
                Text("kcal")
            } currentValueLabel: {
                Text(fig.setup ? wfmt(fig.isOver ? fig.overBy : fig.remaining) : "–").monospacedDigit()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .containerBackground(.clear, for: .widget)
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 3) {
                if fig.setup {
                    Text(fig.isOver ? wfmt(fig.overBy) + " kcal peste" : wfmt(fig.remaining) + " kcal rămase")
                        .font(.system(size: 15, weight: .bold)).monospacedDigit()
                    Gauge(value: min(1, max(0, fig.fraction))) { EmptyView() }.gaugeStyle(.accessoryLinearCapacity)
                    Text("Proteine " + wfmt(fig.p) + " din " + wfmt(fig.pT) + " g")
                        .font(.system(size: 12, weight: .medium)).monospacedDigit()
                } else {
                    Text("Porția").font(.system(size: 15, weight: .bold))
                    Text("Calculează-ți ținta în aplicație").font(.system(size: 12))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .containerBackground(.clear, for: .widget)
        case .accessoryInline:
            Text(fig.setup ? (fig.isOver ? wfmt(fig.overBy) + " kcal peste țintă" : wfmt(fig.remaining) + " kcal rămase") : "Porția")
                .containerBackground(.clear, for: .widget)
        default:
            SmallDayView(fig: fig, t: t).containerBackground(t.surface, for: .widget)
        }
    }
}

struct PortiaDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PortiaDay", provider: DayProvider()) { entry in
            DayWidgetView(entry: entry)
        }
        .configurationDisplayName("Ziua ta")
        .description("Câte calorii îți mai rămân azi și cum stai cu proteinele, glucidele și grăsimile.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// The scan shortcut: one tap and Porția opens on the barcode scanner
struct ScanEntry: TimelineEntry {
    let date: Date
    let light: WidgetPalette
    let dark: WidgetPalette
}

struct ScanProvider: TimelineProvider {
    private func entry() -> ScanEntry {
        let s = WidgetStore.load()
        return ScanEntry(date: Date(), light: s?.light ?? WidgetStore.lightDefault, dark: s?.dark ?? WidgetStore.darkDefault)
    }
    func placeholder(in context: Context) -> ScanEntry { entry() }
    func getSnapshot(in context: Context, completion: @escaping (ScanEntry) -> Void) { completion(entry()) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ScanEntry>) -> Void) {
        completion(Timeline(entries: [entry()], policy: .never))
    }
}

struct ScanWidgetView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    let entry: ScanEntry

    var body: some View {
        let t = WTheme(scheme == .dark ? entry.dark : entry.light)
        Group {
            if family == .accessoryCircular {
                ZStack {
                    AccessoryWidgetBackground()
                    Image(systemName: "barcode.viewfinder").font(.system(size: 24, weight: .semibold))
                }
                .containerBackground(.clear, for: .widget)
            } else {
                ScanSmallView(t: t).containerBackground(t.surface, for: .widget)
            }
        }
        .widgetURL(URL(string: "portia://scan"))
    }
}

struct PortiaScanWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PortiaScan", provider: ScanProvider()) { entry in
            ScanWidgetView(entry: entry)
        }
        .configurationDisplayName("Scanează")
        .description("Deschide Porția direct pe scanarea codului de bare.")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

@main
struct PortiaWidgets: WidgetBundle {
    var body: some Widget {
        PortiaDayWidget()
        PortiaScanWidget()
    }
}
