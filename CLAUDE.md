# Porția: reguli pentru lucrul în acest repository

## Secrete
- Repository-ul e public, iar aplicația rulează în browserul vizitatorului. Orice cheie pusă în `index.html`, `css/` sau `js/` devine publică.
- Cheile API (OpenAI, Anthropic, Supabase service role, RevenueCat etc.) stau doar în secretele serverului, de exemplu Supabase → Edge Functions → Secrets. Niciodată în fișiere din repo, în commit-uri, în artifact sau în memorie.
- Dacă utilizatorul lipește o cheie în chat, nu o folosi și nu o scrie nicăieri. Spune-i să o revoce și să pună una nouă direct în secretele serverului.
- Înainte de fiecare commit și push rulează `node tools/check-secrets.mjs --all` și `node tools/check-secrets.mjs --history`. Hook-ul se pornește cu `git config core.hooksPath .githooks`.
- Semnarea pentru magazine (keystore-ul Android, cheia App Store Connect `.p8`, certificatele) stă doar în GitHub → Settings → Secrets and variables → Actions. Niciodată în repo: `.gitignore` le blochează, iar workflow-urile le scriu pe disc doar în timpul build-ului.

## Structura
- `index.html` în rădăcină, `css/styles.css`, `js/app.js`. Fără build. GitHub Pages se publică prin workflow-ul `.github/workflows/pages.yml` (Source: GitHub Actions), la fiecare push pe `main`.
- Interfața are cinci ecrane (`#scr-azi`, `#scr-jurnal`, `#scr-add`, `#scr-progres`, `#scr-profil`) și bara de taburi `#tabbar`; navigarea e funcția `go(name)` din `js/app.js`. Setările sunt ecranul Profil, nu o foaie.
- Versiunea din Claude (artifact) e un singur fișier construit din aceste trei cu `python3 tools/build-artifact.py . <fișier>.html`. Schimbările se fac aici, apoi se reconstruiește și se republică artifactul.
- În Claude, `window.claude` dă AI-ul (`sample`), baza de date (`db`) și utilizatorul (`user`). Pe GitHub Pages nu există, iar aplicația pornește în modul local.

## Aplicația nativă (iOS și Android, Capacitor)
- ID-ul aplicației e `com.portia.app` și nu se mai schimbă după publicare.
- Codul e același: `index.html`, `css/`, `js/`. `node tools/build-www.mjs` le copiază în `www/` (generat, ignorat de git), apoi `npx cap sync` le pune în `ios/` și `android/`.
- În `js/app.js`, `NATIVE` spune dacă rulează în aplicația din magazin. Pluginurile native se cheamă doar prin `nat(plugin, metodă, argumente)` și `natOn(...)`, care pe web nu fac nimic.
- `SELL` e fals în aplicația nativă: temele plătite și oferta nu apar până nu există plată prin App Store și Google Play (StoreKit / Play Billing). Fără butoane de plată care nu funcționează.
- Aplicația nativă nu descarcă cod de pe internet: biblioteca pentru coduri de bare e inclusă în `www/vendor/`.
- `npm` nu merge din sandbox. Dependențele noi se adaugă în `package.json`, apoi se rulează workflow-ul „Aplicația nativă – creare proiecte” (actualizează `package-lock.json`, `ios/`, `android/`). „Construire de test” construiește și deschide aplicația pe emulator și simulator la fiecare push.
- Iconița și ecranul de pornire se desenează din logo cu `python3 tools/make-native-assets.py` (în `assets/`).
- Politica de confidențialitate e `confidentialitate.html`, publicată pe Pages. Când aplicația începe să trimită date noi undeva, pagina se actualizează în același commit.

## AI
- Orice număr venit de la AI trece prin verificările din `js/app.js` (`itemIssues`, `per100Issues`). Ce nu trece e marcat „verifică” și nu se salvează fără confirmarea utilizatorului.
- Nota și cifrele din raportul săptămânal le calculează aplicația (`weekStats`), nu modelul.
