#!/usr/bin/env bash
# Smoke test of the iOS app on simulators, run by the "construire de test" workflow.
# Installs the simulator build on an iPhone and an iPad, opens Porția with a sample journal
# placed in its native storage (so the restore path runs too), photographs it in light and dark,
# and fails if the app crashes or logs a JavaScript error.
# Usage: bash tools/ios-smoke.sh path/to/App.app
set -uo pipefail
APP="$1"; BUNDLE=com.portia.app; OUT=smoke; mkdir -p "$OUT"
fail=0
note(){ echo "::notice::$1"; }
# macOS has no `timeout`; perl's alarm stops a command that hangs
limit(){ local secs="$1"; shift; perl -e 'alarm shift; exec @ARGV' "$secs" "$@"; }
# opens the app and returns at once; its console output goes to a file
launch(){ ( xcrun simctl launch --terminate-running-process --stdout="$3" --stderr="$3.err" "$1" "$2" >/dev/null 2>&1 & ); }
err(){ echo "::error::$1"; fail=1; }

# newest iOS runtime, then its first iPhone and first iPad
read -r RUNTIME IPHONE IPAD < <(xcrun simctl list -j | python3 -c '
import json, sys
d = json.load(sys.stdin)
rts = sorted([r for r in d["runtimes"] if r.get("isAvailable") and r["identifier"].split(".")[-1].startswith("iOS")], key=lambda r: [int(x) for x in r["version"].split(".")])
rt = rts[-1]["identifier"]
devs = d["devices"].get(rt, [])
ok = [x for x in devs if x.get("isAvailable")]
def pick(w, prefs):
    for p in prefs:
        m = [x["udid"] for x in ok if x["name"].startswith(w) and p in x["name"]]
        if m: return m[0]
    m = [x["udid"] for x in ok if x["name"].startswith(w)]
    return m[0] if m else ""
print(rt, pick("iPhone", ["Pro Max", "Plus", "Pro"]), pick("iPad", ["13-inch", "Pro", "Air"]))')
note "Simulator: $RUNTIME"

SEED=$(python3 - <<'PY'
import json, datetime, time
t = datetime.date.today(); now = int(time.time() * 1000)
days = {}
for i in range(1, 7):
    d = (t - datetime.timedelta(days=i)).isoformat()
    days[d] = {"date": d, "water": 2250, "weight": round(84.6 - i * 0.15, 1), "entries": [{"id": f"y{i}", "name": "Ovăz cu lapte și banană", "kcal": 2350 + i * 70, "protein": 150 + i * 4, "carbs": 260, "fat": 72, "meal": "breakfast", "at": now - i * 86400000, "src": "manual"}]}
k = t.isoformat()
days[k] = {"date": k, "water": 1250, "entries": [
  {"id": "a", "name": "2 ouă ochiuri", "grams": 110, "kcal": 196, "protein": 13.6, "carbs": 0.9, "fat": 15, "meal": "breakfast", "at": now - 5000000, "src": "manual"},
  {"id": "b", "name": "Pâine integrală", "grams": 40, "kcal": 98, "protein": 4, "carbs": 17, "fat": 1.3, "meal": "breakfast", "at": now - 4900000, "src": "manual"},
  {"id": "c", "name": "Piept de pui la grătar", "grams": 200, "kcal": 330, "protein": 62, "carbs": 0, "fat": 7, "meal": "lunch", "at": now - 1000000, "src": "manual"},
  {"id": "d", "name": "Orez basmati", "grams": 150, "kcal": 195, "protein": 4, "carbs": 42, "fat": 0.5, "meal": "lunch", "at": now - 900000, "src": "manual"}]}
consent = {"v": 1, "health": now, "ai": 0, "age": True}
prof = {"sex": "m", "age": 34, "height": 181, "weight": 84.5, "activity": "mod", "goal": "recomp", "targets": {"kcal": 2520, "protein": 186, "carbs": 290, "fat": 70, "water": 3000}, "consent": consent}
print(json.dumps({"profile": prof, "days": days, "library": {"recipes": [], "favorites": [], "reports": [], "products": []}}, ensure_ascii=False))
PY
)
CONSENT='{"v":1,"health":1,"ai":0,"age":true}'

run(){
  local name="$1" udid="$2"
  [ -n "$udid" ] || { err "Nu găsesc un simulator $name."; return; }
  local t0=$SECONDS
  xcrun simctl boot "$udid" 2>/dev/null
  limit 600 xcrun simctl bootstatus "$udid" -b >/dev/null || { err "$name: simulatorul nu a pornit în 10 minute"; return; }
  note "$name: simulator pornit în $((SECONDS - t0)) s"
  xcrun simctl ui "$udid" appearance light
  limit 300 xcrun simctl install "$udid" "$APP" || { err "$name: instalarea a eșuat"; return; }

  # first run: the welcome screen
  launch "$udid" "$BUNDLE" "$OUT/ios-$name-1.log"
  sleep 12
  limit 60 xcrun simctl io "$udid" screenshot "$OUT/ios-$name-1-bun-venit.png" >/dev/null
  limit 30 xcrun simctl terminate "$udid" "$BUNDLE" 2>/dev/null

  # a returning user: the journal sits only in native storage and must come back into the app
  limit 60 xcrun simctl spawn "$udid" defaults write "$BUNDLE" "CapacitorStorage.mt-local" -string "$SEED"
  limit 60 xcrun simctl spawn "$udid" defaults write "$BUNDLE" "CapacitorStorage.portia-consent" -string "$CONSENT"
  launch "$udid" "$BUNDLE" "$OUT/ios-$name-2.log"
  sleep 12
  limit 60 xcrun simctl io "$udid" screenshot "$OUT/ios-$name-2-azi.png" >/dev/null
  limit 30 xcrun simctl ui "$udid" appearance dark; sleep 4
  limit 60 xcrun simctl io "$udid" screenshot "$OUT/ios-$name-3-azi-intunecat.png" >/dev/null
  limit 30 xcrun simctl ui "$udid" appearance light

  if limit 30 xcrun simctl spawn "$udid" launchctl list | grep -q "UIKitApplication:$BUNDLE"; then note "$name: aplicația rulează"; else err "$name: aplicația nu mai rulează"; fi
  cat "$OUT"/ios-"$name"-*.log "$OUT"/ios-"$name"-*.err > "$OUT/ios-$name-consola.txt" 2>/dev/null
  if grep -E "\[error\]|Uncaught|TypeError|ReferenceError|SyntaxError" "$OUT/ios-$name-consola.txt" | grep -v favicon > "$OUT/ios-$name-erori.txt"; then
    err "$name: erori JavaScript: $(head -3 "$OUT/ios-$name-erori.txt" | tr '\n' ' ')"
  else note "$name: nicio eroare JavaScript"; fi
  grep -E "⚡️|Capacitor" "$OUT/ios-$name-consola.txt" | head -15
  limit 60 xcrun simctl shutdown "$udid" 2>/dev/null
}

run iphone "$IPHONE"
run ipad "$IPAD"
exit $fail
