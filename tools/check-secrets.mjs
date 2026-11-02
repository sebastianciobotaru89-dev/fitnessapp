#!/usr/bin/env node
// Stops API keys and other secrets from reaching the repository.
// Usage:
//   node tools/check-secrets.mjs            scans every tracked file
//   node tools/check-secrets.mjs --staged   scans what is about to be committed (pre-commit hook)
//   node tools/check-secrets.mjs --history  scans every commit ever made
// Exits with 1 and names the file and line when it finds something.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RULES = [
  ['OpenAI', /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/],
  ['Anthropic', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Stripe secret key', /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}/],
  ['Slack token', /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ['RevenueCat secret key', /\bsk_[A-Za-z0-9]{28,}/],
  ['Private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/]
];
// A JWT is a secret only if it carries the service role (Supabase's anon key is public by design).
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
function jwtIsSecret(payload){
  try { return /service_role/.test(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return false; }
}
const SKIP = /(^|\/)(tools\/check-secrets\.mjs)$/; // this file names the patterns, not real keys

function scanText(text, where, found, first = 1){
  text.split('\n').forEach((line, i) => {
    for (const [name, rx] of RULES) if (rx.test(line)) found.push(`${where}:${first + i}  ${name}`);
    for (const m of line.matchAll(JWT)) if (jwtIsSecret(m[1])) found.push(`${where}:${first + i}  Supabase service role key`);
  });
}
const sh = cmd => execSync(cmd, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const mode = process.argv[2] || '--all';
const found = [];

if (mode === '--history'){
  // every added line in every commit, so a key that was committed and later deleted is still caught
  let commit = '', file = '', n = 0;
  for (const line of sh('git log -p --all --unified=0 --no-color --format=commit:%h').split('\n')){
    if (line.startsWith('commit:')){ commit = line.slice(7); continue; }
    if (line.startsWith('+++ b/')){ file = line.slice(6); continue; }
    const h = line.match(/^@@ .*\+(\d+)/); if (h){ n = Number(h[1]); continue; }
    if (line.startsWith('+') && !line.startsWith('+++') && !SKIP.test(file)){ scanText(line.slice(1), `${commit} ${file}`, found, n); n++; }
  }
} else {
  const files = (mode === '--staged' ? sh('git diff --cached --name-only --diff-filter=ACMR') : sh('git ls-files')).split('\n').filter(Boolean);
  for (const f of files){
    if (SKIP.test(f)) continue;
    let text;
    try { text = mode === '--staged' ? sh(`git show ":${f.replace(/"/g, '\\"')}"`) : readFileSync(f, 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue; // binary
    scanText(text, f, found);
  }
}

if (found.length){
  console.error('Oprit: am găsit ceva ce arată ca o cheie secretă. Nu o pune în repository.\n');
  for (const f of found) console.error('  ' + f);
  console.error('\nCheile stau doar în secretele serverului (de exemplu Supabase → Edge Functions → Secrets), niciodată în cod.');
  console.error('Dacă o cheie a ajuns deja într-un commit, revoc-o la furnizor și creează alta.');
  process.exit(1);
}
console.log('Nicio cheie secretă găsită (' + mode.replace('--', '') + ').');
