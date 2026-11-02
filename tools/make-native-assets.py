# Draws the source images Capacitor uses for the app icon and the launch screen, from the logo in the app.
# Usage: python3 tools/make-native-assets.py   (needs Python Playwright with Chromium)
# Writes assets/: icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png.
# Then `npx capacitor-assets generate --ios --android` turns them into every size the stores need.
import os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
LIGHT_BG, DARK_BG = '#EFF4F1', '#0A110E'

PAGE = '''<!doctype html><html><head><style>
html,body{margin:0;background:transparent}
#c{position:relative;overflow:hidden;width:%(s)dpx;height:%(s)dpx;background:%(bg)s}
#c svg.logo{position:absolute;left:50%%;top:50%%;width:%(l)dpx;height:%(l)dpx;transform:translate(-50%%,-50%%)}
</style></head><body>%(defs)s<div id="c">%(logo)s</div></body></html>'''

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto((ROOT / 'index.html').as_uri())
    pg.wait_for_selector('#brandMark svg')
    defs = pg.evaluate("document.querySelector('#app > svg').outerHTML")
    raw = pg.evaluate("document.querySelector('#brandMark svg').outerHTML")

    def logo(kind):
        # kind: 'full' square tile, 'glyph' strands and dot only, 'tile' rounded tile for the launch screen
        return pg.evaluate('''([raw, kind]) => {
          const t = document.createElement('template'); t.innerHTML = raw.trim();
          const s = t.content.firstElementChild; s.setAttribute('class', 'logo');
          s.removeAttribute('width'); s.removeAttribute('height');
          const rects = [...s.querySelectorAll(':scope > rect')];
          const bg = rects[0], rim = rects[rects.length - 1];
          // the phone draws its own corners and highlights on store icons, so they get no rim and no sheen
          const noSheen = () => s.querySelectorAll(':scope > path').forEach(p => { if (/pSheen/.test(p.getAttribute('fill') || '')) p.remove(); });
          if (kind === 'full'){ bg.setAttribute('rx', '0'); rim.remove(); noSheen(); }
          if (kind === 'glyph'){ bg.remove(); rim.remove(); noSheen(); }
          return s.outerHTML;
        }''', [raw, kind])

    def shot(name, size, bg, kind, scale):
        html = PAGE % {'s': size, 'bg': bg, 'l': round(size * scale), 'defs': defs, 'logo': logo(kind) if kind else ''}
        pg.set_viewport_size({'width': size, 'height': size})
        pg.set_content(html)
        pg.locator('#c').screenshot(path=str(OUT / name), omit_background=True)
        print('assets/' + name)

    bg_grad = pg.evaluate('''() => { const s = [...document.querySelectorAll('#brandMark svg defs > linearGradient:first-child stop')].map(x => x.getAttribute('stop-color')); return s; }''')
    grad = 'linear-gradient(135deg,%s,%s)' % (bg_grad[0], bg_grad[-1])
    shot('icon-only.png', 1024, grad, 'full', 1.12)
    shot('icon-background.png', 1024, grad, None, 0)
    shot('icon-foreground.png', 1024, 'transparent', 'glyph', 0.62)
    shot('splash.png', 2732, LIGHT_BG, 'tile', 0.17)
    shot('splash-dark.png', 2732, DARK_BG, 'tile', 0.17)
    b.close()
