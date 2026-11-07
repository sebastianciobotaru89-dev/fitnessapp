import SwiftUI

// Plain SwiftUI, no WidgetKit: the same views are drawn to pictures in CI to check the design.

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        if s.count == 3 {
            let r = (v >> 8) & 0xF, g = (v >> 4) & 0xF, b = v & 0xF
            self.init(red: Double(r * 17) / 255, green: Double(g * 17) / 255, blue: Double(b * 17) / 255)
        } else {
            self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
        }
    }
}

struct WTheme {
    let bg, surface, ink, muted, track, kcal, over, prot, carb, fat, dot, act: Color
    init(_ p: WidgetPalette) {
        bg = Color(hex: p.bg); surface = Color(hex: p.surface); ink = Color(hex: p.ink); muted = Color(hex: p.muted)
        track = Color(hex: p.track); kcal = Color(hex: p.kcal); over = Color(hex: p.over)
        prot = Color(hex: p.prot); carb = Color(hex: p.carb); fat = Color(hex: p.fat); dot = Color(hex: p.dot); act = Color(hex: p.act)
    }
}

let roNumber: NumberFormatter = {
    let f = NumberFormatter()
    f.locale = Locale(identifier: "ro_RO")
    f.numberStyle = .decimal
    f.maximumFractionDigits = 0
    return f
}()
func wfmt(_ v: Double) -> String { roNumber.string(from: NSNumber(value: v.rounded())) ?? String(Int(v.rounded())) }

/// The Azi dial in small: the eaten share as an arc, the theme's dot riding its end, what's left in the middle
struct DialView: View {
    let fig: DayFigures
    let t: WTheme
    var line: CGFloat = 10

    var body: some View {
        GeometryReader { g in
            let s = min(g.size.width, g.size.height)
            let frac = min(1, max(0, fig.fraction))
            let ring = fig.isOver ? t.over : t.kcal
            ZStack {
                Circle().stroke(t.track, lineWidth: line)
                if frac > 0.004 {
                Circle()
                    .trim(from: 0, to: frac)
                    .stroke(AngularGradient(gradient: Gradient(colors: [ring.opacity(0.45), ring]), center: .center, startAngle: .degrees(0), endAngle: .degrees(max(1, 360 * frac))),
                            style: StrokeStyle(lineWidth: line, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                }
                Circle().fill(t.dot)
                    .frame(width: line * 1.25, height: line * 1.25)
                    .overlay(Circle().fill(Color.white).frame(width: line * 0.45, height: line * 0.45))
                    .shadow(color: Color.black.opacity(0.18), radius: 1.5, y: 1)
                    .offset(y: -(s / 2 - line / 2))
                    .rotationEffect(.degrees(360 * frac))
                VStack(spacing: s * 0.01) {
                    Text(fig.isOver ? "peste" : "rămase")
                        .font(.system(size: s * 0.085, weight: .semibold))
                        .foregroundColor(t.muted)
                    Text(wfmt(fig.isOver ? fig.overBy : fig.remaining))
                        .font(.system(size: s * 0.215, weight: .heavy))
                        .tracking(-s * 0.006)
                        .monospacedDigit()
                        .foregroundColor(fig.isOver ? t.over : t.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text("din " + wfmt(fig.target))
                        .font(.system(size: s * 0.075, weight: .medium))
                        .foregroundColor(t.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .padding(.horizontal, line * 1.9)
            }
            .frame(width: s, height: s)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct MacroBar: View {
    let label: String
    let value: Double
    let target: Double
    let color: Color
    let t: WTheme

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 7, height: 7)
                Text(label).font(.system(size: 12.5, weight: .semibold)).foregroundColor(t.ink)
                Spacer(minLength: 4)
                (Text(wfmt(value)).foregroundColor(t.ink).fontWeight(.bold) + Text(" / " + wfmt(target) + " g").foregroundColor(t.muted))
                    .font(.system(size: 11.5, weight: .medium))
                    .monospacedDigit()
                    .lineLimit(1)
            }
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(t.track)
                    Capsule().fill(color)
                        .frame(width: max(6, g.size.width * min(1, value / max(1, target))))
                }
            }
            .frame(height: 6)
        }
    }
}

struct SmallDayView: View {
    let fig: DayFigures
    let t: WTheme
    var body: some View {
        if fig.setup { DialView(fig: fig, t: t, line: 11) } else { SetupView(t: t) }
    }
}

struct MediumDayView: View {
    let fig: DayFigures
    let t: WTheme
    var body: some View {
        if fig.setup {
            HStack(spacing: 16) {
                DialView(fig: fig, t: t, line: 11).frame(width: 128)
                VStack(alignment: .leading, spacing: 11) {
                    MacroBar(label: "Proteine", value: fig.p, target: fig.pT, color: t.prot, t: t)
                    MacroBar(label: "Glucide", value: fig.c, target: fig.cT, color: t.carb, t: t)
                    MacroBar(label: "Grăsimi", value: fig.f, target: fig.fT, color: t.fat, t: t)
                }
                .frame(maxWidth: .infinity)
            }
        } else { SetupView(t: t) }
    }
}

struct SetupView: View {
    let t: WTheme
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Circle().fill(t.dot).frame(width: 10, height: 10)
            Spacer(minLength: 0)
            Text("Porția").font(.system(size: 17, weight: .heavy)).foregroundColor(t.ink)
            Text("Deschide aplicația ca să-ți calculezi ținta.")
                .font(.system(size: 12.5, weight: .medium)).foregroundColor(t.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct ScanSmallView: View {
    let t: WTheme
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous).fill(t.act)
                BarcodeGlyph().stroke(Color.white, style: StrokeStyle(lineWidth: 2.4, lineCap: .round)).frame(width: 30, height: 24)
            }
            .frame(width: 56, height: 56)
            Spacer(minLength: 0)
            Text("Scanează").font(.system(size: 18, weight: .heavy)).foregroundColor(t.ink)
            Text("codul de bare").font(.system(size: 13, weight: .medium)).foregroundColor(t.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

/// Corner brackets and bars, drawn as lines so it looks the same everywhere
struct BarcodeGlyph: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let c: CGFloat = r.width * 0.22
        p.move(to: CGPoint(x: r.minX, y: r.minY + c)); p.addLine(to: CGPoint(x: r.minX, y: r.minY)); p.addLine(to: CGPoint(x: r.minX + c, y: r.minY))
        p.move(to: CGPoint(x: r.maxX - c, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.minY + c))
        p.move(to: CGPoint(x: r.minX, y: r.maxY - c)); p.addLine(to: CGPoint(x: r.minX, y: r.maxY)); p.addLine(to: CGPoint(x: r.minX + c, y: r.maxY))
        p.move(to: CGPoint(x: r.maxX - c, y: r.maxY)); p.addLine(to: CGPoint(x: r.maxX, y: r.maxY)); p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - c))
        let xs: [CGFloat] = [0.3, 0.42, 0.5, 0.62, 0.7]
        for x in xs {
            p.move(to: CGPoint(x: r.minX + r.width * x, y: r.minY + r.height * 0.28))
            p.addLine(to: CGPoint(x: r.minX + r.width * x, y: r.maxY - r.height * 0.28))
        }
        return p
    }
}
