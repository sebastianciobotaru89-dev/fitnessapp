# Porția

Aplicație de calorii și macronutrienți, în română. Calculează ținta zilnică după un interviu scurt și ține jurnalul de mese, apa, greutatea, seriile și postul intermitent. Are teme de culori, inclusiv Gheață, Bujor și Futurist.

## Structura

```
index.html      pagina aplicației (trebuie să stea în rădăcină pentru GitHub Pages)
css/styles.css  stilurile și temele
js/app.js       logica aplicației
.nojekyll       spune GitHub Pages să servească fișierele exact cum sunt
```

Nu are pas de build și nici dependențe. Ce e în repository e exact ce se publică.

## Cum o pornești pe calculator

Din folderul proiectului:

```
python3 -m http.server 8000
```

Apoi deschizi http://localhost:8000.

## Cum o publici pe GitHub Pages

1. În repository: **Settings → Pages**.
2. La **Source** alegi **Deploy from a branch**.
3. Alegi branch-ul **main** și folderul **/ (root)**, apoi **Save**.

După un minut, aplicația apare la `https://<utilizator>.github.io/fitnessapp/`. Fiecare push pe `main` o actualizează automat.

## Cum salvezi o schimbare

```
git add .
git commit -m "Ce ai schimbat"
git push
```

## Ce merge pe GitHub Pages și ce nu

Aplicația pornește în **modul local** când nu rulează în Claude:

- Datele se salvează în browser, doar pe dispozitivul respectiv. Mutarea pe alt telefon se face cu codul de rezervă din Setări.
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
