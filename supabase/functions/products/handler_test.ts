// Tests for the product API. Run with Deno (CI): deno test supabase/functions/products/
// or with Node 22+: node --experimental-strip-types supabase/functions/products/handler_test.ts
import { handle, validCode, cleanName, checkContribution, netOf, type Rpc } from './handler.ts';

const D = (globalThis as any).Deno;
let failed = 0;
const test = (name: string, fn: () => Promise<void> | void) => D ? D.test(name, fn) : Promise.resolve().then(fn).then(() => console.log('PASS ' + name), e => { failed++; console.log('FAIL ' + name + ': ' + (e && e.message)); });
function ok(c: unknown, msg: string){ if (!c) throw new Error(msg); }

const PEPPER = 'x'.repeat(40);
const env = (o: Record<string, string> = {}) => (n: string) => ({ PORTIA_PEPPER: PEPPER, SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'k', ...o } as Record<string, string>)[n];
function fakeDb(limitOk = true){
  const calls: [string, Record<string, unknown>][] = [];
  const rpc: Rpc = async (fn, args) => {
    calls.push([fn, args]);
    if (fn === 'portia_hit') return limitOk;
    if (fn === 'portia_product_get') return args.p_code === '5901234123457' ? { status: 'verified', confirmations: 3, product: { code: '5901234123457', name: 'Iaurt', unit: 'g', per100: { kcal: 73, protein: 9.2, carbs: 4, fat: 2 } } } : { status: 'none' };
    if (fn === 'portia_product_contribute') return { status: 'pending', confirmations: 1 };
    if (fn === 'portia_forget') return { removed: 2 };
    throw new Error('unknown ' + fn);
  };
  return { calls, rpc };
}
const req = (method: string, path = '/', body?: unknown, headers: Record<string, string> = {}) =>
  new Request('http://fn' + path, { method, headers: { 'x-forwarded-for': '86.120.10.20, 10.0.0.1', ...headers }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
const good = { code: '5901234123457', name: 'Iaurt grecesc 2%', unit: 'g', per100: { kcal: 73, protein: 9.2, carbs: 4, fat: 2 }, serving: 150, pack: 400, install: 'a1b2c3d4-e5f6-4711-8899-aabbccddeeff' };

test('barcodes need the right check digit', () => {
  ok(validCode('5901234123457') && validCode('4006381333931') && validCode('96385074'), 'valid codes');
  ok(!validCode('5901234123458') && !validCode('123') && !validCode('59012341234a7'), 'invalid codes');
});
test('names are plain text without links', () => {
  ok(cleanName('  Iaurt <b>grecesc</b>  ') === 'Iaurt b grecesc /b', 'tags stripped: ' + cleanName('  Iaurt <b>grecesc</b>  '));
  ok(cleanName('vezi www.spam.ro') === null && cleanName('http://x') === null && cleanName('a') === null && cleanName(5) === null, 'links and junk refused');
});
test('impossible values are refused', () => {
  ok(checkContribution(good).ok, 'a good label passes');
  ok(!checkContribution({ ...good, per100: { kcal: 950, protein: 1, carbs: 1, fat: 1 } }).ok, 'over 900 kcal');
  ok(!checkContribution({ ...good, per100: { kcal: 400, protein: 50, carbs: 40, fat: 30 } }).ok, 'macros over 100 g');
  ok(!checkContribution({ ...good, per100: { kcal: '73', protein: 9, carbs: 4, fat: 2 } }).ok, 'numbers as text');
  ok(!checkContribution({ ...good, unit: 'kg' }).ok && !checkContribution({ ...good, install: 'short' }).ok && !checkContribution({ ...good, serving: 1.5 }).ok, 'unit, install and serving checked');
});
test('networks keep only the first part of the address', () => {
  ok(netOf('86.120.10.20') === '86.120.10' && netOf('2a02:2f0e:abcd:1:2:3:4:5') === '2a02:2f0e:abcd', 'v4 and v6');
});
test('CORS: the app origins are echoed, others get the site', async () => {
  const { rpc } = fakeDb();
  const a = await handle(req('OPTIONS', '/', undefined, { origin: 'capacitor://localhost' }), env(), rpc);
  ok(a.status === 204 && a.headers.get('access-control-allow-origin') === 'capacitor://localhost', 'capacitor allowed');
  const b = await handle(req('OPTIONS', '/', undefined, { origin: 'https://evil.example' }), env(), rpc);
  ok(b.headers.get('access-control-allow-origin') === 'https://sebastianciobotaru89-dev.github.io', 'other origins get the site');
});
test('without the pepper secret the API refuses to run', async () => {
  const { rpc, calls } = fakeDb();
  const r = await handle(req('GET', '/?code=5901234123457'), env({ PORTIA_PEPPER: '' }), rpc);
  ok(r.status === 503 && calls.length === 0, 'not configured, no database call');
});
test('lookup: bad code, found, unknown, rate limited', async () => {
  const { rpc } = fakeDb();
  ok((await handle(req('GET', '/?code=123'), env(), rpc)).status === 400, 'bad code');
  const f = await handle(req('GET', '/?code=5901234123457'), env(), rpc), j = await f.json();
  ok(f.status === 200 && j.status === 'verified' && j.product.name === 'Iaurt' && f.headers.get('cache-control')!.includes('max-age'), 'verified product');
  const n = await (await handle(req('GET', '/?code=4006381333931'), env(), rpc)).json();
  ok(n.status === 'none' && !n.product, 'unknown product');
  ok((await handle(req('GET', '/?code=5901234123457'), env(), fakeDb(false).rpc)).status === 429, 'rate limited');
});
test('contribution: only hashes reach the database', async () => {
  const { rpc, calls } = fakeDb();
  const r = await handle(req('POST', '/', good), env(), rpc), j = await r.json();
  ok(r.status === 200 && j.status === 'pending', 'accepted');
  const c = calls.find(x => x[0] === 'portia_product_contribute')!;
  ok(/^[0-9a-f]{64}$/.test(String(c[1].p_install_hash)) && /^[0-9a-f]{64}$/.test(String(c[1].p_net_hash)), 'hashed install and network');
  ok(!JSON.stringify(calls).includes(good.install) && !JSON.stringify(calls).includes('86.120.10'), 'no raw install id or address anywhere');
  ok(c[1].p_kcal === 73 && c[1].p_serving === 150 && c[1].p_name === 'Iaurt grecesc 2%', 'values passed on');
  const r2 = await handle(req('POST', '/', { ...good, install: 'zzzzzzzzzzzzzzzzzzzz' }), env(), rpc); await r2.text();
  const c2 = calls.filter(x => x[0] === 'portia_product_contribute')[1];
  ok(c2[1].p_install_hash !== c[1].p_install_hash && c2[1].p_net_hash === c[1].p_net_hash, 'two installs on one network share the network hash');
});
test('contribution: refused input never reaches the database', async () => {
  const { rpc, calls } = fakeDb();
  ok((await handle(req('POST', '/', '{not json'), env(), rpc)).status === 400, 'bad json');
  ok((await handle(req('POST', '/', { ...good, code: '5901234123458' }), env(), rpc)).status === 400, 'bad code');
  ok((await handle(req('POST', '/', 'x'.repeat(5000)), env(), rpc)).status === 413, 'too large');
  ok(!calls.some(x => x[0] === 'portia_product_contribute'), 'nothing written');
  ok((await handle(req('POST', '/', good), env(), fakeDb(false).rpc)).status === 429, 'rate limited');
});
test('withdraw: everything from one install, by its hash', async () => {
  const { rpc, calls } = fakeDb();
  const r = await handle(req('DELETE', '/', { install: good.install }), env(), rpc), j = await r.json();
  ok(r.status === 200 && j.removed === 2, 'removed');
  const f = calls.find(x => x[0] === 'portia_forget')!;
  ok(/^[0-9a-f]{64}$/.test(String(f[1].p_install_hash)), 'by hash');
  ok((await handle(req('DELETE', '/', { install: 'no' }), env(), rpc)).status === 400, 'bad install');
});
test('other methods are refused', async () => {
  ok((await handle(req('PUT', '/', good), env(), fakeDb().rpc)).status === 405, 'PUT');
});
if (!D) setTimeout(() => { console.log(failed ? failed + ' failed' : 'all passed'); if (failed) (globalThis as any).process.exit(1); }, 300);
