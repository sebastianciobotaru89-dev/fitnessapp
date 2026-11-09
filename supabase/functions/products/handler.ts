// Porția: the shared product database as a small HTTP API, with no dependencies.
//   GET    ?code=5941234567890   looks a barcode up
//   POST   {code, name, unit, per100, serving, pack, install}   adds what someone read on a label
//   DELETE {install}   withdraws everything that install sent
// The database is reached only through the SQL functions in supabase/migrations, with the service role key
// the platform hands every function. Nothing here trusts the app: every value is checked again.

export type Env = (name: string) => string | undefined;
export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<unknown>;

const ORIGINS = new Set(['https://sebastianciobotaru89-dev.github.io', 'capacitor://localhost', 'https://localhost', 'http://localhost']);
const LIMITS = { lookupsPerHour: 600, sendsPerHour: 60, sendsPerInstallPerDay: 100, forgetsPerHour: 10 };
const MAX_BODY = 4096;

// EAN-8, UPC-A, EAN-13 and GTIN-14, with the check digit
export function validCode(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const d = code.split('').map(Number), check = d.pop() as number;
  let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - sum % 10) % 10 === check;
}

// A product name: plain text, 2 to 80 characters, no links or addresses
export function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 80) return null;
  if (/https?:|www\.|\.(com|ro|net|org)\b|@/i.test(s)) return null;
  return s;
}

const numIn = (v: unknown, lo: number, hi: number): number | null => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
const optInt = (v: unknown, hi: number): number | null | undefined => v == null || v === '' ? null : (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= hi ? v : undefined);
const r1 = (v: number) => Math.round(v * 10) / 10;

export type Contribution = { code: string; name: string; unit: 'g' | 'ml'; kcal: number; protein: number; carbs: number; fat: number; serving: number | null; pack: number | null; install: string };

// The same hard checks as the app (per100Issues): impossible values are refused
export function checkContribution(b: any): { ok: true; value: Contribution } | { ok: false; error: string } {
  if (!b || typeof b !== 'object') return { ok: false, error: 'body' };
  const code = typeof b.code === 'string' ? b.code : '';
  if (!validCode(code)) return { ok: false, error: 'code' };
  const name = cleanName(b.name); if (!name) return { ok: false, error: 'name' };
  if (b.unit !== 'g' && b.unit !== 'ml') return { ok: false, error: 'unit' };
  const p = b.per100 || {};
  const kcal = numIn(p.kcal, 0, 900), protein = numIn(p.protein, 0, 100), carbs = numIn(p.carbs, 0, 100), fat = numIn(p.fat, 0, 100);
  if (kcal == null || protein == null || carbs == null || fat == null) return { ok: false, error: 'per100' };
  if (protein + carbs + fat > 102) return { ok: false, error: 'per100' };
  const serving = optInt(b.serving, 5000), pack = optInt(b.pack, 20000);
  if (serving === undefined || pack === undefined) return { ok: false, error: 'portion' };
  const install = typeof b.install === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(b.install) ? b.install : '';
  if (!install) return { ok: false, error: 'install' };
  return { ok: true, value: { code, name, unit: b.unit, kcal: r1(kcal), protein: r1(protein), carbs: r1(carbs), fat: r1(fat), serving, pack, install } };
}

export async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), x => x.toString(16).padStart(2, '0')).join('');
}

// The network someone is on: the first three parts of an IPv4 address, or the first three groups of an IPv6 one
export function netOf(ip: string): string {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (v4) return v4.slice(1, 4).join('.');
  if (ip.includes(':')) return ip.toLowerCase().split(':').slice(0, 3).join(':');
  return ip || 'unknown';
}

export function makeRpc(url: string, key: string): Rpc {
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (!key.startsWith('sb_')) headers.Authorization = 'Bearer ' + key;
  return async (fn, args) => {
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: JSON.stringify(args) });
    if (!r.ok) throw new Error('rpc ' + fn + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
  };
}

export async function handle(req: Request, env: Env, rpc?: Rpc): Promise<Response> {
  const origin = req.headers.get('origin') || '';
  const base: Record<string, string> = {
    'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://sebastianciobotaru89-dev.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff'
  };
  const json = (status: number, body: unknown, cache = 'no-store') =>
    new Response(JSON.stringify(body), { status, headers: { ...base, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: base });

  const pepper = env('PORTIA_PEPPER') || '';
  if (pepper.length < 32) return json(503, { error: 'not_configured' });
  const call = rpc || makeRpc(env('SUPABASE_URL') || '', env('SUPABASE_SERVICE_ROLE_KEY') || '');
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const hour = new Date().toISOString().slice(0, 13);
  const ipKey = await sha256(pepper + '|ip|' + hour + '|' + ip);   // changes every hour: only for the rate limits
  const allow = async (bucket: string, limit: number, seconds: number) => (await call('portia_hit', { p_bucket: bucket, p_limit: limit, p_seconds: seconds })) === true;

  try {
    if (req.method === 'GET'){
      const code = new URL(req.url).searchParams.get('code') || '';
      if (!validCode(code)) return json(400, { error: 'code' });
      if (!(await allow('g:' + ipKey, LIMITS.lookupsPerHour, 3600))) return json(429, { error: 'slow_down' });
      const r = await call('portia_product_get', { p_code: code }) as any;
      const status = r && (r.status === 'verified' || r.status === 'pending') ? r.status : 'none';
      return json(200, status === 'none' ? { status } : { status, confirmations: r.confirmations, product: r.product }, status === 'verified' ? 'public, max-age=600' : 'no-store');
    }
    if (req.method === 'POST' || req.method === 'DELETE'){
      const text = await req.text();
      if (text.length > MAX_BODY) return json(413, { error: 'too_large' });
      let body: any = null;
      try { body = JSON.parse(text); } catch (_e) { return json(400, { error: 'body' }); }
      if (req.method === 'DELETE'){
        const install = body && typeof body.install === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(body.install) ? body.install : '';
        if (!install) return json(400, { error: 'install' });
        if (!(await allow('f:' + ipKey, LIMITS.forgetsPerHour, 3600))) return json(429, { error: 'slow_down' });
        const r = await call('portia_forget', { p_install_hash: await sha256(pepper + '|install|' + install) });
        return json(200, r);
      }
      const c = checkContribution(body);
      if (!c.ok) return json(400, { error: c.error });
      const v = c.value, installHash = await sha256(pepper + '|install|' + v.install);
      if (!(await allow('p:' + ipKey, LIMITS.sendsPerHour, 3600)) || !(await allow('i:' + installHash, LIMITS.sendsPerInstallPerDay, 86400))) return json(429, { error: 'slow_down' });
      const r = await call('portia_product_contribute', {
        p_code: v.code, p_install_hash: installHash, p_net_hash: await sha256(pepper + '|net|' + netOf(ip)),
        p_name: v.name, p_unit: v.unit, p_kcal: v.kcal, p_protein: v.protein, p_carbs: v.carbs, p_fat: v.fat, p_serving: v.serving, p_pack: v.pack
      });
      return json(200, r);
    }
    return json(405, { error: 'method' });
  } catch (e) {
    console.error(String(e));
    return json(500, { error: 'server' });
  }
}
