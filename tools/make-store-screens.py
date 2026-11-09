# Store screenshots: the app as the store version shows it, with a sample journal, at the sizes
# App Store and Google Play ask for. Usage: python3 tools/make-store-screens.py
# Writes assets/store/<device>/<n>-<screen>.png. Needs Python Playwright with Chromium.
import json, datetime, time, threading, http.server, functools, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/store'
DEVICES = {                       # css width, height, pixel ratio → image size
  'iphone-6.9': (440, 956, 3),    # 1320 × 2868, App Store iPhone 6.9"
  'ipad-13': (1032, 1376, 2),     # 2064 × 2752, App Store iPad 13"
  'android-telefon': (360, 640, 3),   # 1080 × 1920, Google Play phone
  'android-tableta': (800, 1280, 2),  # 1600 × 2560, Google Play 10" tablet
}

def journal():
    t = datetime.date.today(); now = datetime.datetime.now()
    at = lambda h, m=0, d=0: int(datetime.datetime.combine(t - datetime.timedelta(days=d), datetime.time(h, m)).timestamp() * 1000)
    k = lambda d: (t - datetime.timedelta(days=d)).isoformat()
    days = {}
    for d in range(1, 31):
        kc = [2410, 2580, 2290, 2650, 2470, 2380, 2520][d % 7]
        days[k(d)] = {'date': k(d), 'water': 2500 + (d % 3) * 250, 'weight': round(84.1 + d * 0.075 + (0.25 if d % 4 == 0 else 0), 1),
          'entries': [{'id': f'p{d}', 'name': 'Ziua de ieri', 'kcal': kc, 'protein': 170 + d % 5 * 4, 'carbs': 270, 'fat': 74, 'meal': 'lunch', 'at': at(13, 0, d), 'src': 'manual'}]}
    E = lambda i, n, g, kc, p, c, f, meal, h, m: {'id': i, 'name': n, 'grams': g, 'kcal': kc, 'protein': p, 'carbs': c, 'fat': f, 'meal': meal, 'at': at(h, m), 'src': 'manual'}
    days[k(0)] = {'date': k(0), 'water': 2000, 'weight': 84.1, 'entries': [
        E('a', 'Iaurt grecesc 2%', 250, 183, 23, 10, 5, 'breakfast', 8, 10),
        E('b', 'Ovăz', 50, 190, 6.5, 30, 3.5, 'breakfast', 8, 11),
        E('c', 'Afine', 80, 46, 0.6, 11, 0.3, 'breakfast', 8, 12),
        E('d', 'Piept de pui la grătar', 200, 330, 62, 0, 7, 'lunch', 13, 20),
        E('e', 'Orez basmati fiert', 180, 234, 4.9, 51, 0.5, 'lunch', 13, 21),
        E('f', 'Salată cu ulei de măsline', 150, 128, 1.8, 6, 11, 'lunch', 13, 22),
        E('g', 'Măr', 180, 94, 0.5, 25, 0.3, 'snack', 16, 40),
        E('h', 'Brânză cottage', 200, 196, 25, 7, 8, 'snack', 16, 41)]}
    consent = {'v': 1, 'health': at(8, 0, 30), 'ai': 0, 'age': True}
    prof = {'sex': 'm', 'age': 34, 'height': 181, 'weight': 86.4, 'activity': 'mod', 'goal': 'recomp',
            'targets': {'kcal': 2520, 'protein': 186, 'carbs': 290, 'fat': 70, 'water': 3000}, 'consent': consent, 'fast': {'plan': '16:8', 'hide': True},
            'plan': {'start': k(30), 'from': 86.4, 'to': 82, 'rate': -0.29}}
    lib = {'recipes': [], 'favorites': [], 'reports': [], 'products': [
        {'code': '5941234567890', 'name': 'Iaurt grecesc 2%', 'unit': 'g', 'per100': {'kcal': 73, 'protein': 9.2, 'carbs': 4, 'fat': 2}, 'serving': 150, 'pack': 400}]}
    return {'profile': prof, 'days': days, 'library': lib}, consent

# the store app's bridge, without the phone: native storage and calls that do nothing
FAKE = """window.Capacitor = { isNativePlatform: () => true, getPlatform: () => '%s', Plugins: new Proxy({}, { get: (_, n) => new Proxy({}, { get: (_, m) => m === 'addListener' ? () => Promise.resolve({ remove(){} }) : (n === 'Preferences' && m === 'keys') ? () => Promise.resolve({ keys: [] }) : () => Promise.resolve() }) }) };"""

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_address[1]}/index.html'

data, consent = journal()
with sync_playwright() as p:
    b = p.chromium.launch()
    for dev, (w, h, r) in DEVICES.items():
        plat = 'ios' if dev.startswith('i') else 'android'
        for mode in ['light', 'dark']:
            ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=r, has_touch=True, is_mobile=w < 700, color_scheme=mode)
            ctx.add_init_script(FAKE % plat)
            ctx.add_init_script("localStorage.setItem('portia-consent', %s); localStorage.setItem('mt-local', %s);" % (json.dumps(json.dumps(consent)), json.dumps(json.dumps(data))))
            pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(1400)
            pg.add_style_tag(content='.toast{display:none!important}')
            d = OUT / dev; d.mkdir(parents=True, exist_ok=True)
            def shot(name):
                pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(700)
                pg.screenshot(path=str(d / name)); print(dev + '/' + name)
            if mode == 'dark':
                shot('5-azi-intunecat.png'); ctx.close(); continue
            shot('1-azi.png')
            pg.click('#tabbar [data-nav="jurnal"]'); shot('2-jurnal.png')
            pg.click('#tabbar [data-nav="add"]'); pg.wait_for_timeout(300)
            pg.click('#logger [data-tab="barcode"]'); pg.fill('#bcCode', '5941234567890'); pg.click('[data-action="bc-lookup"]'); pg.wait_for_timeout(500)
            shot('3-cod-de-bare.png')
            pg.click('#tabbar [data-nav="progres"]'); shot('4-progres.png')
            ctx.close()
    b.close()
srv.shutdown()
