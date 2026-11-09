# Porția: analiza 0→1 în gym tech, wellness și nutriție

*9 noiembrie 2026. Cadrul e cel din „Zero to One” al lui Peter Thiel, aplicat pe codul Porția de azi.*

> Nu sunt Peter Thiel și nu îi pun cuvinte în gură. Am folosit cadrul lui: secretul, monopolul care începe mic, cele șapte întrebări, distribuția și durabilitatea. Cifrele din piață au sursele la final. Estimările mele sunt marcate ca estimări.

---

## Verdictul pe scurt

1. **Porția de azi e un 1→n foarte bine făcut, nu un 0→1.** E o aplicație de calorii excelentă, în română, într-o categorie în care se bat deja MyFitnessPal (care a cumpărat Cal AI), Yazio, Lifesum, FatSecret și MacroFactor. Ca aplicație de calorii nu devine unicorn. Ca produs poate deveni o afacere bună și o țintă de achiziție.
2. **În cod există deja patru semințe de 0→1** pe care competitorii nu le au împreună: ținta inteligentă care învață cât arde omul de fapt, cu istoricul țintelor, baza comună de produse cu amprente anonime, „De ce mănânci” plus somnul, și un AI care își spune nesiguranța. La ele se adaugă zilele de sală, care pot face legătura cu sala.
3. **Secretul pe care aș paria:** în era GLP-1 și a AI-ului, *numărul de calorii* devine gratuit. Valoarea se mută în **păstrarea rezultatului** (greutatea și mușchii) și în **oamenii de încredere**, adică antrenorii și nutriționiștii care îl obțin. Nimeni nu deține „anul de după dietă” sau „anul de după medicament”.
4. **Înainte de orice aplicație nouă, diferențiază Porția** (secțiunea 8): devine aplicația care te ajută să **slăbești o singură dată**. Asta înseamnă plan care trece în mentenanță, mușchi întâi, modurile „Pe medicație” și „După medicație” și legătura cu antrenorul.
5. **Nu construi altă aplicație acum** (secțiunea 9). Toate oportunitățile serioase pornesc de la același motor, aceleași date și același utilizator. Singurul lucru „în paralel” e un **panou web Porția Pro** pentru antrenori și nutriționiști: aceeași platformă, alt cumpărător. O aplicație separată are sens doar pentru o direcție medicală reglementată (prediabet, senzori de glicemie), și nu acum.
6. **Cea mai mare tensiune strategică e în arhitectură.** Azi nu ajunge nimic din jurnal pe server. Asta e corect pentru încredere, dar fără un acord opt-in pentru date agregate nu se poate construi niciun avantaj din date (data moat). Soluția e un consimțământ separat și explicit, „Contribui la cercetare”.
7. **La 90 de zile după lansarea în magazine ai porți de decizie** (secțiunea 10). Semnalele de la antrenori și de la utilizatorii ajunși în mentenanță decid pe ce cerc mergi mai departe.

---

## 1. Întrebarea contrariană

Thiel întreabă: ce adevăr important crezi tu și cred foarte puțini alții?

Răspunsul meu pentru piața asta:

> **Caloriile vor valora zero. Banii se vor face din trei lucruri: să știi ce funcționează pentru un anumit om, să păstrezi rezultatul după ce se termină dieta sau medicamentul și să fii plătit pentru rezultat, nu pentru acces.**

Aproape toată industria vinde altceva:

- aplicațiile vând **logare**: mai rapidă, din poze;
- sălile vând **acces**: abonament și turnichet;
- beneficiile corporate vând **acces**: card de sport, abonament medical;
- aplicațiile pentru GLP-1 vând **un calendar de injecții**.

Toate vând intrarea. Aproape nimeni nu e plătit pentru ieșire: kilogramele care rămân jos, mușchii care rămân, clientul care rămâne la sală.

---

## 2. Porția, privită la rece

### Ce există deja (din cod, nu din pitch)

| Zonă | Ce face Porția azi | Unde în cod |
|---|---|---|
| Ținte | Interviu → necesar caloric, patru obiective (slăbire, recompoziție, menținere, masă) | `computeTargets`, `GOALS` |
| Ținta inteligentă | Calculează cât arzi de fapt din mese și trendul greutății, urmează planul, pas de cel mult 250 kcal | `adaptInfo`, `planTarget` |
| Istoric | Fiecare zi trecută e judecată după ținta pe care o avea atunci | `keepTargetHistory`, `targetsFor` |
| Plan | Ritm sigur (cel mult 1% pe săptămână), IMC minim 18,5, acul de aliniere | `planRate`, `planState`, `planCheck` |
| AI | Poze și text → alimente, cu „sigur: mare / medie / mică”, o întrebare care schimbă cel mai mult caloriile, verificări care resping valorile imposibile | `buildPrompt`, `itemIssues`, `microClean` |
| Date locale | Cod de bare, Open Food Facts, bază comună de produse pe Supabase, cu amprente anonime | `supabase/`, `shareProduct` |
| Comportament | Motivul fiecărei mese (foame, stres, plictiseală, social), somnul, tipare după 14 zile | `whyStats` |
| Sală | Zile de sală și de pauză, cu glucide diferite | `targetsFor`, `cycleSection` |
| Restul | Micronutrienți, fasting, apă, serii, provocări, rețete, raport săptămânal, widgeturi, iOS și Android | |
| Bani | Plus 19,99, Premium 29,99, Ultra 49,99 lei pe lună, în mare parte construite pe teme | `TIERS` |

E mult pentru o săptămână de construcție: primul commit e din 2 noiembrie 2026. Dar aplicația nu e încă în magazine (`SELL` e fals în aplicația nativă) și nu adună nicio dată la nivel de populație. **Niciun avantaj din date nu există încă. Există doar arhitectura pentru el.**

### Cele șapte întrebări ale lui Thiel

| Întrebarea | Porția azi | Porția cu direcția propusă |
|---|---|---|
| **Inginerie**: e de 10 ori mai bună? | Nu. E la paritate sau puțin peste (română, țintă adaptivă, AI onest), dar nu de 10 ori. | Pe o nișă, da: singura care leagă mentenanța, mușchiul și antrenorul, pe date locale. |
| **Momentul**: de ce acum? | Neutru. Aplicațiile de calorii există de 15 ani. | Bun: GLP-1 la scară mare, rambursări începute în UE (Franța, iunie 2026), AI care face logarea aproape gratuită. |
| **Monopol**: cotă mare dintr-o piață mică? | Nu. Cotă mică dintr-o piață mare și aglomerată. | Posibil: antrenorii și nutriționiștii din România care lucrează cu nutriția clienților. |
| **Oameni**: e echipa potrivită? | Un fondator care construiește repede. Lipsesc vânzările B2B și o voce medicală. | La fel. Ai nevoie de un cofondator sau partener cu rețea în săli și în nutriție. |
| **Distribuție** | Slabă: magazine și reclame, contra bugetelor MyFitnessPal. | Mai bună: fiecare antrenor aduce 10–50 de clienți fără cost de achiziție. |
| **Durabilitate**: rezistă 10–20 de ani? | Mică. Funcțiile se copiază. | Medie spre mare: datele de rezultat și rețeaua de antrenori nu se copiază. |
| **Secret** | Nu încă. | Da: „anul de după” și reputația măsurată a antrenorilor (secțiunea 3). |

### Lecția Cal AI

Cal AI, construită de adolescenți, a ajuns la peste 15 milioane de descărcări și peste 30 de milioane de dolari venit anual în mai puțin de doi ani. Pe 2 martie 2026, MyFitnessPal a anunțat că a cumpărat-o. Din asta rezultă două concluzii:

- **Logarea din poze e o funcție, nu o companie.** Oricine o poate construi cu un API de AI. Porția însăși o are.
- **Distribuția a fost produsul.** Cal AI a câștigat prin marketing pe rețelele sociale, nu prin tehnologie. Cumpărătorul a fost liderul categoriei, care a plătit pentru utilizatori. Asta e și ieșirea realistă pentru o aplicație de calorii bună: o achiziție, nu o categorie nouă.

---

## 3. Secretele: ce nu vede piața

Pentru Thiel, orice companie mare are în spate un secret: ceva adevărat și important pe care ceilalți încă îl ignoră. Iată șase, de la cel mai puternic la cel mai lent.

### Secretul 1: Mentenanța e noua slăbire

**Ce crede piața:** problema e să slăbești. Aplicațiile se termină când atingi ținta, iar cele pentru GLP-1 construiesc calendare de injecții.

**Ce e adevărat:** problema e să *rămâi* la greutatea dorită, cu mușchii tăi.

- Cam jumătate dintre cei care încep un tratament GLP-1 îl opresc în primul an, iar trei sferturi îl opresc în doi ani. O meta-analiză din 2026 (Cambridge, eClinicalMedicine) arată că, după oprire, oamenii recâștigă în medie cam 60% din greutate într-un an. Datele din practică variază: o cohortă Cleveland Clinic arată mult mai puțin, pentru că mulți reiau sau schimbă tratamentul. Direcția e însă aceeași: perioada de după tratament e o problemă nerezolvată.
- O parte importantă din greutatea pierdută pe GLP-1 e masă slabă. Studiile dau valori între un sfert și peste o treime din total.
- Aplicațiile care însoțesc tratamentul GLP-1 se înmulțesc: Shotsy, MyNetDiary GLP-1 Companion (din mai 2026) și zeci de aplicații mici. Toate fac același lucru evident: doze, efecte, proteine. **Nimeni nu deține trecerea de la medicament la autoreglare.**

**De ce e ascuns:** toată lumea măsoară „kg pierdute”. Mentenanța nu are un moment spectaculos și nici o poză „înainte și după”. Totuși, acolo se pierde valoarea pentru toată lumea: pacient, medic și cine plătește.

**Ce înseamnă pentru Porția:** azi, când atingi ținta, Porția îți spune să refaci interviul și să alegi Menținere (`renderPlan`, zona `done` din `planState`). Exact acolo e golul. Porția are deja motorul: cât arzi de fapt, ritmul sigur și acul de aliniere. Îi lipsește a doua fază a planului.

### Secretul 2: Caloriile devin gratuite, dar nesiguranța lor are valoare

**Ce crede piața:** câștigă cine estimează caloriile din poză cel mai repede.

**Ce e adevărat:** estimarea devine gratuită pentru toată lumea. Rămâne rară **marja de eroare**: cât greșește estimarea pentru *ciorba asta*, *sarmalele astea*, *porția asta* și cât de repede se corectează. Porția e una dintre puținele aplicații care își recunoaște nesiguranța: pune „sigur: mică” la mâncarea gătită și pune o singură întrebare, cea care schimbă cel mai mult cifra.

**De ce e ascuns:** marketingul vinde „precizie”, deci nimeni nu vrea să-și arate eroarea. Însă cine slăbește mai încet decât arată aplicația renunță fără să știe de ce.

**Ce înseamnă:** onestitatea îți aduce încredere, mai ales împreună cu ținta inteligentă, care corectează automat eroarea sistematică după greutatea reală. Nu concura pe „AI mai bun la poze”. Concurează pe „aplicația care nu te minte și se corectează singură”.

### Secretul 3: În Europa de Est oamenii au încredere în oameni, iar AI-ul câștigător va învăța din deciziile lor

**Ce crede piața:** antrenorul AI îl va înlocui pe cel uman.

**Ce e adevărat:** în România oamenii urmează antrenorul de la sală, nutriționistul sau un antrenor online de pe Instagram, nu o aplicație. Acești oameni lucrează azi cu WhatsApp, PDF-uri și Google Sheets. Uneltele profesionale existente (Trainerize, Everfit, TrueCoach) sunt construite mai ales pentru piața anglofonă, au prețuri în dolari și sunt centrate pe antrenament. Nutriția vine adesea dintr-o legătură cu MyFitnessPal.

Secretul e un pas mai departe: **cine deține locul în care antrenorul ia decizii deține datele din care se va antrena antrenorul AI.** Fiecare decizie („scad 150 kcal”, „cresc proteinele”, „o săptămână de pauză de la dietă”), pusă lângă starea clientului și rezultatul ei, e un exemplu etichetat de un expert. Nimeni nu are asemenea date în română, pe mâncare românească.

Un al treilea strat poate fi cel mai valoros: **reputația măsurată.** Azi, un antrenor e ales după poze și urmăritori. O platformă care vede rezultatele reale ale clienților, cu acordul lor, poate spune: „82% dintre clienții lui au rămas în zona de mentenanță după 6 luni”. Nicăieri nu există date verificate despre cât de bun e un antrenor.

### Secretul 4: Sala vinde acces, dar rezultatele se fac în bucătărie

**Ce crede piața:** tehnologia pentru săli înseamnă software de rezervări, turnichete și aparate conectate. În zona asta EGYM a devenit unicorn în 2024.

**Ce e adevărat:** membrul pleacă de la sală când nu vede rezultate. Rezultatele depind în mare parte de mâncare și de somn, adică de cele 23 de ore în care sala nu e de față și despre care nu are niciun semnal. Zilele de sală din Porția sunt o legătură mică spre ceva mare: **stratul de rezultate al sălii**.

O ipoteză de testat (nu un fapt): oamenii încep să noteze mai rar ce mănâncă *înainte* să vină mai rar la sală, deci logarea meselor e un semnal timpuriu de abandon. Dacă e adevărat, sala are un motiv financiar direct să plătească.

### Secretul 5: Deșertul de date alimentare din Europa de Est

**Ce crede piața:** bazele de date cu alimente sunt o problemă rezolvată, pentru că MyFitnessPal are zeci de milioane de intrări.

**Ce e adevărat:** produsele ambalate sunt ușoare, pentru că în UE eticheta nutrițională e obligatorie și Porția o citește deja. Deșertul e în **mâncarea gătită acasă și în porțiile reale**: ciorbă cu smântână, sarmale, mici, mămăligă, cozonac, mâncarea de la cantină sau de la livrare. Acolo bazele globale au intrări greșite introduse de utilizatori, iar AI-ul ghicește.

**Ce înseamnă:** baza comună Porția, cu amprente și verificări, e începutul unei infrastructuri. Pasul următor e **cântărirea de calibrare**: utilizatorul își cântărește o dată farfuria de ciorbă. Din asta ies porțiile reale din România și estimări din poze mai bune decât ale oricui pe mâncarea locală.

### Secretul 6: În România prevenția o plătește angajatorul, și plătește pe nevăzute

**Ce crede piața:** prevenția o plătesc statul sau asigurătorii.

**Ce e adevărat:** în România prevenția o plătește angajatorul, prin carduri de sport și abonamente medicale private. 7card a fost cumpărat de Sodexo în 2019, iar ESX a raportat în presă în jur de 200.000 de membri. Angajatorul plătește pentru *acces* și măsoară *utilizarea*, nu sănătatea. Nimeni nu îi poate arăta un rezultat.

Context: cam 1 din 11 adulți din România are diabet (IDF, 2024). Estimările pentru obezitate variază mult după metodă, de la circa 13% (Eurostat, pe baza declarațiilor) la peste 20%. Costul e real și există cine să plătească. Lipsește măsurarea.

E cel mai lent secret, pentru că vânzările B2B durează mult. E însă al doilea etaj firesc, după ce ai date de rezultat.

---

## 4. Harta oportunităților

| # | Oportunitate | Nevoia nesatisfăcută | Soluția | Cine plătește |
|---|---|---|---|---|
| O1 | **Mentenanță și mușchi** | Kilogramele revin după dietă sau GLP-1; se pierde mușchi | Plan în două faze (slăbire → mentenanță), mușchi întâi, „Pe medicație” și „După medicație” | Utilizatorul (abonament) |
| O2 | **Porția Pro** pentru antrenori și nutriționiști | Antrenorii nu văd ce mănâncă clienții între ședințe; lucrează pe WhatsApp și PDF | Clientul își leagă Porția de antrenor, cu acord; antrenorul vede aderența și acul de aliniere și schimbă ținte din panou | Antrenorul (per client activ) |
| O3 | **Stratul de rezultate al sălii** | Membrii renunță în primele luni | Programul „Primele 90 de zile” pentru membrii noi, cu antrenorii sălii pe Porția Pro | Sala (per membru) |
| O4 | **Datele alimentare corecte din Europa Centrală și de Est** | Date proaste pentru mâncarea locală și porțiile reale | Baza comună, calibrarea, rețete standard, API | Retaileri, platforme de livrare, alte aplicații |
| O5 | **Programe plătite pe rezultat** | Angajatorii plătesc accesul, nu sănătatea | Programe Porția prin carduri de beneficii și abonamente medicale, cu rapoarte agregate anonime | Angajatorul sau rețeaua de clinici |
| O6 | **Metabolic și prediabet** | Prediabetul nu e urmărit între analize | Program cu senzor de glicemie și medic implicat | Pacientul, clinica, poate asigurătorul |
| O7 | **Gospodăria** | Ce se mănâncă decide cine gătește și cumpără, nu fiecare om în parte | Plan de mese pentru familie și listă de cumpărături | Utilizatorul, plus comision de la magazinele online |

### Cât de mare poate fi fiecare (estimările mele, ca ordin de mărime)

- **O1** singură, în România: o afacere bună de consum, nu un unicorn. Extinsă în Europa Centrală și de Est și cu plătitori instituționali, poate deveni categoria.
- **O2 și O3** sunt punctul de intrare: o piață mică pe care o poți domina (antrenorii și nutriționiștii din România), cu distribuție aproape gratuită și cu cele mai valoroase date.
- **O4** e infrastructură. Îți ușurează logarea și se poate vinde, dar singură e mai degrabă o țintă de achiziție.
- **O5** e locul unde se fac banii mari, dar numai după ce ai rezultate dovedite.
- **O6** poate deveni o companie mare, dar e alt joc: dispozitiv medical, studii clinice, medici. Nu e jocul unui fondator singur, acum.

---

## 5. Data moats: datele pe care nu le poate copia nimeni

| Setul de date | Cum se adună | De ce nu se copiază | Ce deblochează |
|---|---|---|---|
| **Răspunsul personal**: aport, trendul greutății, cât arde omul de fapt, aderență, tipul zilei, somn, motiv | Ținta inteligentă și istoricul țintelor, deja în cod | Cere luni de logare constantă cu țintă adaptivă; nu se poate cumpăra | Ținte corecte din prima zi pentru utilizatorii noi, cu estimări de pornire după vârstă, sex, IMC și activitate, calibrate pe populația locală |
| **Evoluția în mentenanță**, după dietă și după GLP-1: doză, proteine, antrenament, greutate, masă slabă estimată | Modurile din O1 | Nimeni nu urmărește oamenii *după*; aplicațiile se opresc la țintă | Un model al riscului de a pune kilogramele la loc: cine are nevoie de ajutor înainte să urce |
| **Jurnalul deciziilor antrenorilor**: starea clientului → decizia → rezultatul | Porția Pro | Deciziile experților nu există în nicio bază publică | Întâi un asistent AI pentru antrenori, apoi un antrenor AI pentru cei care nu au antrenor |
| **Reputația măsurată a antrenorilor** | Rezultatele agregate ale clienților, cu acordul lor | Cere ca antrenorii și clienții să lucreze în platformă | O piață de antrenori clasați după rezultate reale, nu după urmăritori |
| **Datele alimentare locale**: produse, porții cântărite, rețete | Baza comună, calibrarea, rețetele | Se adună produs cu produs și farfurie cu farfurie, în limba locală | Logare mai rapidă și estimări mai bune decât ale oricui pe mâncarea din regiune; API |
| **Contextul comportamental**: stres, plictiseală, social, somn → mese | „De ce mănânci” | Aproape nimeni nu întreabă, la fiecare masă, de ce mănânci | Intervenții la momentul potrivit, de exemplu seara după o noapte scurtă |

### Tensiunea centrală: confidențialitatea contra datelor

Regula din `CLAUDE.md` e corectă și curajoasă: pe server nu ajunge nimic din jurnal. Din cauza ei, primele patru seturi de date **nu pot exista** la nivel de populație. Fără o decizie aici, Porția rămâne o colecție de jurnale izolate pe telefoane.

Soluția pe care aș alege-o:

- **Un acord separat, opt-in, „Contribui la cercetare”**, care trimite doar agregate anonimizate. De exemplu, o dată pe săptămână: diferența dintre cât arde omul de fapt și cât dă formula, aderența și schimbarea trendului. Acordul crește `CONSENT_V` și apare în `confidentialitate.html` în același commit.
- **Pentru Porția Pro, un al doilea acord**, explicit, dat fiecărui antrenor și revocabil oricând.

Confidențialitatea rămâne promisiunea mărcii, iar datele vin doar de la cei care aleg să le dea. În UE asta e un avantaj, nu un cost: un român își va spune mai ușor motivul pentru care mănâncă unei aplicații locale cu reguli clare decât uneia americane.

---

## 6. Flywheel-urile (roțile care se învârt singure)

**Roata 1: datele alimentare (consum)**
Mai mulți utilizatori → mai multe produse și porții cântărite → logare mai rapidă și mai precisă → oamenii rămân mai mult → mai mulți utilizatori.

**Roata 2: personalizarea (rezultate)**
Mai multe evoluții urmărite → estimări de pornire mai bune → rezultate mai bune din prima lună → recomandări de la om la om → mai multe evoluții urmărite.

**Roata 3: rețeaua de antrenori (distribuție și date)**, cea mai puternică
Antrenorii aduc clienți aproape gratuit → clienții produc date de rezultat → antrenorii primesc un asistent mai bun și o reputație măsurată → lucrează cu mai mulți clienți și atrag alții noi → vin mai mulți antrenori pe Porția.
Peste asta vine efectul de rețea: un client care își schimbă antrenorul rămâne pe Porția, iar un utilizator fără antrenor își găsește unul în Porția.

**Roata 4: dovada (B2B)**
Rezultate agregate → studii de caz → săli, angajatori și clinici care plătesc → mai mulți oameni în programe → mai multe rezultate.

Ordinea contează. Roata 1 pornește singură la lansare. Roata 3 e cea pe care o împingi activ. Roata 4 se învârte doar după ce primele trei au produs date.

---

## 7. Monopolul care începe mic: cercurile

Thiel: domină întâi o piață mică, apoi extinde-te în cercuri concentrice.

**Cercul 0 (acum → 3 luni): Porția lansată, cu modul Mentenanță și mușchi.**
Scopul: utilizatori reali în România și primele date despre cât rămân. Fără asta, tot ce urmează e ipoteză.

**Cercul 1 (3 → 12 luni): Porția Pro pentru antrenorii și nutriționiștii din România.**
Ținta de monopol: majoritatea antrenorilor online și a nutriționiștilor care urmăresc nutriția clienților lucrează pe Porția. E o piață de câteva mii de profesioniști (cifră de verificat), deci mică, dar fiecare aduce zeci de clienți.

**Cercul 2 (12 → 24 de luni): sălile și angajatorii din România.**
Programul „Primele 90 de zile” pentru săli și programe de mentenanță prin carduri de beneficii și abonamente medicale, cu rapoarte agregate.

**Cercul 3 (24 → 48 de luni): Europa Centrală și de Est.**
Polonia, Ungaria, Cehia, Bulgaria, Grecia, Republica Moldova: bucătării apropiate, aceleași goluri de date, același rol al oamenilor de încredere. Mecanismul care adună produse și porții se reia în fiecare țară.

**Cercul 4: categoria.**
„Nutriție cu rezultate măsurate”: referința regională pentru mentenanța după dietă și după GLP-1, cu antrenori clasați după rezultate și cu plătitori care plătesc pentru rezultat.

### E unicorn?

Un calcul brut, ca ordin de mărime (estimare, nu prognoză). O evaluare de un miliard de dolari cere de obicei un venit recurent de ordinul 80–150 de milioane de dolari pe an, în creștere. Un drum posibil în Europa Centrală și de Est: câteva sute de mii de abonați plătitori, zeci de mii de antrenori pe Pro și 1–2 milioane de oameni în programe plătite de angajatori și săli.

E posibil, dar cere 5–7 ani de execuție fără greșeli și o echipă. Cel mai probabil rezultat bun rămâne o achiziție, de către un jucător global care vrea Europa de Est. E exact ce s-a întâmplat cu MyFitnessPal și Cal AI. Ambele drumuri încep la fel.

---

## 8. Cum diferențiezi Porția acum, înainte de orice aplicație nouă

### Poziționarea

- Din: „aplicație de calorii și macronutrienți, în română”.
- În: **„Porția te ajută să slăbești o singură dată: ajungi la greutatea ta, rămâi acolo și îți păstrezi mușchii.”**

Categoria pe care o creezi nu e „calorii”, ci **mentenanța**. E singura promisiune pe care n-o face niciun competitor mare și e exact problema celor care țin dietă și a celor care iau GLP-1.

### Mutările, în ordinea priorității

1. **Planul în două faze.** Când trendul atinge ținta (zona `done` din `planState`), planul nu se oprește, ci trece automat în mentenanță. Caloriile urcă treptat spre cât arzi de fapt (`adaptInfo`). Apare o „zonă de siguranță”, de exemplu ±1,5 kg în jurul țintei, iar acul de aliniere devine un avertisment timpuriu: după două săptămâni în afara zonei pornește un mini-plan de corecție. Azi aplicația îți spune să refaci interviul, și tocmai acolo e golul.
2. **Mușchi întâi.** Proteina poate deveni inelul principal în locul caloriilor. Zilele de sală devin antrenamente notate: o bifă „m-am antrenat” și, opțional, un exercițiu de referință, ca semnal de forță. Talia și procentul de grăsime de pe cântar intră în Progres. Un semnal simplu: „slăbești, dar forța scade, deci mănâncă mai multe proteine, nu mai puține calorii”.
3. **Modul „Pe medicație”.** Medicamentul, doza (notată de utilizator, nu recomandată de aplicație), ziua injecției, greața și apetitul. Idei de mese mici și bogate în proteine pentru zilele cu apetit scăzut. Un raport PDF pentru medic. Cel mai important, **„După medicație”**: un plan de 12 săptămâni pentru tranziție, în care ținta inteligentă urmărește îndeaproape dacă revin kilogramele.
4. **Apple Health și Health Connect.** Greutatea de pe cântarele inteligente, pașii, antrenamentele și somnul intră automat. Somnul îl notezi deja manual; automat, tiparele din „De ce mănânci” apar mai repede și mai corect.
5. **Datele alimentare românești.** O insignă „verificat” pe produsele confirmate de mai mulți oameni, cântărirea de calibrare pentru mâncarea gătită acasă și rețete românești standard, cu porții reale.
6. **Porția Pro, întâi un pas mic.** Un cod de legătură de la antrenor, un acord explicit și revocabil și un raport săptămânal pe care clientul i-l trimite antrenorului. Abia după aceea vine panoul web, cu aderența, acul de aliniere și ținte schimbate de antrenor. Antrenorul plătește per client activ, iar clientul primește gratuit funcțiile plătite.
7. **„Contribui la cercetare”.** Acordul opt-in din secțiunea 5. Fără el, roțile 2, 3 și 4 nu pornesc.
8. **Banii vin din rezultat, nu din decor.** Temele sunt o bucurie și un experiment bun de preț, dar nimeni nu rămâne un an pentru ele. Oamenii plătesc pentru mentenanță și mușchi, pentru modul pe medicație și pentru legătura cu antrenorul. Cine dă lunar o sumă mare pe medicament nu va găsi scump un abonament care îl ajută să nu piardă rezultatul.

### Ce nu faci

- Nu concurezi cu MyFitnessPal și Cal AI pe „AI mai bun la poze”.
- Nu lansezi acum în engleză, global, unde ai fi încă o aplicație de calorii printre sute.
- Nu construiești un jurnal complet de antrenamente, ca Hevy sau Strong, și nici hardware, ca EGYM.
- Nu recomanzi doze și nu pui diagnostice, altfel intri sub regulile pentru dispozitive medicale.
- Nu mai adaugi teme până nu știi cât rămân oamenii în aplicație.

---

## 9. Decizia: continui Porția, faci alta sau mergi în paralel?

### Unde se naște fiecare oportunitate

| Oportunitate | Unde | De ce |
|---|---|---|
| O1 Mentenanță și mușchi | **În Porția** (mod nou) | Același utilizator și același motor (`adaptInfo`, `planState`, `planTarget`) |
| O2 Porția Pro | **În Porția, plus un panou web** | Cumpărător diferit, aceleași date; clientul folosește aplicația pe care o ai deja |
| O3 Săli | Extensie a Pro | O sală e o echipă de antrenori |
| O4 Date alimentare | Rezultă din Porția | Serverul există deja (`supabase/`) |
| O5 Angajatori și clinici | Extensie a Pro, mai târziu | E nevoie întâi de date de rezultat |
| O6 Metabolic și prediabet | **Aplicație separată**, doar dacă alegi direcția asta | Reglementare medicală și alt nivel de risc, care ar încetini Porția |
| O7 Gospodăria | În Porția, mai târziu | E o funcție, nu o companie |

### Recomandarea

**Continui Porția și nu construiești acum o aplicație nouă.**

1. Toate oportunitățile serioase (O1–O5 și O7) folosesc același motor, aceeași bază de produse, același sistem de acord și același utilizator. O aplicație nouă ar porni datele de la zero.
2. Încă nu ai utilizatori. Fără date, alegerea între aplicații e ghicit. Cu Porția lansată, devine măsurătoare.
3. Thiel insistă să faci un singur lucru foarte bine. Două aplicații de consum în paralel, pentru un fondator singur, înseamnă două aplicații mediocre.

**În paralel merge doar panoul web Porția Pro**, ca a doua față a aceluiași produs. Nu e o aplicație nouă de consum.

**O aplicație separată are sens doar în aceste cazuri:**

- intri pe O6 (afirmații medicale, senzori de glicemie, medic care prescrie): atunci marca și aplicația trebuie să fie separate, ca riscul de reglementare să nu atingă Porția;
- după 90 de zile, antrenorii vor Pro cu adevărat, dar utilizatorii fără antrenor nu rămân: atunci Pro devine produsul principal, iar Porția rămâne aplicația clientului;
- un partener (o sală mare, o rețea de clinici) cere o aplicație cu marca lui: atunci faci o versiune cu altă marcă a aceluiași cod, ceea ce Capacitor face ușor, nu o aplicație nouă.

---

## 10. Ce trebuie să fie adevărat și cum afli ieftin, în 90 de zile

| Ipoteza | Experimentul | Semnalul bun (praguri propuse de mine) |
|---|---|---|
| Antrenorii vor un instrument de nutriție în română și plătesc pentru el | 15–20 de interviuri și un pilot manual: clienții trimit antrenorului exportul .csv sau un raport săptămânal | Cel puțin 10 antrenori cu cel puțin 5 clienți activi fiecare; cel puțin 3 care spun un preț și plătesc |
| Utilizatorii de GLP-1 din România pot fi găsiți și au nevoie de ajutor după tratament | 10–15 interviuri (grupuri de Facebook, comunități) și 3–5 medici care prescriu | Medicii acceptă să recomande aplicația; utilizatorii vorbesc singuri, neîntrebați, despre frica de a pune kilogramele la loc |
| Mentenanța e o promisiune mai puternică decât „calorii cu AI” | O pagină de prezentare cu două mesaje, testate A/B | Mult mai multe înscrieri pentru „slăbești o singură dată” |
| Oamenii rămân în aplicație | Lansarea în magazine și măsurători agregate, cu acord | Câte zile pe săptămână logează oamenii în a doua lună; câți ajung în mentenanță |
| Când oamenii notează mai rar ce mănâncă, urmează abandonul sălii | O sală parteneră, cu 50–100 de membri noi | O legătură vizibilă în primele 8 săptămâni |

**Porțile de decizie, în ziua 90:**

- **Antrenorii vor Porția Pro:** Pro devine prioritatea și treci la cercul 1.
- **Mentenanța și GLP-1 prind, antrenorii nu:** rămâi pe consum, mergi mai adânc pe O1 și îi tratezi pe medici drept cei care recomandă aplicația.
- **Prind amândouă:** Pro e canalul, iar mentenanța e produsul. E cel mai bun caz.
- **Nu prinde nimic:** Porția rămâne o aplicație de nișă bună și o posibilă țintă de achiziție. Abia atunci te gândești la o aplicație nouă, plecând de la ce ai aflat din interviuri.

---

## 11. Riscuri

- **Reglementarea medicală (UE, MDR).** Un software care recomandă doze, pune diagnostice sau tratează devine dispozitiv medical. Porția rămâne la comportament și urmărire, iar medicul decide.
- **Datele de sănătate (GDPR, articolul 9).** Motivul mesei, somnul și medicația sunt date sensibile: cer acord explicit, o evaluare de impact și servere în UE. Porția are deja baza (`CONSENT_V` și amprentele cu `PORTIA_PEPPER`).
- **Giganții.** MyFitnessPal, Apple sau Google pot adăuga mentenanță sau antrenori AI. Te aperi prin datele locale, prin rețeaua de antrenori și prin încredere, nu prin funcții.
- **Fondatorul singur.** Cercurile 1 și 2 cer vânzări și relații în săli și în nutriție. La întrebarea „Oameni” a lui Thiel stai cel mai slab azi. Un cofondator sau un partener din lumea antrenorilor ți-ar crește cel mai mult șansele.
- **Încă nu ai utilizatori.** Toate avantajele din date sunt deocamdată arhitectură, nu realitate. Primul pas rămâne lansarea.

---

## Surse

- MyFitnessPal cumpără Cal AI (martie 2026): [TechCrunch](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens), [Athletech News](https://athletechnews.com/myfitnesspal-cal-ai-acquisition), [Fitt Insider](https://insider.fitt.co/myfitnesspal-acquires-rival-food-tracker-cal-ai/)
- Kilogramele revin după oprirea GLP-1 (meta-analiză, 2026): [News-Medical](https://www.news-medical.net/news/20260309/Most-weight-lost-on-GLP-1-drugs-returns-within-a-year-after-stopping.aspx), [EurekAlert](https://www.eurekalert.org:443/news-releases/1119852)
- Date din practică despre oprirea tratamentului: [News-Medical, Cleveland Clinic](https://www.news-medical.net/news/20260312/Real-world-study-shows-modest-weight-regain-after-GLP-1-discontinuation.aspx), [HealthDay](https://www.healthday.com/healthpro-news/weight-loss/many-with-overweight-obesity-discontinue-glp-1-receptor-agonists-within-one-year)
- Aplicațiile care însoțesc GLP-1 și problema proteinelor: [Sahha](https://sahha.ai/blog/glp1-digital-weight-management/), [MyNetDiary GLP-1 Companion](https://digital-release.kxan.com/business/press-releases/cision/20260505FL48085/mynetdiary-launches-glp-1-companion-for-ozempic-wegovy-and-mounjaro-users), [Nutrition Insight](https://www.nutritioninsight.com/news/glp-1-trials-dietary-data-gap-nutrition-companion-products.html)
- Rambursarea Wegovy și Mounjaro în Franța (iunie 2026): [Vidal](https://www.vidal.fr/actualites/37850-obesite-prise-en-charge-de-wegovy-et-mounjaro-a-partir-du-15-juin-2026-sous-conditions.html), [Service-Public](https://www.service-public.gouv.fr/particuliers/actualites/A18932)
- EGYM devine unicorn (2024): [Fitt Insider](https://insider.fitt.co/egym-raises-200m-hits-1b-valuation/), [Athletech News](https://athletechnews.com/egym-raises-200-million-growth-capital)
- Beneficiile pentru sport în România: [Profit.ro, ESX](https://profit.ro/povesti-cu-profit/foto-esx-atrage-o-investitie-de-2-milioane-de-euro-pentru-continuarea-dezvoltarii-in-romania-si-scalare-internationala-21232428), [Revista Biz, 7card și Sodexo](https://www.revistabiz.ro/sodexo-romania-a-achizitionat-integral-7-card/)
- Diabet și obezitate în România: [BZI, IDF 2024](https://www.bzi.ro/1-din-11-adulti-din-romania-traieste-cu-diabet-5297160), [Puterea, clasamentul european](https://www.puterea.ro/barbatii-din-romania-in-fruntea-clasamentului-european-al-obezitatii-unde-se-claseaza-femeile/), [TVR Info](https://tvrinfo.ro/obezitatea-o-noua-pandemie-35-dintre-adultii-din-romania-traiesc-cu-obezitate-kilogramele-in-plus-inseamna-risc-crescut-de-boli-cardiovasculare/)
