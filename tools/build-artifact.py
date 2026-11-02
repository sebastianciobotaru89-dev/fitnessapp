# Builds the single-file page for the Claude artifact from index.html, css/styles.css and js/app.js.
# Usage: python3 tools/build-artifact.py . portia-artifact.html
import sys, re
repo, out = sys.argv[1], sys.argv[2]
idx = open(f'{repo}/index.html', encoding='utf-8').read()
css = open(f'{repo}/css/styles.css', encoding='utf-8').read()
js = open(f'{repo}/js/app.js', encoding='utf-8').read()
# the artifact wrapper already supplies the base reset
assert css.startswith('/* Base:')
css = css[css.index('\n\n') + 2:]
# the artifact can't reach the bundled font files, so it loads the same families from Google Fonts
a, z = css.index('/* fonts: bundled'), css.index('/* @fonts-end */') + len('/* @fonts-end */\n\n')
css = css[:a] + css[z:]
body = idx[idx.index('<body>\n') + len('<body>\n'):idx.index('<script src="js/app.js"></script>')].rstrip('\n')
head = '\n'.join([
  '<title>Porția</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Instrument+Sans:wght@400..700&family=Chakra+Petch:wght@500;600;700&display=swap">',
])
page = head + '\n<style>\n' + css.rstrip('\n') + '\n</style>\n<style id="themeStyle"></style>\n' + body + '\n\n<script>\n' + js.rstrip('\n') + '\n</script>\n'
open(out, 'w', encoding='utf-8').write(page)
