# Draws the Google Play feature graphic (1024×500) from the app's logo and fonts.
# Usage: python3 tools/make-store-graphics.py   → assets/store/feature-graphic.png
import pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/store'; OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto((ROOT / 'index.html').as_uri()); pg.wait_for_selector('#brandMark svg')
    defs = pg.evaluate("document.querySelector('#app > svg').outerHTML")
    logo = pg.evaluate("(() => { const s = document.querySelector('#brandMark svg').cloneNode(true); s.setAttribute('width', 210); s.setAttribute('height', 210); return s.outerHTML; })()")
    fonts = (ROOT / 'fonts').as_uri()
    html = f'''<!doctype html><html><head><style>
@font-face{{font-family:Archivo;src:url({fonts}/archivo.woff) format("woff");font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:"Instrument Sans";src:url({fonts}/instrument-sans.woff) format("woff");font-weight:400 700}}
html,body{{margin:0}}
#c{{position:relative;overflow:hidden;width:1024px;height:500px;display:flex;align-items:center;gap:48px;padding:0 84px;box-sizing:border-box;color:#fff;
  background:radial-gradient(120% 110% at 100% 0%,#1d7a4c 0%,transparent 60%),linear-gradient(160deg,#0d3a24 0%,#04120b 100%)}}
#c::before{{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 86% 50%,rgb(255 255 255 / .07) 0 1.4px,transparent 2px 30px);-webkit-mask:radial-gradient(70% 90% at 86% 50%,#000,transparent);mask:radial-gradient(70% 90% at 86% 50%,#000,transparent)}}
.logo{{position:relative;flex:none;filter:drop-shadow(0 30px 40px rgb(0 0 0 / .45))}}
.t{{position:relative}}
h1{{font-family:Archivo;font-stretch:120%;font-weight:880;font-size:112px;line-height:.9;letter-spacing:-.035em;margin:0}}
p{{font-family:"Instrument Sans";font-size:31px;line-height:1.25;margin:18px 0 0;color:rgb(255 255 255 / .78);max-width:520px}}
</style></head><body>{defs}<div id="c"><div class="logo">{logo}</div><div class="t"><h1>Porția</h1><p>Calorii și macronutrienți,<br>notate în câteva secunde.</p></div></div></body></html>'''
    pg.set_viewport_size({'width': 1024, 'height': 500}); pg.set_content(html); pg.wait_for_timeout(400)
    pg.locator('#c').screenshot(path=str(OUT / 'feature-graphic.png'))
    b.close()
print('assets/store/feature-graphic.png')
