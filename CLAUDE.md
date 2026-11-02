# Porția: reguli pentru lucrul în acest repository

## Secrete
- Repository-ul e public, iar aplicația rulează în browserul vizitatorului. Orice cheie pusă în `index.html`, `css/` sau `js/` devine publică.
- Cheile API (OpenAI, Anthropic, Supabase service role, RevenueCat etc.) stau doar în secretele serverului, de exemplu Supabase → Edge Functions → Secrets. Niciodată în fișiere din repo, în commit-uri, în artifact sau în memorie.
- Dacă utilizatorul lipește o cheie în chat, nu o folosi și nu o scrie nicăieri. Spune-i să o revoce și să pună una nouă direct în secretele serverului.
- Înainte de fiecare commit și push rulează `node tools/check-secrets.mjs --all` și `node tools/check-secrets.mjs --history`. Hook-ul se pornește cu `git config core.hooksPath .githooks`.

## Structura
- `index.html` în rădăcină, `css/styles.css`, `js/app.js`. Fără build. GitHub Pages servește ramura `main`.
- Versiunea din Claude (artifact) e un singur fișier construit din aceste trei. Schimbările se fac aici, apoi se reconstruiește artifactul.
- În Claude, `window.claude` dă AI-ul (`sample`), baza de date (`db`) și utilizatorul (`user`). Pe GitHub Pages nu există, iar aplicația pornește în modul local.

## AI
- Orice număr venit de la AI trece prin verificările din `js/app.js` (`itemIssues`, `per100Issues`). Ce nu trece e marcat „verifică” și nu se salvează fără confirmarea utilizatorului.
- Nota și cifrele din raportul săptămânal le calculează aplicația (`weekStats`), nu modelul.
