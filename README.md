# Porția

Aplicație de calorii și macronutrienți, în română. Calculează ținta zilnică după un interviu scurt, face planul până la greutatea dorită și arată în Progres, cu un ac de aliniere, dacă ești înainte sau în urma planului. Ține jurnalul de mese, apa, greutatea, seriile și fastingul intermitent. Are teme de culori, inclusiv Gheață, Bujor și Futurist.

## Structura

```
index.html            pagina aplicației (trebuie să stea în rădăcină pentru GitHub Pages)
css/styles.css        stilurile și temele
js/app.js             logica aplicației
manifest.webmanifest  numele, culorile și iconițele pentru instalarea pe telefon
icons/                iconițele aplicației
fonts/                Archivo, Instrument Sans și Chakra Petch, incluse în aplicație (licență SIL OFL)
tools/                verificarea de secrete și construirea versiunii pentru Claude
.nojekyll             spune GitHub Pages să servească fișierele exact cum sunt
```

Versiunea web nu are pas de build: ce e în repository e exact ce se publică pe GitHub Pages. Aplicația pentru telefoane și tablete folosește aceleași fișiere, împachetate cu Capacitor (vezi mai jos).

## Cum o pornești pe calculator

Din folderul proiectului:

```
python3 -m http.server 8000
```

Apoi deschizi http://localhost:8000.

## Cum o publici pe GitHub Pages

1. În repository: **Settings → Pages**.
2. La **Source** alegi **GitHub Actions**.

Workflow-ul „Publicare pe GitHub Pages” publică aplicația la fiecare push pe `main`, după ce verifică să nu existe chei în fișiere. Publică doar fișierele aplicației, nu și uneltele. Îl poți porni și manual, din **Actions → Publicare pe GitHub Pages → Run workflow**. Aplicația apare la `https://<utilizator>.github.io/fitnessapp/`.

## Instalează pe telefon

Pe iPhone, deschide adresa aplicației în Safari, apasă **Partajează → Adaugă pe ecranul principal**. Porția apare cu iconița ei și se deschide pe tot ecranul, fără barele browserului. Pe Android, în Chrome, alegi **Instalează aplicația** din meniu.

## Aplicația pentru iPhone, iPad și Android

Aceleași fișiere devin aplicație nativă cu [Capacitor](https://capacitorjs.com). ID-ul aplicației e `com.portia.app`.

```
package.json            Capacitor și pluginurile native
capacitor.config.json   numele, culorile, ecranul de pornire, bara de stare
assets/                 sursa iconiței și a ecranului de pornire
android/  ios/          proiectele native, create de workflow
tools/build-www.mjs     adună fișierele aplicației în www/
```

În aplicația nativă: widgeturi pentru ecranul principal și ecranul blocat (caloriile rămase, macronutrienții și un buton care deschide scanarea codului de bare), vibrații la acțiuni, bara de stare care urmează tema, butonul Înapoi pe Android, tastatura care ascunde bara de taburi, partajare pentru fișierul .csv, o copie a jurnalului în memoria nativă a telefonului și două coloane pe tabletă. Temele plătite și oferta apar abia când plata prin App Store și Google Play e gata.

Workflow-uri:

- **Aplicația nativă – creare proiecte iOS și Android** (manual): creează sau actualizează `ios/` și `android/`, iconițele și `package-lock.json`. Rulează-l după ce schimbi `package.json`.
- **Aplicația nativă – construire de test** (la fiecare push): construiește APK-ul de test și versiunea pentru simulatorul iOS, apoi deschide aplicația pe un telefon Android emulat, pe un iPhone și pe un iPad simulat, face capturi și verifică să nu apară erori. APK-ul se descarcă din pagina rulării, la **Artifacts**, iar capturile apar și pe ramura `capturi`.
- **Aplicația nativă – versiune pentru magazine** (manual): `.aab` semnat pentru Google Play și build semnat trimis în TestFlight. Folosește doar cheile din Settings → Secrets and variables → Actions.

Widgeturile stau în `ios/App/PortiaWidget/` (SwiftUI) și în `android/app/src/main/java/com/portia/app/` (`PortiaWidgets.java`, cu machetele din `res/layout/widget_*.xml`). Aplicația le trimite cifrele zilei prin pluginul `PortiaWidget`, iar ele deschid aplicația cu `portia://azi` sau `portia://scan`. Ținta widgetului iOS se adaugă în proiectul Xcode cu `python3 tools/add-ios-widget.py`, care nu face nimic dacă e deja acolo. La fiecare construire de test, widgeturile se desenează și apar în capturi (`ios-widgeturi-*.png`, `android-11-widgeturi.png`).

Pentru fișele din magazine, `assets/store/` are capturile la dimensiunile cerute, iconița pentru Google Play și grafica de 1024 × 500. Le refaci cu `python3 tools/make-store-screens.py` și `python3 tools/make-store-graphics.py`.

Pe calculator (pentru Android ai nevoie de Android Studio, pentru iOS de un Mac cu Xcode):

```
npm install
npm run android     # sau: npm run ios
```

## Cum salvezi o schimbare

```
git add .
git commit -m "Ce ai schimbat"
git push
```

## Ce merge pe GitHub Pages și ce nu

Aplicația pornește în **modul local** când nu rulează în Claude:

- Datele se salvează în browser, doar pe dispozitivul respectiv. Mutarea pe alt telefon se face cu codul de rezervă din Profil.
- Funcțiile cu Claude nu sunt disponibile: estimarea din text și poze, citirea etichetelor, ideile de mese și raportul săptămânal. Rămâne adăugarea manuală, codul de bare și biblioteca.
- Sincronizarea în cloud nu e disponibilă.
- Dictarea vocală merge în Safari și Chrome. În Claude, pagina de obicei nu primește microfonul, așa că acolo rămâne microfonul de pe tastatură.
- Codurile de bare care nu sunt în lista ta se caută în [Open Food Facts](https://world.openfoodfacts.org), o bază de date deschisă. În Claude, pagina nu are acces la internet, deci căutarea nu rulează acolo.

Pentru versiunea din App Store și Google Play, planul tehnic descrie serverul și AI-ul care înlocuiesc aceste funcții.

## Liste de coduri de bare

Din **Rețete și favorite → Produse cu cod de bare** poți importa sau exporta o listă. Un produs pe rând, cu valorile la 100 g sau 100 ml:

```
cod;nume;kcal;proteine;glucide;grasimi;unitate;portie;pachet
5941234567890;Iaurt grecesc 2%;73;9,2;4;2;g;150;400
```

Primele trei coloane sunt obligatorii. Separatorul poate fi `;`, virgulă sau tab, iar o listă salvată din Excel ca CSV merge direct. Un cod care există deja se actualizează. Biblioteca ține până la 600 de produse.

## Baza comună de produse (serverul)

Codurile de bare completate de pe etichetă pot fi trimise, la alegerea fiecăruia, într-o bază comună. Un produs devine „confirmat” când oameni de pe cel puțin două rețele diferite au trimis valori care se potrivesc (calorii la ±5%, macronutrienți la ±10%), iar valorile sunt mediana lor. Căutarea unui cod întreabă întâi baza comună și Open Food Facts; un produs confirmat are prioritate, unul neconfirmat apare cu avertisment.

- `supabase/migrations/` – tabelele și funcțiile SQL. Tabelele nu pot fi citite cu cheile publice (row level security fără politici); doar funcția serverului ajunge la ele.
- `supabase/functions/products/` – API-ul (`GET ?code=`, `POST`, `DELETE`), fără dependențe. Verifică din nou fiecare valoare, limitează cererile și păstrează doar amprente (hash cu cheie secretă) ale dispozitivului și rețelei.
- `supabase/tests/` și `handler_test.ts` – testele, rulate de workflow-ul „Server – teste și publicare” pe un Postgres real și cu Deno, la fiecare schimbare.
- Valorile venite din Open Food Facts nu se trimit niciodată în baza comună (licența lor, ODbL, cere ca datele derivate să rămână deschise).

Cum îl pornești, o singură dată:

1. Pe [supabase.com](https://supabase.com) creează un proiect în regiunea **Frankfurt (eu-central-1)**: politica de confidențialitate spune că datele stau în Uniunea Europeană. Notează parola bazei de date.
2. Creează un token din supabase.com/dashboard/account/tokens.
3. În GitHub → Settings → Secrets and variables → Actions adaugă `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (id-ul proiectului, partea `xxxx` din `xxxx.supabase.co`), `SUPABASE_DB_PASSWORD` și `PORTIA_PEPPER` (un șir aleator de cel puțin 32 de caractere, de exemplu din `openssl rand -hex 32`).
4. Rulează workflow-ul „Server – teste și publicare” din Actions. Publică baza, secretul și funcția, apoi verifică răspunsul.
5. În `js/app.js` se completează `PRODUCTS_API` cu `https://xxxx.supabase.co/functions/v1/products`. Adresa nu e secretă; până atunci aplicația nu contactează serverul.

Niciuna dintre aceste chei nu se pune în cod, în chat sau în commit-uri.

## Securitate

- **Nicio cheie API în acest repository.** Aplicația rulează în browser, deci tot ce e în `index.html`, `css/` și `js/` poate fi citit de oricine. Cheile (de exemplu cea pentru OpenAI) stau doar pe server, în secretele funcției care vorbește cu AI-ul.
- **Verificare înainte de commit.** `tools/check-secrets.mjs` caută chei în fișiere și în tot istoricul. Pornește verificarea automată la fiecare commit cu:

  ```
  git config core.hooksPath .githooks
  ```

- **Verificare pe GitHub.** La fiecare push, workflow-ul „Verificare secrete” scanează din nou fișierele și istoricul.
- **Dacă o cheie scapă totuși**, șterge-o din cod nu e de ajuns, pentru că rămâne în istoric. Revoc-o imediat la furnizor și creează alta.

## Verificările pentru răspunsurile AI

Modelele de limbaj pot da cifre greșite. Aplicația verifică fiecare estimare înainte s-o arate:

- caloriile trebuie să se potrivească cu proteinele, glucidele și grăsimile (4, 4 și 9 kcal pe gram);
- un aliment nu poate avea mai mult de 9 kcal pe gram, iar macronutrienții nu pot trece de gramaj;
- pe etichete, la 100 g: cel mult 900 kcal, macronutrienții cel mult 100 g, iar kcal și kJ trebuie să se potrivească;
- porțiile și mesele neobișnuit de mari sunt semnalate.

Ce nu trece verificările e marcat „verifică”, cu motivul. Nimic nu intră în jurnal fără confirmarea ta. Nota și cifrele din raportul săptămânal sunt calculate de aplicație, iar AI-ul scrie doar textul.
