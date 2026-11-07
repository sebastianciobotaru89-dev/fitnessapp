import Foundation

// The app writes the day's figures here (JSON, in the shared App Group); the widgets only read them.
let portiaGroup = "group.com.portia.app"

struct WidgetPalette: Codable {
    var bg, surface, ink, muted, track, kcal, over, prot, carb, fat, dot, act: String
}

struct WidgetNext: Codable {
    var day: String
    var target: Double
    var p: Double
    var c: Double
    var f: Double
}

struct WidgetSnapshot: Codable {
    var v: Int
    var setup: Bool
    var day: String
    var eaten: Double
    var target: Double
    var p: [Double]
    var c: [Double]
    var f: [Double]
    var next: WidgetNext?
    var light: WidgetPalette
    var dark: WidgetPalette
}

/// What a widget shows at one moment: today's figures, or an empty new day after midnight.
struct DayFigures {
    var setup: Bool
    var eaten: Double
    var target: Double
    var p: Double, pT: Double
    var c: Double, cT: Double
    var f: Double, fT: Double
    var light: WidgetPalette
    var dark: WidgetPalette

    var remaining: Double { max(0, target - eaten) }
    var overBy: Double { max(0, eaten - target) }
    var isOver: Bool { target > 0 && eaten > target * 1.02 }
    var fraction: Double { target > 0 ? eaten / target : 0 }
}

enum WidgetStore {
    static let lightDefault = WidgetPalette(bg: "#F6F6F3", surface: "#FFFFFF", ink: "#14201A", muted: "#646F69", track: "#E9EBE6", kcal: "#0F9D58", over: "#E8590C", prot: "#E5484D", carb: "#E9A100", fat: "#4F6BED", dot: "#F0603A", act: "#FF6A4D")
    static let darkDefault = WidgetPalette(bg: "#0C0F0E", surface: "#161A18", ink: "#EEF3EF", muted: "#94A19A", track: "#232A26", kcal: "#4ADE8E", over: "#FF8A3D", prot: "#FF6B78", carb: "#FFC54D", fat: "#8296FF", dot: "#F0603A", act: "#FF6A4D")

    static func load() -> WidgetSnapshot? {
        guard let raw = UserDefaults(suiteName: portiaGroup)?.string(forKey: "snapshot"),
              let data = raw.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    static func dayKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    static func figures(_ s: WidgetSnapshot?, at date: Date) -> DayFigures {
        guard let s = s, s.setup, s.target > 0 else {
            return DayFigures(setup: false, eaten: 0, target: 0, p: 0, pT: 0, c: 0, cT: 0, f: 0, fT: 0, light: s?.light ?? lightDefault, dark: s?.dark ?? darkDefault)
        }
        let key = dayKey(date)
        func at(_ a: [Double], _ i: Int) -> Double { a.count > i ? a[i] : 0 }
        if s.day == key {
            return DayFigures(setup: true, eaten: s.eaten, target: s.target, p: at(s.p, 0), pT: at(s.p, 1), c: at(s.c, 0), cT: at(s.c, 1), f: at(s.f, 0), fT: at(s.f, 1), light: s.light, dark: s.dark)
        }
        // a new day the app hasn't opened yet: nothing eaten, and the day's own targets when the app sent them
        if let n = s.next, n.day == key {
            return DayFigures(setup: true, eaten: 0, target: n.target, p: 0, pT: n.p, c: 0, cT: n.c, f: 0, fT: n.f, light: s.light, dark: s.dark)
        }
        return DayFigures(setup: true, eaten: 0, target: s.target, p: 0, pT: at(s.p, 1), c: 0, cT: at(s.c, 1), f: 0, fT: at(s.f, 1), light: s.light, dark: s.dark)
    }

    /// Shown in the widget gallery before the app has written anything
    static let sample = DayFigures(setup: true, eaten: 1412, target: 2520, p: 124, pT: 186, c: 140, cT: 290, f: 36, fT: 70, light: lightDefault, dark: darkDefault)
}
