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

Pentru versiunea din App Store și Google Play, planul tehnic descrie serverul și AI-ul care înlocuiesc aceste funcții.
