// Smoke test of the Android app on an emulator, run by the "construire de test" workflow.
// Installs the debug APK, opens Porția, drives it through the WebView's DevTools protocol,
// photographs the real screen and fails on JavaScript errors or broken native features.
// Usage: node tools/android-smoke.mjs path/to/app-debug.apk
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const APK = process.argv[2];
// The consent version the app asks for today, read from the app itself: with an older one the seeded journal
// would open on "Am actualizat acordul" and every tap after it would land on that sheet
const CONSENT_V = Number((readFileSync(new URL('../js/app.js', import.meta.url), 'utf8').match(/const CONSENT_V = (\d+)/) || [])[1]) || 1;
const PKG = 'com.portia.app';
const OUT = 'smoke';
mkdirSync(OUT, { recursive: true });
const sh = c => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// GitHub keeps only 10 annotations of each kind per step: failures are errors, findings are warnings,
// and everything that passed goes into one notice at the end
const errors = [], passed = [];
const ok = (name, cond, extra) => {
  const line = (cond ? 'OK  ' : 'EȘEC ') + name + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '');
  console.log(cond ? line : '::error::' + line);
  if (cond) passed.push(name); else errors.push(name);
};
const info = msg => console.log('::warning::' + msg);
const shot = name => writeFileSync(`${OUT}/android-${name}.png`, execSync('adb exec-out screencap -p', { maxBuffer: 64 << 20 }));

// one day of food, to see the screens with content
function seed(){
  const k = d => d.toISOString().slice(0, 10), t = new Date(), at = Date.now();
  const days = {};
  for (let i = 1; i <= 6; i++){ const d = new Date(t); d.setDate(d.getDate() - i); days[k(d)] = { date: k(d), water: 2250, weight: +(84.6 - i * 0.15).toFixed(1), entries: [{ id: 'y' + i, name: 'Ovăz cu lapte și banană', kcal: 2350 + i * 70, protein: 150 + i * 4, carbs: 260, fat: 72, meal: 'breakfast', at: at - i * 864e5, src: 'manual' }] }; }
  days[k(t)] = { date: k(t), water: 1250, entries: [
    { id: 'a', name: '2 ouă ochiuri', grams: 110, kcal: 196, protein: 13.6, carbs: 0.9, fat: 15, meal: 'breakfast', at: at - 5e6, src: 'manual' },
    { id: 'b', name: 'Pâine integrală', grams: 40, kcal: 98, protein: 4, carbs: 17, fat: 1.3, meal: 'breakfast', at: at - 4.9e6, src: 'manual' },
    { id: 'c', name: 'Piept de pui la grătar', grams: 200, kcal: 330, protein: 62, carbs: 0, fat: 7, meal: 'lunch', at: at - 1e6, src: 'manual' },
    { id: 'd', name: 'Orez basmati', grams: 150, kcal: 195, protein: 4, carbs: 42, fat: 0.5, meal: 'lunch', at: at - 0.9e6, src: 'manual' }] };
  const consent = { v: CONSENT_V, health: at, ai: 0, age: true };
  const profile = { sex: 'm', age: 34, height: 181, weight: 84.5, activity: 'mod', goal: 'recomp', targets: { kcal: 2520, protein: 186, carbs: 290, fat: 70, water: 3000 }, consent };
  return { data: { profile, days, library: { recipes: [], favorites: [], reports: [], products: [] } }, consent };
}

async function connect(){
  for (let i = 0; i < 60; i++){
    // the app's own web view: after a restart an old socket can linger, so prefer the running process
    let pid = ''; try { pid = sh(`adb shell pidof ${PKG}`).trim().split(/\s+/)[0]; } catch {}
    const socks = (sh('adb shell cat /proc/net/unix').match(/@webview_devtools_remote_\d+/g) || []).map(x => x.slice(1));
    const mine = socks.filter(x => pid && x.endsWith('_' + pid));
    // if the process can't be matched for a while, try every socket, newest pid first
    const tryList = mine.length ? mine : i >= 8 ? [...new Set(socks)].sort((a, b) => Number(b.split('_').pop()) - Number(a.split('_').pop())) : [];
    for (const name of tryList){
      try { sh('adb forward --remove tcp:9222'); } catch {}
      try {
        sh(`adb forward tcp:9222 localabstract:${name}`);
        const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
        const t = list.find(x => x.type === 'page' && /localhost/.test(x.url));
        if (t) return cdp(t.webSocketDebuggerUrl);
      } catch {}
    }
    await sleep(1000);
  }
  throw new Error('Nu găsesc WebView-ul aplicației.');
}
async function cdp(url){
  const ws = new WebSocket(url); let id = 0; const pend = new Map(), seen = [];
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)){ const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') seen.push('excepție: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') seen.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  return { send, ev, seen, close: () => ws.close() };
}
const start = () => sh(`adb shell am start -W -n ${PKG}/.MainActivity`);
// where the web view sits on the screen: below the status bar when Capacitor pads it (older Android System WebView)
let VIEW = null;
function webviewBox(){
  sh('adb shell uiautomator dump /sdcard/ui.xml');
  const xml = sh('adb shell cat /sdcard/ui.xml');
  const m = xml.match(/class="android\.webkit\.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  return m ? { x: +m[1], y: +m[2], w: m[3] - m[1], h: m[4] - m[2] } : null;
}
// css pixels inside the page → screen pixels for adb
const toScreen = (x, y) => ({ x: Math.round(VIEW.x + x * VIEW.k), y: Math.round(VIEW.y + y * VIEW.k) });
// a real finger tap through Android's input system, at the element's place on the screen
const tap = async (page, sel) => {
  const r = await page.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, hit = document.elementFromPoint(x, y); return { x, y, covered: !!hit && hit !== el && !el.contains(hit) }; })()`);
  if (!r){ ok('găsesc ' + sel, false); return; }
  // the tab bar floats over the bottom of the page: an element under it would get the tap of the button above it
  if (r.covered) info('acoperit de alt element: ' + sel);
  const p = toScreen(r.x, r.y);
  await page.ev(`window.__tap = null; document.addEventListener('click', e => { window.__tap = (e.target.closest('[data-action],[data-nav],[id]') || e.target).outerHTML.slice(0, 80); }, { capture: true, once: true }); true`);
  sh(`adb shell input tap ${p.x} ${p.y}`); await sleep(800);
  if (taps++ < 3) info('atingere pe ' + sel + ' la ' + JSON.stringify(r) + ' → ecran ' + JSON.stringify(p) + ', a ajuns la: ' + await page.ev('window.__tap'));
};
let taps = 0;
const swipe = (a, b, ms = 260) => sh(`adb shell input swipe ${a.x} ${a.y} ${b.x} ${b.y} ${ms}`);
const back = () => sh('adb shell input keyevent 4');
// A slow emulator can put a system window over the app ("… isn't responding", a crash notice from another app).
// Then the back key and the taps go to that window, not to the app. This finds one and closes it.
async function clearDialogs(){
  for (let i = 0; i < 4; i++){
    let focus = ''; try { focus = sh('adb shell dumpsys window').split('\n').filter(l => /mCurrentFocus/.test(l)).join(' ').trim(); } catch {}
    if (!focus || /com\.portia\.app/.test(focus)) return true;
    info('fereastră peste aplicație: ' + focus.slice(0, 160));
    try { sh('adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS'); } catch {}
    try {
      sh('adb shell uiautomator dump /sdcard/ui.xml');
      const m = sh('adb shell cat /sdcard/ui.xml').match(/text="(Wait|Așteaptă|OK|Close app|Închide aplicația)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
      if (m) sh(`adb shell input tap ${(+m[2] + +m[4]) >> 1} ${(+m[3] + +m[5]) >> 1}`);
      else if (i >= 2) start();
    } catch {}
    await sleep(1200);
  }
  return false;
}
const resumed = () => /com\.portia\.app/.test(sh('adb shell dumpsys activity activities').split('\n').filter(l => /mResumedActivity|topResumedActivity|ResumedActivity:/.test(l)).join('\n'));

(async () => {
  sh('adb wait-for-device');
  // a slow emulator can show "Pixel Launcher isn't responding" over everything; those dialogs are not the app's
  try { sh('adb shell settings put global hide_error_dialogs 1'); sh('adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS'); } catch {}
  console.log(sh(`adb install -r ${APK}`).trim());
  sh('adb logcat -c');
  start(); await sleep(9000);
  let page = await connect();
  await sleep(1500);
  shot('1-bun-venit');

  const nfo = await page.ev(`({ native: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform(), plugins: Object.keys(Capacitor.Plugins).sort(), mark: document.documentElement.getAttribute('data-native'), top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top').trim(), bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom').trim() })`);
  ok('rulează ca aplicație nativă Android', nfo.native && nfo.platform === 'android' && nfo.mark === 'android');
  info('aplicația: ' + JSON.stringify(nfo));
  for (const p of ['App', 'Clipboard', 'Filesystem', 'Haptics', 'Keyboard', 'Preferences', 'Share', 'SplashScreen', 'SystemBars', 'PortiaWindow', 'PortiaWidget']) ok('pluginul ' + p + ' e disponibil', nfo.plugins.includes(p));
  ok('primul ecran e bun venit', await page.ev(`!document.querySelector('#consentSheet').hidden`));
  ok('fără bifa pentru AI când nu există AI', await page.ev(`!document.querySelector('[data-consent="ai"]')`));
  await clearDialogs();
  back();
  let away = false;
  for (let i = 0; i < 6 && !away; i++){ await sleep(500); away = !resumed(); }
  ok('Înapoi pe bun venit ascunde aplicația', away);
  start(); await sleep(2500); await clearDialogs();

  // a journal with content, then a restart, as a returning user sees it
  const { data, consent } = seed();
  await page.ev(`localStorage.setItem('portia-consent', ${JSON.stringify(JSON.stringify(consent))}); localStorage.setItem('mt-local', ${JSON.stringify(JSON.stringify(data))}); location.reload(); true`);
  await sleep(4000);
  ok('jurnalul se încarcă', await page.ev(`!document.querySelector('#hero.is-empty') && document.querySelectorAll('#mealsToday .mt.has').length === 2`));
  shot('2-azi');
  await clearDialogs();
  let box = webviewBox(); if (!box){ await clearDialogs(); await sleep(1000); box = webviewBox(); }
  const iw = await page.ev('innerWidth'), ih = await page.ev('innerHeight');
  VIEW = box ? Object.assign(box, { k: box.w / iw }) : { x: 0, y: 0, k: await page.ev('devicePixelRatio') };
  info('web view pe ecran: ' + JSON.stringify(VIEW) + ', pagina ' + iw + '×' + ih);
  const mirrored = await page.ev(`new Promise(r => setTimeout(async () => { const v = await Capacitor.Plugins.Preferences.get({ key: 'mt-local' }); r(!!(v && v.value && JSON.parse(v.value).profile)); }, 900))`);
  ok('jurnalul are copie în memoria nativă', mirrored);
  ok('vibrațiile răspund', await page.ev(`Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).then(() => true, e => String(e))`) === true);

  // real touches through Android's input system. Each check starts from a known state,
  // so one failure doesn't leave the next checks tapping somewhere else.
  const screenNow = () => page.ev(`document.documentElement.dataset.screen`);
  const front = async () => { if (!resumed()){ start(); await sleep(2000); } await clearDialogs(); };
  const act = a => page.ev(`(() => { const b = document.createElement('button'); b.dataset.action = ${JSON.stringify(a)}; b.hidden = true; document.body.append(b); b.click(); b.remove(); return true; })()`);
  const nav = async name => {
    await front();
    await tap(page, `#tabbar [data-nav="${name}"]`);
    const okTap = await screenNow() === name;
    if (!okTap) await page.ev(`document.querySelector('#tabbar [data-nav="${name}"]').click(); true`), await sleep(500);
    return okTap;
  };

  await page.ev(`window.__ev = []; ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click'].forEach(t => document.addEventListener(t, e => { if (__ev.length < 80) __ev.push(t.replace('pointer', '') + ':' + (e.pointerType || '')); }, true)); true`);
  const hr = await page.ev(`(() => { const b = document.querySelector('#hero').getBoundingClientRect(); return { l: b.left, r: b.right, y: b.top + b.height * 0.45 }; })()`);
  swipe(toScreen(hr.l + 60, hr.y), toScreen(hr.r - 20, hr.y + 4)); await sleep(1000);
  info('evenimente la glisare: ' + await page.ev(`__ev.filter((x, i, a) => a.indexOf(x) === i).join(' ') + ' (' + __ev.length + ')'`));
  ok('glisarea spre dreapta deschide ziua de ieri', /^Ieri/.test(await page.ev(`document.querySelector('#hAzi').textContent`)), await page.ev(`document.querySelector('#hAzi').textContent`));
  shot('3-ieri');
  const vw = await page.ev(`({ w: innerWidth, sw: document.documentElement.scrollWidth, scale: visualViewport ? visualViewport.scale : 1 })`);
  ok('pagina nu se micșorează după glisare', vw.w === iw && vw.sw <= iw + 1 && Math.abs(vw.scale - 1) < 0.01, vw);
  ok('ziua nouă stă la locul ei după glisare', await page.ev(`[...document.querySelectorAll('#scr-azi .scr-head > div, #hero, #mealsToday, #water')].every(el => !el.style.transform && Math.abs(el.getBoundingClientRect().left - document.querySelector('.app').getBoundingClientRect().left - 16) < 40)`));
  if (await page.ev(`document.querySelector('#hAzi').textContent`) === 'Azi') await act('prev-day');
  await sleep(500);
  back(); await sleep(900);
  ok('Înapoi pe o zi trecută revine la azi', resumed() && await page.ev(`document.querySelector('#hAzi').textContent`) === 'Azi');

  ok('atingerea pe tabul Jurnal', await nav('jurnal'));
  shot('4-jurnal');
  await tap(page, '#meal-lunch .entry .e-main');
  ok('foaia de editare se deschide', await page.ev(`!document.querySelector('#editSheet').hidden`));
  if (await page.ev(`document.querySelector('#editSheet').hidden`)) await page.ev(`document.querySelector('#meal-lunch .entry .e-main').click(); true`), await sleep(600);
  shot('5-editare');
  back(); await sleep(800);
  ok('Înapoi închide foaia', resumed() && await page.ev(`document.querySelector('#editSheet').hidden`));
  await front();
  back(); await sleep(800);
  ok('Înapoi din Jurnal duce la Azi', resumed() && await screenNow() === 'azi');

  await front();
  ok('atingerea pe butonul Adaugă', await nav('add'));
  await tap(page, '#logger [data-tab="manual"]');
  await page.ev(`document.querySelector('#logger [data-tab="manual"]').click(); true`);
  await tap(page, '#mName');
  // the first keyboard on a cold emulator can take a few seconds to come up
  let kb = false;
  for (let i = 0; i < 10 && !kb; i++){ await sleep(500); kb = await page.ev(`document.documentElement.classList.contains('kb')`); }
  if (!kb){
    let ime = ''; try { ime = sh('adb shell dumpsys input_method').split('\n').filter(l => /mInputShown|mIsInputViewShown|isInputViewShown/.test(l)).join(' ').trim(); } catch {}
    info('fără tastatură: focus pe ' + await page.ev(`document.activeElement && (document.activeElement.id || document.activeElement.tagName)`) + '; ' + ime.slice(0, 160));
  }
  ok('tastatura ascunde bara de taburi', kb);
  shot('6-adauga-tastatura');
  await page.ev(`document.activeElement && document.activeElement.blur(); true`); await sleep(900);
  ok('fără tastatură, bara de taburi revine', !await page.ev(`document.documentElement.classList.contains('kb')`));
  await nav('progres'); await sleep(400); shot('7-progres');
  await nav('profil'); await sleep(400); shot('8-profil');
  ok('fără abonamente în aplicația din magazin', await page.ev(`!document.querySelector('.prow[data-sec="plan"]')`));

  await nav('azi');
  sh('adb shell cmd uimode night yes'); await sleep(3000);
  await front(); shot('9-azi-intunecat');
  const darkBg = await page.ev(`getComputedStyle(document.body).backgroundColor`);
  ok('modul întunecat al telefonului schimbă aplicația', /rgb\((\d+), (\d+), (\d+)\)/.test(darkBg) && darkBg.match(/\d+/g).slice(0, 3).every(n => +n < 60), darkBg);
  sh('adb shell cmd uimode night no'); await sleep(2000);

  // closing and reopening the app keeps everything
  await sleep(2500);
  sh(`adb shell am force-stop ${PKG}`); start(); await sleep(6000);
  page.close(); page = await connect(); await sleep(1500);
  ok('datele rămân după închiderea aplicației', await page.ev(`!document.querySelector('#hero.is-empty') && document.querySelectorAll('#mealsToday .mt.has').length === 2`));
  // iOS and Android can clear a web view's storage; the native copy brings the journal back
  // like the OS clearing it: empty the web view's storage, then open the app again from scratch
  await page.ev(`localStorage.clear(); true`); await sleep(300);
  sh(`adb shell am force-stop ${PKG}`); start(); await sleep(6000);
  page.close(); page = await connect(); await sleep(1500);
  const restored = `!!JSON.parse(localStorage.getItem('mt-local') || 'null') && !document.querySelector('#hero.is-empty')`;
  let back2 = false;
  for (let i = 0; i < 10 && !back2; i++){ try { back2 = await page.ev(restored); } catch {} if (!back2) await sleep(1000); }
  ok('jurnalul revine din memoria nativă', back2, back2 ? undefined : await page.ev(`({ keys: Object.keys(localStorage), hero: document.querySelector('#hero').className })`).catch(e => String(e)));

  // the home screen widgets: registered, fed by the app, drawn, and their links open the right screen
  const rcv = sh(`adb shell cmd package query-receivers --brief -a android.appwidget.action.APPWIDGET_UPDATE ${PKG}`);
  ok('widgeturile sunt înregistrate', ['DayWidgetSmall', 'DayWidgetMedium', 'ScanWidget'].every(n => rcv.includes(n)), rcv.trim());
  await sleep(1200);
  const snap = sh(`adb shell run-as ${PKG} cat shared_prefs/portia_widget.xml`);
  ok('aplicația trimite cifrele zilei către widget', /&quot;eaten&quot;:\d+/.test(snap) && /&quot;setup&quot;:true/.test(snap), snap.slice(0, 300));
  sh(`adb shell am start -W -a android.intent.action.VIEW -d portia://scan ${PKG}`); await sleep(2500);
  ok('portia://scan deschide scanarea codului de bare', await page.ev(`document.documentElement.dataset.screen === 'add' && !!document.querySelector('.scan') && document.querySelector('.scan').getBoundingClientRect().height > 0`));
  shot('10-link-scanare');
  sh(`adb shell am start -W -a android.intent.action.VIEW -d portia://azi ${PKG}`); await sleep(2000);
  ok('portia://azi deschide Azi', await screenNow() === 'azi');
  sh(`adb shell am start -W -n ${PKG}/.WidgetPreviewActivity`); await sleep(2500);
  shot('11-widgeturi');
  ok('widgeturile se desenează fără erori', !/FATAL EXCEPTION/.test(sh('adb logcat -d')));
  sh(`adb shell am start -W -n ${PKG}/.MainActivity`); await sleep(1500);

  const seen = page.seen.slice();
  page.close();
  const log = sh('adb logcat -d');
  writeFileSync(`${OUT}/logcat.txt`, log);
  // Capacitor's own native-to-page calls can run in the instant before the page exists (the safe-area values,
  // the first lifecycle event); they are not the app's code and Capacitor repeats them once the page is up
  const ours = l => !/favicon|Error injecting safe area CSS|reading 'triggerEvent'/.test(l);
  const jsErr = log.split('\n').filter(l => /Capacitor\/Console/.test(l) && /Uncaught|Error|error/.test(l) && ours(l));
  const seenOurs = seen.filter(ours);
  ok('nicio eroare JavaScript', !jsErr.length && !seenOurs.length, jsErr.slice(0, 5).concat(seenOurs.slice(0, 5)));
  ok('aplicația nu s-a oprit', !/FATAL EXCEPTION/.test(log));
  console.log('::notice::' + passed.length + ' verificări au trecut: ' + passed.join('; '));
  if (errors.length){ console.log('::error::' + errors.length + ' verificări au eșuat: ' + errors.join('; ')); process.exit(1); }
})().catch(e => { console.log('::error::' + e.message); try { writeFileSync(`${OUT}/logcat.txt`, sh('adb logcat -d')); } catch {} process.exit(1); });
