# The West mesterség-kalkulátor

Alapanyag-számoló a [The West](https://www.the-west.hu/) böngészőjátékhoz. Kiválasztod a mesterséget, a receptet és a darabszámot, a kalkulátor pedig robbantott ábrán mutatja, mit miből kell legyártanod — a köztes termékeket is végigbontva, mesterségeken átnyúlva.

**Élő verzió:** *(ide jön a GitHub Pages linkje)*

## Mit tud

- **Három nézet ugyanarra a tervre** — robbantott ábra (nyitogatható ágakkal), lépéskártyák sorrendben, vagy csak az alapanyagok. A választás megjegyződik.
- **Munkalap** — körgyűrű mutatja, hány százalékban áll készen a szükséges nyersanyag a raktáradból.
- **Másolás a játékba** — az alapanyag nézetben minden tétel kattintható, és `48 [item=702000]` formában kerül a vágólapra. A blokk fejlécében lévő darabszámra kattintva az egész lista egyszerre, soronként egy tétel.
- **Színkód végig** — zöld: megvan, sárga: gyártani kell vele, vörös: hiányzik.
- **Raktárkészlet** — a jobb oldali listában közvetlenül állítható, a sor háttere kitöltöttségi csíkként mutatja, hol tartasz. Ha egy köztes termékből van elég, az alatta lévő ág kiesik a listából.
- **Teljes raktár nézet** — minden tétel, ami bármelyik receptben előfordul; kereséssel bármi felvehető, akkor is, ha épp egyik nyitott recepthez sem tartozik.
- **Kereshető receptlista** — mesterség szerinti szűréssel, és pöttyökkel jelezve, mi gyártható le azonnal a mostani készletedből. A mesterségszinted megadásával a magasabb szintű receptek elhalványulnak.
- **Világos és sötét mód** — a jobb felső gombbal váltható, a választás megjegyződik.
- **Automatikus mentés** — a raktárkészlet, a szintek, a névmódosítások és a téma a böngésző tárolójában maradnak, tehát bezárás után is megvannak. A lábléc linkjén exportálhatók és másik gépre átvihetők.

## Használat

Nincs telepítés és nincs build: az `index.html` egyetlen önálló fájl, minden benne van. Elég megnyitni böngészőben, vagy GitHub Pages-en publikálni (Settings → Pages → Deploy from a branch → `main` / `root`).

## Adatok

- **Receptszerkezet** (szintek, hozzávalók, mennyiségek): [tw-db.info](https://tw-db.info/?strana=recipe&craft=1)
- **Tárgynevek**: [The-West wiki HU ID-listája](https://wiki.the-west.hu/wiki/ID). A wiki ID-je + `000` adja a tw-db azonosítóját.

Néhány újabb termék neve nem szerepel egyik listában sem, ezeket kézzel pontosítottuk a játék alapján. A wiki ID-listája 2016 óta nem frissül, így eltérések előfordulhatnak — a névpanelen bármelyik tétel átírható.

Nem hivatalos rajongói eszköz, semmilyen kapcsolatban nem áll az InnoGames-szel.
