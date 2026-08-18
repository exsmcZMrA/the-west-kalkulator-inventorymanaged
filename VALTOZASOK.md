# Változások

A The West mesterség-kalkulátor játékbeli paneljének változásnaplója.

A panel a böngészőben már betöltött adatot olvassa. Nem küld kérést a játék
szervereinek, és nem automatizál semmilyen játékbeli cselekvést.

---

## 1.0.0 - 2026-08-18

Első nyilvános kiadás. A panel ettől a verziótól kezdve nem fejlesztési
állapotú, és a verziószám innentől csak felfelé megy.

A korábbi, 1.x-es számozás fejlesztési sorozat volt. Aki azt használta,
ugyanezt a panelt kapja, csak rendezett számozással.

**Amit a panel tud**

- Mozgatható ablak a játék saját ablakkeretében
- A raktárat élőben olvassa, beolvasás nélkül
- A teljes gyártási lánc lebontása alapanyagokig
- Darabszám 1-től 9999-ig, léptetőgombokkal is
- Több cél egy tervben, összesített hozzávalólistával
- Három nézet: robbantott ábra, lépéskártyák, csak alapanyag
- Készültségi gyűrű százalékkal
- Másolás a játék `[item=ID]` formátumában, tételenként és egyben
- Hiánylista másolása egy gombbal
- Négy nyelv: magyar, angol, német, lengyel
- Beállítások fül: nyelv, verzió, frissítéskeresés, adatállapot
- Frissítésértesítő a játék saját ablakában, naponta legfeljebb egyszer
- A másolás formátuma választható: a játékba illeszthető `[item=ID]` alak,
  vagy olvasható név a játékon kívülre. A váltó a felső sávban áll, a
  választás mentődik, és mindhárom másolási útra hat.
- Szöveges módban a lista elé fejlécsor kerül, hogy a címzett lássa, miről
  van szó. Ez az alak a webes kalkulátorba vissza is olvasható.

**Az utolsó fejlesztési körben javított hibák**

- Az ablak elcsúszva nyílt, ha előtte a játék saját X gombjával zártad be.
  A középre igazítás őre nem állt vissza ilyenkor, ezért az új ablak
  igazítás nélkül jött létre. Az őr mostantól ablakpéldányhoz kötött.
- Darabszám beírása után nem lehetett másik receptre váltani. A darabszám
  megadása magától tervbejegyzést hozott létre, és az elnyomta a listás
  kiválasztást. Mostantól a kiválasztás vezet, kivéve ha több célt
  állítottál össze a + gombbal.

**Ismert korlátok**

- Ha fut a TW-Calc szkript, a "csak a megtanult receptjeim" szűrő nem tud
  dolgozni, mert a TW-Calc felülírja a játék `Crafting.recipes` objektumát.
  Ilyenkor a szűrő letiltva jelenik meg, és a Beállítások fül megmondja,
  miért. Minden más funkció változatlanul működik.
- Az ablak átméretezése ki van kapcsolva. A panel fix, nagy méretben nyílik.
- A frissítésellenőrzés eltérést néz, nem azt, hogy újabb-e a fenti verzió.

---

## Frissítés korábbi verzióról: ÚJRATELEPÍTÉS KELL

Ebben a kiadásban mindkét szkript **új nevet kapott**, hogy nemzetközileg is
érthető legyen:

- `The West Crafting Calculator` (a játékbeli panel)
- `The West Crafting Calculator - inventory import` (a raktár import)

A Tampermonkey a nevéből azonosítja a szkriptet, ezért ezt **új szkriptként**
telepíti a régi mellé. Ha a régit bent hagyod, két példány futna egyszerre.

Ezért a menet:

1. Nyisd meg a Tampermonkey irányítópultját
2. **Töröld a régi szkriptet** (`Mesterség-kalkulátor` kezdetű nevek)
3. Telepítsd az újat a kalkulátor oldaláról

A beállításaid (nyelv, másolási formátum) ilyenkor alaphelyzetbe állnak.
Ez egyszeri lépés, a következő kiadásoktól kezdve a Tampermonkey megint
magától frissít.

A számozás is újraindult: a panel korábban fejlesztési számozással ment
(1.6, 1.7), mostantól az 1.0.0 a kiindulópont, és innentől csak felfelé megy.
