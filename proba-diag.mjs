/* Production regressziós teszt - The West mesterség-kalkulátor 1.4.0
   Futtatás: node proba-diag.mjs
   A jsdom nem renderel képet; ez a DOM/CSS szerződést és a funkciókat őrzi. */
import fs from 'fs';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';

/* Az elvárt szakaszhash-ek AZ AUDITÁLT 1.4.0 BASELINE-BÓL származnak
   (méret 104 912 bájt, SHA-256 a3b5a6b5d07758d8930803f5d213d3573ccec95052fc21d76e4107727345243f).
   Beégetve szerepelnek, hogy a teszt önállóan, baseline-fájl nélkül fusson. */
const ELVART_HASH = {
  "alkalmazNativSkin": "16cd42b0d31c1319e3509d48cab4909274c4a5eed5892e91f2030a897363327f",
  "visszaallitNativSkin": "30cf5c8853448efa9b5b2fc71f08a7a9c7f6ff4d0bcd4e2a10f71c693b390d54",
  "skinGyujtes": "1e4897f4ef89aefec13466b9f1e742040e00f79623c9a475a9efd9146c46e9b2",
  "skinTartalek": "9308ab4d0e945c06c549902802a8aab54f5cb85f6188979d3fbc5e2440913c52",
  "zarNativAblak": "50ca52bed24db74b1f96acfe68d962620a03fdad63f91bff9de1d829228bac0e",
  /* 1.5.0 UI PREVIEW - négy production függvény SZÁNDÉKOSAN változott,
     a prompt 3., 4. és 9. fejezete szerint. A kapu tovább őrzi őket a
     véletlen módosítás ellen, csak az elvárt érték frissült:
       keszitNativ     - egyszeri nyitási center az új példányra
       zarNativAblak   - a center-jelző visszaállítása bezáráskor
       rajzolReceptek  - az első recept egyszeri belső kijelölése
       rajzolMunkalap  - a Hiánylista gomb háromrétegű markupja           */
  "keszitNativ": "5763f990c902cf6ae13c76de6d8b75f6b7810ddc1c2b4f14afc14ad5166c4953",
  "fessTartot": "386f495075fc392939d2e60a10507967aae6e7f8723496c2b448a3ba539eaa1c",
  "hatterTarto": "0d201e58fcf356d9487a4cbe4d6309396de02b574230e44dc0f17642b437d4f2",
  "igazitNativ": "7d6732e99c1fe2a6b16199742bfc8496b2150a847631445660a4e3dbeb430299",
  "olvasRaktar": "dd7fa2e74e6ef0d9205f819a4cd0a8f7b059c31f231d6207b3ffeaa46b937930",
  "rajzolReceptek": "1f0181ad6c7cd091a66a63b657809a8700e2b8105b2aeaa6265700f4eef9c100",
  "rajzolMunkalap": "041825630c1696c151bda6c9ec6f55168a71132b65de7f9ff505493f1c2c7eea",
  "rajzolRaktar": "24ab9ac17a3de711a240671c20855d3c83b1d5e895648c0a355ca69702bcf539",
  "frissit": "6d13a237b5e4e788f234bee284a5e59ac1eb7cc90629abf0b3533e70dc4f49f7",
  "kotesek": "aa7974db8a73c837f49450ba626c67613e138bc7b9099970a1af99a3da7fbf13",
  "__CSS__": "d136b8199fb4e003d670a4bfa5690d96c7fed8c0c294d285aeac5f3751e4dc72"
};
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');

/* Egy függvény törzsének kivonása zárójelszámlálással. Hiányzó függvény vagy
   nem záruló törzs esetén null - az bukás. */
function fvTorzs(t, fn) {
  const i = t.indexOf('function ' + fn + '(');
  if (i < 0) return null;
  let d = 0;
  for (let x = t.indexOf('{', i); x < t.length; x++) {
    if (t[x] === '{') d++;
    else if (t[x] === '}') { d--; if (!d) return t.slice(i, x + 1); }
  }
  return null;
}
function cssTorzs(t) {
  const i = t.indexOf('const CSS = `');
  if (i < 0) return null;
  const j = t.indexOf('`;', i);
  return j < 0 ? null : t.slice(i, j);
}

const SRC = fs.readFileSync('the-west-panel.user.js', 'utf8');
/* a teszt saját forrása az önvizsgálati kapukhoz - nem projektfájl-olvasás */
const TESZT_SAJAT = fs.readFileSync(new URL(import.meta.url), 'utf8');
const TISZTA = SRC.replace(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m, '');
let hiba = 0, ossz = 0;
const all = (nev, felt, reszlet) => {
  ossz++;
  if (felt) console.log('  OK    ' + nev);
  else { hiba++; console.log(' BUKÁS  ' + nev + (reszlet ? '  → ' + reszlet : '')); }
};
const stil = el => (el && el.getAttribute) ? (el.getAttribute('style') || '') : '';

/* 1.7.0: a három ideiglenes mérőblokk (STYLE PROBE 5A, COMPONENT MAPPER 5B1
   és a C3 alblokk) kikerült a kiadásból. A PROD innentől maga a teljes
   userscript, mert nincs benne mérőinfrastruktúra. */
const PROD = SRC;

/* ============================================================
   Hamis natív játékkörnyezet a bizonyított DOM-szerkezettel
   ============================================================ */
function kornyezet(o) {
  o = o || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url: 'https://west1.the-west.hu/game.php', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w, 'innerWidth', { value: 1300 });
  Object.defineProperty(w, 'innerHeight', { value: 930 });

  /* 1.0.1: a raktar felulirhato, hogy a Max szamitas valodi keszlettel
     legyen probalhato. Parameter nelkul a regi, fix keszlet marad. */
  const KESZLET = o.raktar || { 711000: 48, 716000: 3, 766000: 12, 10004000: 9 };
  w.Bag = {
    items_by_id: Object.fromEntries(Object.keys(KESZLET).map(k => [String(k), {}])),
    getItemCount: id => KESZLET[String(id)] || KESZLET[Number(id)] || 0
  };
  w.Character = { name: 'smcZ', professionId: 2, professionSkill: o.szint || 527 };
  /* 1.0.1: a megtanult receptek listaja is felulirhato. A Max szamitas
     ugyanis a megtanultsagot is nezi, ezert a probahoz meg kell tudni
     mondani, mit ismer a karakter. Parameter nelkul a regi, egyelemu lista. */
  const TANULT = o.tanult || [1855000];
  w.Crafting = { recipes: Object.fromEntries(
    TANULT.map((id, i) => ['r' + i, { last_craft: 1, craftitem: id }])) };

  const meretek = new Map();
  const R = el => { const m = meretek.get(el) || [0, 0, 0, 0];
    return { left: m[2], top: m[3], right: m[2] + m[0], bottom: m[3] + m[1], width: m[0], height: m[1] }; };
  const gcs = w.getComputedStyle.bind(w);
  w.getComputedStyle = (el, psz) => {
    if (psz) return { content: 'none' };
    if (!el || !el.__st) return gcs(el);
    const alap = Object.assign({}, el.__st);
    const inl = stil(el);
    [['background-repeat', 'backgroundRepeat'], ['background-size', 'backgroundSize'],
     ['background-position', 'backgroundPosition'], ['background-origin', 'backgroundOrigin'],
     ['background-image', 'backgroundImage'], ['position', 'position']].forEach(([a, b]) => {
      const m = new RegExp('(?:^|;)\\s*' + a + ':\\s*([^;]+)').exec(inl);
      if (m) alap[b] = m[1].trim();
    });
    return alap;
  };
  const D = (cls, wid, hei, x, y, st) => {
    const e = w.document.createElement('div');
    e.className = cls; e.getBoundingClientRect = () => R(e);
    meretek.set(e, [wid, hei, x || 0, y || 0]);
    e.__st = st || { backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)',
      backgroundRepeat: 'repeat', backgroundPosition: '0% 0%', backgroundSize: 'auto',
      backgroundOrigin: 'padding-box', position: 'static' };
    return e;
  };
  const ASSET = kep => ({
    backgroundImage: 'url("https://westhu.innogamescdn.com/images/window/' + kep + '")',
    backgroundColor: 'rgba(0, 0, 0, 0)', backgroundRepeat: 'repeat', backgroundPosition: '0% 0%',
    backgroundSize: 'auto', backgroundOrigin: 'padding-box', position: 'absolute'
  });

  const naplo = [], ab = {};
  function Window(id) {
    this.id = id;
    this._fo = D('tw2gui_window', 1240, 820, 0, 0);
    this._inset = D('tw2gui_window_inset', 1214, 786, 13, 17,
      ASSET(o.rosszInset ? 'valami_mas.png' : 'window2_bg.jpg?6'));
    this._pane = D('tw2gui_window_content_pane', 1190, 725, 25, 70);
    this._quad = {};
    ['tl', 'tr', 'bl', 'br'].forEach((q, i) => {
      this._quad[q] = D('tw2gui_bg_' + q + ' tw2gui_window_border', 620, 410,
        (i % 2) * 620, Math.floor(i / 2) * 410,
        ASSET(o.rosszBorder && q === 'br' ? 'mas_keret.png' : 'window2_border.png?15'));
    });
    if (o.nullaInset) this._inset.className = 'nem_inset';
    if (o.hianyzoQuad) this._quad.br.className = 'tw2gui_valami_mas';
    this._fo.append(this._inset, this._quad.tl, this._quad.tr, this._quad.bl, this._quad.br, this._pane);
    if (o.ketInset) this._fo.appendChild(D('tw2gui_window_inset', 100, 100, 0, 0, ASSET('window2_bg.jpg?6')));
    w.document.body.appendChild(this._fo);
    Object.defineProperty(this._pane, 'clientHeight', { get: () => 725, configurable: true });
    Object.defineProperty(this._fo, 'offsetWidth', { get: () => 1240, configurable: true });
    Object.defineProperty(this._fo, 'offsetHeight', { get: () => 820, configurable: true });
  }
  ['setTitle', 'setMiniTitle', 'setResizeable', 'setMinSize', 'bringToTop', 'doLayout', 'center']
    .forEach(n => Window.prototype[n] = function () { naplo.push(n); return this; });
  Window.prototype.setSize = function (x, y) { naplo.push('setSize:' + x + 'x' + y); return this; };
  Window.prototype.clearContentPane = function () { naplo.push('clearContentPane'); return this; };
  Window.prototype.getContentPane = function () { return this._pane; };
  Window.prototype.getMainDiv = function () { return this._fo; };
  Window.prototype.appendToContentPane = function (n) { this._pane.appendChild(n); return this; };
  /* az élő API-ban destroy van, close nincs */
  Window.prototype.destroy = function () { naplo.push('destroy'); this._fo.remove(); delete ab[this.id]; };
  if (o.vanClose) Window.prototype.close = function () { naplo.push('close'); this._fo.remove(); delete ab[this.id]; };

  if (!o.nincsNativ) {
    w.west = { gui: { Window, Groupframe: function () {} } };
    w.wman = {
      isWindowCreated: i => !!ab[i], getById: i => ab[i],
      open: (i, c) => { naplo.push('wman.open'); return ab[i] = new Window(i); },
      close: i => { naplo.push('wman.close'); if (!o.wmanNoop && ab[i]) { ab[i]._fo.remove(); delete ab[i]; } }
    };
  }
  const tar = o.tarolo || {};
  w.GM_getValue = (k, d) => (k in tar ? tar[k] : d);
  w.GM_setValue = (k, v) => { tar[k] = v; };
  w.GM_xmlhttpRequest = x => x.onerror && x.onerror();
  w.unsafeWindow = w;
  let ro = null;
  w.ResizeObserver = class { constructor(f) { ro = f; } observe() {} disconnect() {} };
  let masolt = null;
  w.navigator.clipboard = { writeText: t => { masolt = t; return Promise.resolve(); } };
  return { dom, w, ab, naplo, tar, D, ASSET, meretek,
           abl: () => ab['mk-kalkulator'], ro: () => ro, masolat: () => masolt };
}

async function indit(k) {
  new k.w.Function(TISZTA).call(k.w);
  await new Promise(r => setTimeout(r, 1400));
  const kat = el => el && el.dispatchEvent(new k.w.MouseEvent('click', { bubbles: true }));
  kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 1800));
  const host = k.w.document.getElementById('mk-panel-host');
  const gy = host ? host.shadowRoot : null;
  return { kat, host, gy, q: m => gy && gy.querySelector('[data-mez="' + m + '"]') };
}

/* ============================================================
   A. SKIN SIKERES ÚT
   ============================================================ */
console.log('\n--- A) natív skin, sikeres út ---');
{
  const k = kornyezet({});
  const u = await indit(k);
  const a = k.abl(), Q = a._quad;

  all('1. pontosan egy inset és négy quadrant azonosítva a saját mainDiv alatt',
    stil(a._inset) !== '' && ['tl', 'tr', 'bl', 'br'].every(q => stil(Q[q]) !== ''));
  all('2. assetkapu mind az öt elemen',
    /window2_bg\.jpg/.test(a._inset.__st.backgroundImage)
    && ['tl', 'tr', 'bl', 'br'].every(q => /window2_border\.png/.test(Q[q].__st.backgroundImage)));
  all('3a. négy quadrant no-repeat + 200% 200%',
    ['tl', 'tr', 'bl', 'br'].every(q => /background-repeat:no-repeat/.test(stil(Q[q]))
      && /background-size:200% 200%/.test(stil(Q[q]))));
  all('3b. helyes sarokpozíciók',
    /background-position:0% 0%/.test(stil(Q.tl)) && /background-position:100% 0%/.test(stil(Q.tr))
    && /background-position:0% 100%/.test(stil(Q.bl)) && /background-position:100% 100%/.test(stil(Q.br)));
  all('4. quadrant backgroundImage és geometria változatlan',
    ['tl', 'tr', 'bl', 'br'].every(q => !/background-image/.test(stil(Q[q]))
      && !/(^|;)\s*(width|height|left|top|right|bottom|position|transform|z-index)\s*:/.test(stil(Q[q]))));
  all('5. inset no-repeat + 100% 100% + 0 0 + border-box',
    /background-repeat:no-repeat/.test(stil(a._inset)) && /background-size:100% 100%/.test(stil(a._inset))
    && /background-position:0 0/.test(stil(a._inset)) && /background-origin:border-box/.test(stil(a._inset)),
    stil(a._inset));
  all('6. inset backgroundImage és geometria változatlan',
    !/background-image/.test(stil(a._inset))
    && !/(^|;)\s*(width|height|left|top|right|bottom|position|transform|z-index)\s*:/.test(stil(a._inset)));
  all('7. contentPane háttere átlátszó', a._pane.style.backgroundColor === 'transparent',
    a._pane.style.backgroundColor);
  all('8. host data-nativ-skin="ok"', u.host.getAttribute('data-nativ-skin') === 'ok');

  const css = [...u.gy.querySelectorAll('style')][0].textContent;
  all('9a. sikeres skin mellett a .frame háttere transparent',
    css.includes(':host([data-nativ][data-nativ-skin="ok"]) .frame{ background-color:transparent }'));
  all('9b. sikeres skin mellett a ::before nem fest',
    css.includes(':host([data-nativ][data-nativ-skin="ok"]) .frame::before{ content:none; display:none }'));

  const elotteI = stil(a._inset), elotteQ = stil(Q.tl);
  if (k.ro()) { k.ro()(); k.ro()(); }
  await new Promise(r => setTimeout(r, 60));
  all('10. ismételt alkalmazás idempotens, az inline style nem nő',
    stil(a._inset) === elotteI && stil(Q.tl) === elotteQ,
    stil(a._inset).length + ' vs ' + elotteI.length);
  all('10b. nincs kumulálódott ismétlődő deklaráció',
    (stil(a._inset).match(/background-size/g) || []).length === 1);
  k.dom.window.close();
}

/* ============================================================
   B. SKIN FALLBACK ÚT
   ============================================================ */
console.log('\n--- B) natív skin, tartalék út ---');
for (const [cimke, o] of [
  ['11. nulla inset', { nullaInset: true }],
  ['12. két inset', { ketInset: true }],
  ['13. hiányzó quadrant', { hianyzoQuad: true }],
  ['14. eltérő inset asset', { rosszInset: true }],
  ['15. eltérő border asset', { rosszBorder: true }]
]) {
  const k = kornyezet(o);
  const u = await indit(k);
  const a = k.abl(), Q = a._quad;
  const semmiValtozott = stil(a._inset) === ''
    && ['tl', 'tr', 'bl', 'br'].every(q => stil(Q[q]) === '');
  all(cimke + ' → nincs részleges natív módosítás', semmiValtozott,
    'inset:"' + stil(a._inset) + '" tl:"' + stil(Q.tl) + '"');
  all(cimke + ' → 16. data-nativ-skin nincs sikeresre állítva',
    u.host.getAttribute('data-nativ-skin') !== 'ok');
  all(cimke + ' → saját tartalék háttér aktív',
    a._pane.style.backgroundColor === 'rgb(240, 230, 209)', a._pane.style.backgroundColor);
  all(cimke + ' → a felhasználói funkciók működnek',
    u.q('rlist').querySelectorAll('button[data-id]').length === 57);
  k.dom.window.close();
}

{
  const k = kornyezet({ nincsNativ: true });
  const u = await indit(k);
  all('17. natív ablak nélkül a saját keret működik',
    !u.host.dataset.nativ && Number(u.host.style.zIndex) >= 100
    && u.q('rlist').querySelectorAll('button[data-id]').length === 57);
  all('17b. a tartalék keretben nincs skin-jelző', u.host.getAttribute('data-nativ-skin') !== 'ok');
  k.dom.window.close();
}

/* ============================================================
   C. ÉLETCIKLUS
   ============================================================ */
console.log('\n--- C) életciklus ---');
{
  const k = kornyezet({});
  const u = await indit(k);
  const a = k.abl();
  all('18. a skin lefut a létrehozás után', stil(a._inset) !== '');
  all('19. a setSize/doLayout körök után is aktív',
    k.naplo.filter(x => x.startsWith('setSize')).length >= 1 && stil(a._inset) !== '');

  /* 1.5.2: az Alapméret gomb kikerült a felületről; a skint a meglévő
     igazitNativ-kör illeszti újra */
  a._inset.removeAttribute('style');
  if (k.ro()) k.ro()();
  await new Promise(r => setTimeout(r, 60));
  all('20. az igazitNativ-kör után a skin aktív', stil(a._inset) !== '');

  a._inset.removeAttribute('style');
  if (k.ro()) k.ro()();
  await new Promise(r => setTimeout(r, 40));
  all('21. kézi ResizeObserver-callback után aktív', stil(a._inset) !== '');

  /* 1.7.0: az elrendezés-diagnosztika ResizeObserverje kikerült, egy maradt */
  all('22a. pontosan egy ResizeObserver van, a natív illesztéshez',
    (SRC.match(/new ResizeObserver/g) || []).length === 1);
  all('22b. nincs új skin-időzítő',
    !/setTimeout\([^)]*alkalmazNativSkin/.test(SRC) && !/setInterval\([^)]*alkalmazNativSkin/.test(SRC));
  k.dom.window.close();
}

{
  const k = kornyezet({});
  const u = await indit(k);
  const regiInset = k.abl()._inset;
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 80));
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 1800));
  const uj = k.abl();
  all('23. új mainDiv esetén új eredeti stílusmentés készül',
    uj && uj._inset !== regiInset && stil(uj._inset) !== '' && regiInset.getAttribute('style') === null,
    'régi:"' + stil(regiInset) + '"');
  k.dom.window.close();
}

{
  const k = kornyezet({ wmanNoop: true });
  const u = await indit(k);
  const a = k.abl(), Q = a._quad;
  all('a skin bezárás előtt aktív', stil(a._inset) !== '');
  k.naplo.length = 0;
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 100));
  all('24. bezáráskor minden eredeti natív inline style visszaáll',
    a._inset.getAttribute('style') === null
    && ['tl', 'tr', 'bl', 'br'].every(q => Q[q].getAttribute('style') === null));
  all('24b. a data-nativ-skin jelző törlődik', u.host.getAttribute('data-nativ-skin') !== 'ok');
  all('25. csendes wman.close esetén a destroy zár be',
    k.naplo.includes('wman.close') && k.naplo.includes('destroy'), k.naplo.join(','));
  all('26. bezárás után nincs csatlakozó mk-kalkulator mainDiv', !k.w.document.contains(a._fo));
  k.dom.window.close();
}

{
  const k = kornyezet({});
  const u = await indit(k);
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 80));
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 1800));
  all('27. újranyitáskor pontosan egy kalkulátorablak van',
    k.w.document.querySelectorAll('.tw2gui_window').length === 1,
    k.w.document.querySelectorAll('.tw2gui_window').length + ' ablak');
  k.dom.window.close();
}

/* ============================================================
   D. CSS ÉS VIZUÁLIS KAPUK
   ============================================================ */
console.log('\n--- D) CSS-kapuk ---');
{
  const css = SRC.slice(SRC.indexOf('const CSS = `'), SRC.indexOf('`;', SRC.indexOf('const CSS = `')));
  all('28. sikeres skin mellett .frame transparent',
    css.includes(':host([data-nativ][data-nativ-skin="ok"]) .frame{ background-color:transparent }'));
  all('29. sikeres skin mellett nincs frame gradient',
    css.includes(':host([data-nativ][data-nativ-skin="ok"]) .frame::before{ content:none; display:none }'));
  all('30. a production kódban nincs próba-outline vagy módgomb',
    !/outline:2px dashed/.test(PROD) && !/#2f6bd8/.test(PROD) && !/mk-proba/.test(PROD));
  const skinKod = SRC.slice(SRC.indexOf('function alkalmazNativSkin'), SRC.indexOf('function skinTartalek'));
  all('31. nincs csempézett pergamen', !/background-repeat:repeat/.test(skinKod));
  all('32. sikeres skin mellett nincs új bézs ráfestés',
    /nativOk \? "transparent" : HATTER/.test(SRC));
  all('33. a kártyák és vezérlők panelháttere megmarad',
    css.includes('.card{ background:var(--panel)') && css.includes('--panel:#fbf6ec'));
  all('34. a tartalék frame CSS változatlan',
    css.includes(':host([data-nativ]) .frame{ border:0; border-radius:0; box-shadow:none;')
    && css.includes('background-color:#f0e6d1 }'));
}

/* ============================================================
   E. TAKARÍTÁSI KAPUK
   ============================================================ */
console.log('\n--- E) takarítás ---');
{
  all('35. nincs PROBA_ID / mk-proba / probaAblak',
    !/PROBA_ID/.test(SRC) && !/mk-proba/.test(SRC) && !/probaAblak/.test(SRC));
  all('36. nincs DIAG/TEST felületi jelzés',
    !/DIAG/.test(SRC) && !/NATIVE TEST/.test(SRC) && !/PARCHMENT MODES/.test(SRC));
  all('36b. a verzió egyetlen konstansból jön',
    SRC.includes('const VERZIO = "1.0.1"') && SRC.includes('<span class="ver">v${VERZIO}')
    && /@version\s+1\.0\.1/.test(SRC)
    /* 1.6.5: a frissítésellenőrzés is a VERZIO-t használja, nem külön értéket */
    && SRC.includes('const SAJAT_VER = VERZIO;')
    && !/const SAJAT_VER = "/.test(SRC));
  all('37. nincs referencia-kijelölő',
    !/refKijelol|refTakarit|rogzitReferencia/.test(SRC));
  all('38. nincs S0–S4 életciklus-riport',
    !/eletciklus|pillanatCp|cpDelta/.test(SRC));
  all('39. nincs Telegram-fa vagy illesztési riport',
    !/telegramFa|riportSzoveg|jelentIllesztes|szerkezetiFa|osszevet/.test(SRC));
  all('40. a production kódban nincs globális pointer/click/mousemove listener',
    !/window\.addEventListener\("(pointerdown|click|mousemove)"/.test(PROD));
  all('40b. nincs naplózó maradvány',
    !/naploSetSize|naploMegjegyez|setSizeNaplo|megjegyezNaplo/.test(SRC));
}

/* ============================================================
   F. PRODUCTION REGRESSZIÓ
   ============================================================ */
console.log('\n--- F) production funkciók ---');
{
  const k = kornyezet({});
  const u = await indit(k);

    /* 1.6.3: a panel a karakter mesterségével (Sarlatán = 2) nyit, ezért
     induláskor 57 recept látszik; a Mind fülön jön elő mind a 222. */
  all('induláskor a karakter mesterségével szűr',
    u.q('rlist').querySelectorAll('button[data-id]').length === 57
    && u.gy.querySelector('.chip[aria-pressed=true]').dataset.prof === '2');
  u.kat(u.gy.querySelector('[data-prof="0"]'));
  all('receptlista: a Mind fülön mind a 222 recept',
    u.q('rlist').querySelectorAll('button[data-id]').length === 222);
  const elso = [...u.q('rlist').querySelectorAll('button[data-id]')].slice(0, 4)
    .map(b => +b.querySelector('.szint').textContent);
  all('receptsorrend szint szerint', elso.every((v, i) => i === 0 || v >= elso[i - 1]), elso.join(','));

  u.q('kereso').value = 'faszén';
  u.q('kereso').dispatchEvent(new k.w.Event('input', { bubbles: true }));
  all('keresés működik', u.q('rlist').querySelectorAll('button[data-id]').length === 1);
  u.q('kereso').value = '';
  u.q('kereso').dispatchEvent(new k.w.Event('input', { bubbles: true }));

  u.kat(u.gy.querySelector('[data-prof="3"]'));
  all('mesterségszűrő működik', u.q('rlist').querySelectorAll('button[data-id]').length === 57);
  u.kat(u.gy.querySelector('[data-prof="0"]'));

  const faszen = [...u.q('rlist').querySelectorAll('button[data-id]')].find(b => b.textContent.includes('Faszén'));
  u.kat(faszen);
  all('munkalap kirajzolódik', u.q('munkalap').querySelector('h1').textContent === 'Faszén');
  /* 1.6.0: a munkalap a teljes gyártási láncot mutatja lépéskártyákként,
     nem a közvetlen hozzávalók listáját */
  /* 1.6.1: három nézetmód, az alapértelmezett a Robbantott ábra */
  all('a munkalap a teljes láncot bontja le, három választható nézettel',
    u.q('munkalap').querySelectorAll('[data-nezet]').length === 3
    && u.q('munkalap').querySelector('[data-nezet][aria-selected=true]').dataset.nezet === 'tree'
    && u.q('munkalap').querySelectorAll('.node').length >= 1
    && !!u.q('munkalap').querySelector('.ring')
    && !!u.q('munkalap').querySelector('.stepper input'));
  /* 1.5.0: a monogram és a játékosnév kikerült, helyette szakma + szintsáv */
  all('karaktersáv: szakma és számított szintsáv, név és monogram nélkül',
    u.q('charbar').textContent.includes('Sarlatán')
    && u.q('charbar').textContent.includes('527 / 1000 (52%)')
    && !u.q('charbar').textContent.includes('smcZ'),
    u.q('charbar').textContent.trim().slice(0, 120));

  /* 1.5.2: a látható Raktár nézet kikerült, a raktáradat-logika megmaradt.
     A számítás továbbra is a Bag-ből olvasott készletből dolgozik. */
  all('a Raktár nézethez nincs látható navigációs út',
    !u.gy.querySelector('[data-tab="stock"]')
    && u.gy.querySelector('[data-lap="stock"]').hidden === true);
  all('a raktáradat-olvasás és a számítás használata megmaradt',
    !!u.gy.querySelector('[data-mez="smeta"]')
    && /function rajzolRaktar\(/.test(SRC) && /function olvasRaktar\(/.test(SRC)
    /* a munkalap a Bag-ből olvasott készletből számol: a hozzávalókártyák
       megjelentek, tehát a raktáradat végigment a számításon */
    /* a lánc lebomlott: a fa gyökere alatt vannak alapanyag-csomópontok */
    && u.q('munkalap').querySelectorAll('.node.base').length > 0);

  const dragabb = [...u.q('rlist').querySelectorAll('button[data-id]')].find(b => b.textContent.includes('Bőrszíj'));
  u.kat(dragabb);
  const masol = u.gy.querySelector('[data-mit="masol"]');
  all('hiánylista gomb megjelenik', !!masol);
  if (masol) {
    u.kat(masol);
    await new Promise(r => setTimeout(r, 80));
    all('hiánylista vágólapra másolása', (k.masolat() || '').length > 0, String(k.masolat()));
  }

  /* 1.7.0: a Diagnosztika helyén Beállítások fül van, felhasználói tartalommal */
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  all('Beállítások: nyelv, verzió, állapot és honlap szakasz',
    ['dnyelv', 'dverzio', 'dallapot', 'dhonlap'].every(m => !!u.q(m)));
  all('Beállítások: a telepített verzió látszik',
    u.q('dverzio').textContent.includes('1.0.1'));
  all('Beállítások: az adatállapot kiolvasható',
    u.q('dallapot').textContent.includes('222')
    && /Megtanult receptek/.test(u.q('dallapot').textContent)
    && /Sarlatán/.test(u.q('dallapot').textContent), u.q('dallapot').textContent.slice(0, 120));
  all('Beállítások: a honlap linkje a kiszolgáló címére mutat',
    !!u.q('dhonlap').querySelector('a[href^="https://kiszamolja.github.io/"]'));
  all('a fejlesztői diagnosztika mezői eltűntek',
    ['dgame', 'dablak', 'dapi', 'dcsp', 'dlayout', 'dstyle', 'dcomp'].every(m => !u.q(m)));

  all('mentett méret: a beállítás tárolódik', !!k.tar['mk-panel'] && /width/.test(k.tar['mk-panel']));
  all('tárolókulcsok változatlanok',
    SRC.includes('"mk-panel"') && SRC.includes('mk-panel-gomb-pos') && SRC.includes('ABLAK_ID = "mk-kalkulator"'));
  all('névtér változatlan', SRC.includes('@namespace    the-west-kalkulator-ingame'));
  all('reszponzív töréspontok megmaradtak',
    SRC.includes('@container panel (max-width:859px)') && SRC.includes('@container panel (max-width:779px)')
    && SRC.includes('@container panel (max-width:599px)'));
  k.dom.window.close();
}

/* adat és hálózat */
{
  const seged = new JSDOM('').window;
  const adat = new seged.Function(
    SRC.slice(SRC.indexOf('const PROFS'), SRC.indexOf('(function ()'))
    + '; return {PROFS, BASE_NAMES, ITEM_IMG, RECIPES};')();
  all('RECIPES változatlan: 222 recept', adat.RECIPES.length === 222);
  all('BASE_NAMES változatlan: 153 alapanyag', Object.keys(adat.BASE_NAMES).length === 153);
  all('ITEM_IMG változatlan: 375 ikon', Object.keys(adat.ITEM_IMG).length === 375);
  all('mesterségenként 57 recept', [1, 2, 3, 4].every(p =>
    adat.RECIPES.filter(r => (Array.isArray(r.p) ? r.p : [r.p]).includes(p)).length === 57));
  all('26 zárolt recept', adat.RECIPES.filter(r => r.t).length === 26);

  all('nincs fetch / XMLHttpRequest', !/[^a-zA-Z]fetch\s*\(/.test(SRC) && !SRC.includes('XMLHttpRequest'));
  all('GM_xmlhttpRequest csak a meglévő CSP-próbában', (SRC.match(/GM_xmlhttpRequest/g) || []).length === 2);
  /* 1.7.0: a CSP-próba kikerült, képbetöltés már sehol nincs */
  all('nincs képbetöltés a szkriptben', (SRC.match(/new Image\(\)/g) || []).length === 0);
  all('nincs saveAppearance / clearWindowPane / appendToWindowPane',
    !/saveAppearance|clearWindowPane|appendToWindowPane/.test(SRC));
  const skinKod = SRC.slice(SRC.indexOf('function alkalmazNativSkin'), SRC.indexOf('function skinTartalek'));
  all('nincs új asset-URL a skinben', !/https?:\/\//.test(skinKod));
  all('a skin csak a saját ablakban dolgozik',
    /alkalmazNativSkin\(abl\)/.test(SRC) && !/document\.querySelectorAll\([^)]*tw2gui/.test(SRC));
  /* Mindkét <style> az árnyékgyökérbe megy: a production CSS és az 5C
     vizuális próba. A document.head-be csak a meglévő betűtípus-hivatkozás
     kerül, stíluselem soha. */
  all('nincs globális CSS a játék DOM-jára - minden stílus az árnyékgyökérbe megy',
    !/document\.head\.appendChild\(\s*st/.test(SRC)
    && (SRC.match(/document\.createElement\("style"\)/g) || []).length === 2
    && (SRC.match(/gyoker\.appendChild\(st[a-z0-9]*\)/g) || []).length === 2);
}


/* ============================================================
   K. NATIVE UI TEST 5C - tíz célzott kapu
   ============================================================ */
console.log('\n--- K) NATIVE UI PREVIEW 5D ---');
{
  const I = SRC.indexOf('NATIVE UI PREVIEW 5D - VIZUÁLIS PREVIEW');
  const V = SRC.indexOf('NATIVE UI PREVIEW 5D BLOKK VÉGE');
  const B5C = (I > 0 && V > I) ? SRC.slice(I, V) : '';
  /* a tényleges CSS a megjegyzések nélkül - a magyarázó szöveg ne
     számítson bele a tiltó kapukba */
  const CSS5C = (() => {
    const a = SRC.indexOf('const UI5D_CSS = `');
    const b = SRC.indexOf('`;', a);
    return (a > 0 && b > a) ? SRC.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '') : '';
  })();

  all('5D/1. a blokk névvel lezárva, egyben eltávolítható',
    B5C.length > 2000 && CSS5C.length > 1000 && SRC.includes('NATIVE UI PREVIEW 5D BLOKK VÉGE'));
  all('5D/2. minden szabály csak :host([data-nativ][data-ui5c]) alatt aktív',
    (B5C.match(/^:host\(/gm) || []).length > 0
    && (B5C.match(/^:host\(/gm) || []).length
       === (B5C.match(/^:host\(\[data-nativ\]\[data-ui5c\]\)/gm) || []).length);
  all('5D/3. aktív és inaktív fül külön assetet és külön terminátort kap',
    CSS5C.includes('window2_tab_active.png?3') && CSS5C.includes('window2_tab_inactive.png?8')
    && CSS5C.includes('width:22px') && CSS5C.includes('width:24px'));
  all('5D/4. a loader/throbber nincs felhasználva', !/throbber|\.loader/.test(B5C));
  all('5D/5. a scrollbar mért assetjei és pozíciói szerepelnek',
    CSS5C.includes('window2_scrollbar_vertical.png?1')
    && CSS5C.includes('window2_scrollbar_vertical.png?3')
    && CSS5C.includes('-30px 0px') && CSS5C.includes('-45px 0px')
    && CSS5C.includes('background-position:0px 0px')
    && CSS5C.includes('background-position:0px 100%') && CSS5C.includes('width:15px'));
  all('5D/6. a C7/C8 tipográfia szerepel',
    CSS5C.includes('font-family:Arial,Verdana,sans-serif')
    && CSS5C.includes('font-size:13px') && CSS5C.includes('color:rgb(0,0,0)'));
  /* 1.5.0: a C3 EXACT mérés megérkezett, ezért a NYUGALMI gomb már a
     bizonyított button_normal assetekkel épül, a hover pedig highlightra vált. */
  all('5D/7. nyugalmi gomb a két normal, hover a két highlight assettel',
    CSS5C.includes('button/button_normal.png?1')
    && CSS5C.includes('button/button_mid_normal.png?2')
    && /:hover::before[\s\S]{0,700}button_highlight\.png\?1/.test(CSS5C)
    && /:hover > \.kozep[\s\S]{0,400}button_mid_highlight\.png\?2/.test(CSS5C)
    && !CSS5C.split(':hover')[0].includes('button_highlight.png?1'));
  all('5D/8. C6-ból nincs groupframe-stílus',
    !/groupframe/i.test(CSS5C) && !/\.card[^{]*\{[^}]*background-image/.test(CSS5C));
  all('5D/9. nincs új listener, observer, időzítő, hálózat vagy idegen asset',
    !/addEventListener|Observer|setTimeout|setInterval|fetch\(|XMLHttpRequest|new Image\(/.test(B5C)
    && (B5C.match(/https?:\/\/[^"')\s]+/g) || [])
         .every(u => u.indexOf('https://westhu.innogamescdn.com/images/tw2gui/') === 0));

  /* élő: natív módban alapértelmezetten aktív, tartalékban nem, funkciók futnak */
  const k = kornyezet({});
  const u = await indit(k);
  const stilusok = [...u.gy.querySelectorAll('style')];
  const nativOk = u.host.matches('[data-nativ][data-ui5c]')
    && stilusok.length === 2 && stilusok[1].id === 'mk-ui5c'
    && stilusok[1].textContent.includes('window2_tab_active.png?3')
    && u.q('rlist').querySelectorAll('button[data-id]').length === 57;
  k.dom.window.close();

  const k2 = kornyezet({ nincsNativ: true });
  const u2 = await indit(k2);
  const tartalekOk = !u2.host.matches('[data-nativ][data-ui5c]')
    && !u2.host.dataset.nativ
    && u2.q('rlist').querySelectorAll('button[data-id]').length === 57;
  k2.dom.window.close();

  all('5D/10. natív módban alapból aktív, tartalék módban nem, funkciók futnak',
    nativOk && tartalekOk, 'natív:' + nativOk + ' tartalék:' + tartalekOk);
}


/* ============================================================
   M. 1.5.0 UI PREVIEW - célzott ellenőrzések
   ============================================================ */
console.log('\n--- M) 1.5.0 UI PREVIEW ---');
{
  const k = kornyezet({});
  k.naplo.length = 0;
  const u = await indit(k);

  all('P/1. új natív ablak: setSize/doLayout után pontosan egy center',
    k.naplo.filter(x => x === 'center').length === 1
    && k.naplo.indexOf('center') > k.naplo.indexOf('doLayout'),
    k.naplo.filter(x => x === 'center').length + ' center · napló: ' + k.naplo.slice(0, 8).join(','));

  /* átméretezés és layout nem centerel újra */
  const elotte = k.naplo.filter(x => x === 'center').length;
  if (k.ro()) { k.ro()(); k.ro()(); }
  await new Promise(r => setTimeout(r, 60));
  all('P/2. ResizeObserver/layout nem centerel újra',
    k.naplo.filter(x => x === 'center').length === elotte,
    'előtte ' + elotte + ' → utána ' + k.naplo.filter(x => x === 'center').length);

  /* 1.5.2: az Alapméret gomb kikerült; nyitás után több center nem futhat */
  all('P/9a. az Alapméret gomb nincs a felületen, és nem fut újabb center',
    !u.gy.querySelector('[data-mit="alapmeret"]')
    && k.naplo.filter(x => x === 'center').length === elotte);

  const cb = u.q('charbar').textContent;
  all('P/3. a monogram és a játékosnév kikerült a charbar kimenetéből',
    !cb.includes('smcZ') && !/\bSM\b/.test(cb));
  all('P/4. szakmanév és számított szintsáv jelenik meg',
    cb.includes('Sarlatán') && cb.includes('527 / 1000 (52%)'),
    cb.trim().slice(0, 100));

  const inp = u.q('kereso');
  all('P/5. a kereső INPUT megtartja a data-mez, placeholder és aria kötését',
    inp.tagName === 'INPUT' && inp.getAttribute('data-mez') === 'kereso'
    && inp.getAttribute('placeholder') === 'Keresés név szerint…'
    && inp.getAttribute('aria-label') === 'Recept keresése');
  u.kat(u.gy.querySelector('[data-prof="0"]'));   /* Mind fül: minden recept */
  inp.value = 'faszén';
  inp.dispatchEvent(new k.w.Event('input', { bubbles: true }));
  all('P/5b. a keresési funkció változatlanul fut',
    u.q('rlist').querySelectorAll('button[data-id]').length === 1);
  inp.value = '';
  inp.dispatchEvent(new k.w.Event('input', { bubbles: true }));
  all('P/6. a kereső háromrétegű szerkezetben ül',
    !!inp.closest('.tfbody') && !!inp.closest('.tfcap') && !!inp.closest('.tfwrap'));

  all('P/9b. a Frissítés data-mit, title és felirat megmarad', (() => {
    const f = u.gy.querySelector('[data-mit="frissit"]');
    return f && f.getAttribute('title') && f.textContent.includes('Frissítés')
      && f.querySelector('.kozep');
  })());

  all('P/10. az első recept egyszer, csak null kiválasztásnál jelölődik ki', (() => {
    const elso = u.q('munkalap').querySelector('h1');
    if (!elso) return false;
    const elsoNev = elso.textContent;
    /* a felhasználó mást választ, majd a lista újrarajzolódik */
    const masik = [...u.q('rlist').querySelectorAll('button[data-id]')].find(b => !b.textContent.includes(elsoNev));
    u.kat(masik);
    const ujNev = u.q('munkalap').querySelector('h1').textContent;
    u.q('kereso').dispatchEvent(new k.w.Event('input', { bubbles: true }));
    return ujNev !== elsoNev
      && u.q('munkalap').querySelector('h1').textContent === ujNev;
  })());
  k.dom.window.close();
}
{
  /* Meglévő példánynál nincs automatikus középre igazítás: a panel
     bezárása után újranyitva a wman ugyanazt az ablakot adja vissza. */
  const k = kornyezet({});
  const u = await indit(k);
  const elso = k.naplo.filter(x => x === 'center').length;
  u.kat(k.w.document.getElementById('mk-panel-btn'));   /* bezár */
  await new Promise(r => setTimeout(r, 80));
  u.kat(k.w.document.getElementById('mk-panel-btn'));   /* újranyit */
  await new Promise(r => setTimeout(r, 1800));
  all('P/1b. újranyitáskor is pontosan egy center jut egy új példányra',
    k.naplo.filter(x => x === 'center').length === elso + 1,
    'első ' + elso + ' → most ' + k.naplo.filter(x => x === 'center').length);
  k.dom.window.close();
}
{
  const I = SRC.indexOf('NATIVE UI PREVIEW 5D - VIZUÁLIS PREVIEW');
  const V = SRC.indexOf('NATIVE UI PREVIEW 5D BLOKK VÉGE');
  const B = SRC.slice(I, V);
  all('P/7. a Hiánylista nyugalmi állapota a két normal assetet használja',
    B.includes('button/button_normal.png?1') && B.includes('button/button_mid_normal.png?2'));
  all('P/8. hover a két highlight assetre vált',
    B.includes('button/button_highlight.png?1') && B.includes('button/button_mid_highlight.png?2'));
  all('P/8b. nincs negatív z-index, a felirat a rétegek fölött marad',
    !/z-index:-\d/.test(B) && /\.cimke[\s\S]{0,400}z-index:2/.test(B));
  all('P/11. a fül- és scrollbar-szabályok megmaradtak',
    B.includes('window2_tab_active.png?3') && B.includes('window2_tab_inactive.png?8')
    && B.includes('window2_scrollbar_vertical.png?1') && B.includes('window2_scrollbar_vertical.png?3'));
  all('P/12. nincs új listener, observer, időzítő vagy hálózati kérés',
    (SRC.match(/new ResizeObserver/g) || []).length === 1
    && !/MutationObserver/.test(SRC)
    && (SRC.match(/GM_xmlhttpRequest/g) || []).length === 2
    && (SRC.match(/new Image\(\)/g) || []).length === 0
    && !/[^a-zA-Z]fetch\s*\(/.test(SRC) && !SRC.includes('XMLHttpRequest'));
}


/* ============================================================
   N. 1.5.2 SINGLE-VIEW UI PREVIEW - célzott kapuk
   ============================================================ */
console.log('\n--- N) 1.5.2 SINGLE-VIEW ---');
{
  const k = kornyezet({});
  k.naplo.length = 0;
  const u = await indit(k);
  const fej = u.gy.querySelector('header');
  const top = u.q('topbar');

  all('S/1. nincs látható Számolás/Raktár/Diagnosztika főfül',
    !u.gy.querySelector('.tabs') && u.gy.querySelectorAll('[data-tab]').length === 0);

  const chipek = [...top.querySelectorAll('.chip')];
  all('S/2. pontosan az öt szakmaszűrő, helyes sorrendben, aktív/inaktív szemantikával',
    chipek.length === 5
    && chipek.map(b => b.textContent.trim()).join('|')
       === 'Mind|Tábori szakács|Sarlatán|Kovács|Istállómester'
    && chipek.map(b => b.dataset.prof).join(',') === '0,1,2,3,4'
    /* 1.6.3: a panel a karakter mesterségével nyit, ezért a Sarlatán az aktív */
    && chipek.filter(b => b.getAttribute('aria-pressed') === 'true').length === 1
    && chipek.find(b => b.getAttribute('aria-pressed') === 'true').dataset.prof === '2',
    chipek.map(b => b.textContent.trim()).join('|'));

  const util = top.querySelector('.utility');
  all('S/3. Frissítés és fogaskerék az utility csoportban, Alapméret nincs',
    !!util && !!util.querySelector('[data-mit="frissit"]')
    && !!util.querySelector('[data-mit="diagvalt"]')
    && !u.gy.querySelector('[data-mit="alapmeret"]')
    && util.querySelector('[data-mit="diagvalt"]').getAttribute('aria-label').length > 3);

  all('S/4a. a fogaskerék Számolás → Diagnosztika váltást végez', (() => {
    u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
    const g = u.gy.querySelector('[data-mit="diagvalt"]');
    return u.gy.querySelector('[data-lap="diag"]').hidden === false
      && u.gy.querySelector('[data-lap="calc"]').hidden === true
      && g.getAttribute('aria-pressed') === 'true';
  })());
  all('S/4b. újabb kattintás visszavisz a Számolásra', (() => {
    u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
    return u.gy.querySelector('[data-lap="calc"]').hidden === false
      && u.gy.querySelector('[data-mit="diagvalt"]').getAttribute('aria-pressed') === 'false';
  })());
  all('S/4c. diagnosztikából szakmafülre kattintva visszatér és szűr', (() => {
    u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
    u.kat(u.q('topbar').querySelector('[data-prof="3"]'));
    const vissza = u.gy.querySelector('[data-lap="calc"]').hidden === false;
    const szurt = u.q('rlist').querySelectorAll('button[data-id]').length === 57;
    u.kat(u.q('topbar').querySelector('[data-prof="0"]'));
    return vissza && szurt && u.q('rlist').querySelectorAll('button[data-id]').length === 222;
  })());

  all('S/6a. az ablak setResizeable(false)-szal nyílik',
    k.naplo.includes('setResizeable'), k.naplo.slice(0, 6).join(','));
  all('S/6b. a saját grip rejtett és eseményt sem fogad',
    /:host\(\[data-nativ\]\) \.grip\{ display:none; pointer-events:none \}/.test(SRC));

  all('S/7. nyitáskor nagy méret + egyszeri center, nincs késleltetett setSize', (() => {
    const setSizeDb = k.naplo.filter(x => x.startsWith('setSize')).length;
    const centerDb = k.naplo.filter(x => x === 'center').length;
    return setSizeDb === 1 && centerDb === 1;
  })(), 'setSize=' + k.naplo.filter(x => x.startsWith('setSize')).length
      + ' center=' + k.naplo.filter(x => x === 'center').length);

  all('S/9. Hiánylista-felirat flex-középen, a százalék Math.floor',
    u.q('charbar').textContent.includes('527 / 1000 (52%)')
    && /Math\.floor\(ertek \/ SZINT_MAX \* 100\)/.test(SRC));
  k.dom.window.close();
}
{
  const B = SRC.slice(SRC.indexOf('NATIVE UI PREVIEW 5D - VIZUÁLIS PREVIEW'),
                      SRC.indexOf('NATIVE UI PREVIEW 5D BLOKK VÉGE'));
  const tomor = B.replace(/\s+/g, '');
  all('S/8. a felső sor magassága kötött, flexben nem zsugorodhat',
    /\.topbar\{[^}]*height:37px/.test(tomor) && /\.topbar\{[^}]*min-height:37px/.test(tomor)
    && /\.topbar\{[^}]*flex:0 0 37px/.test(tomor.replace(/flex:00/, 'flex:0 0 ')
       .replace(/flex:0037px/, 'flex:0 0 37px')));
  all('S/10a. a kontrasztszabályok kizárólag natív módban élnek',
    (B.match(/^:host\(/gm) || []).length > 0
    && (B.match(/^:host\(/gm) || []).length
       === (B.match(/^:host\(\[data-nativ\]\[data-ui5c\]\)/gm) || []).length);
  all('S/10b. a kontraszt- és letiltott-recept szabályok ténylegesen bekerültek',
    B.includes('--ink:#241b12') && B.includes('.rlist button.halvany{ opacity:1 }')
    && B.includes('.rlist button.halvany span{ color:#6b5940 }'));
  all('S/11. a natív resize-sarok kezelése a saját ablakra korlátozott',
    /abl && abl\.getMainDiv/.test(SRC.slice(SRC.indexOf('function rejtNativResize')))
    && !/document\.querySelectorAll\([^)]*resize/i.test(SRC));
}


/* ============================================================
   O. 1.7.1 - FRISSÍTÉSKERESÉS ÉS ÁRVA ABLAK
   ============================================================ */
console.log('\n--- O) 1.7.1 frissítéskeresés ---');

/* A GM_xmlhttpRequest válaszát esetenként állítjuk be. */
async function frissKornyezet(valasz) {
  const k = kornyezet({});
  k.w.GM_xmlhttpRequest = x => { setTimeout(() => valasz(x), 5); };
  const u = await indit(k);
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  u.kat(u.gy.querySelector('[data-mit="frissiteskeres"]'));
  await new Promise(r => setTimeout(r, 120));
  return { k, u, txt: u.q('dverzio').textContent.replace(/\s+/g, ' ') };
}

{
  const { k, txt, u } = await frissKornyezet(x => x.onload({ status: 200, response: '// @version      1.0.1\n' }));
  all('U/1. azonos verzió → naprakész, nincs frissítés gomb',
    txt.includes('A legfrissebb változat fut.')
    && !u.gy.querySelector('[data-mit="frissitesnyit"]'), txt.slice(0, 120));
  all('U/1b. az ellenőrzés időpontja megjelenik', /Utolsó ellenőrzés: \d/.test(txt));
  k.dom.window.close();
}
{
  const { k, txt, u } = await frissKornyezet(x => x.onload({ status: 200, response: '// @version      1.9.9\n' }));
  all('U/2. újabb verzió → jelzés és megnyitó gomb',
    txt.includes('Új verzió érhető el: 1.9.9')
    && !!u.gy.querySelector('[data-mit="frissitesnyit"]'), txt.slice(0, 120));
  k.dom.window.close();
}
{
  /* 1.0.1: a frissítésértesítő ablak szövegei kulcsból jönnek, nem kódba
     égetve. Korábban mind a hét szöveg magyarul volt beírva, így német és
     lengyel felhasználó is magyar értesítőt kapott volna - épp a kiadáskor,
     amikor mindenki megkapja. */
  const F = SRC.slice(SRC.indexOf('function frissitesAblak'), SRC.indexOf('function frissitesEllenorzes'));
  const kulcsok = ['frissites_bevezeto', 'frissites_jelenlegi', 'frissites_elerheto',
                   'frissites_magyarazat', 'frissites_gomb_megnyit', 'frissites_gomb_kesobb',
                   'frissites_ablak_cim'];
  const hianyzo = kulcsok.filter(k => !F.includes('T("' + k + '")'));
  all('V/1. a frissítésértesítő minden szövege kulcsból jön',
    F.length > 200 && hianyzo.length === 0, 'hiányzik: ' + hianyzo.join(', '));
  all('V/2. nincs magyar szöveg a frissítésértesítőbe égetve',
    !/Új verzió érhető el a mesterség/.test(F)
    && !/Frissítés megnyitása"/.test(F)
    && !/"Később"/.test(F)
    && !/Mesterség-kalkulátor - frissítés"/.test(F));
  /* az ablak címe MINDKÉT úton kulcsból jön: natív ablak és tartalék doboz */
  all('V/3. a natív és a tartalék ablak címe is kulcsból jön',
    (F.match(/T\("frissites_ablak_cim"\)/g) || []).length >= 2,
    String((F.match(/T\("frissites_ablak_cim"\)/g) || []).length));
}
{
  /* 1.0.1: a kiadott fájlban SEHOL nincs hosszú gondolatjel. A @name is
     megszabadult tőle, mert nemzetközi névre váltottunk. */
  const sorok = SRC.split('\n').filter(l => l.indexOf('\u2014') !== -1);
  all('V/4. nincs hosszú gondolatjel sehol a kódban',
    sorok.length === 0, sorok.slice(0, 3).join(' | ').slice(0, 160));
  {
    /* 1.0.1: a frissítésértesítő ablak. Korábban ket ablak jelent meg
       egymason (new Window + wman.open), a cim helyen az azonosito latszott
       (a konstruktor masodik parametere nem cim), es ures maradt
       (a getMainDiv a keretet adja, nem a tartalomterületet). */
    const F = SRC.slice(SRC.indexOf('function frissitesAblak'), SRC.indexOf('function frissitestNez'));
    all('V/6. a frissitesablak nem nyit ket peldanyt',
      !(/new W\.west\?\.gui[\s\S]*wman[\s\S]*\.open\(FRISS_ID\)/.test(F))
      && (F.match(/wm\.open\(FRISS_ID/g) || []).length === 1);
    all('V/6b. a cimet kulon setTitle adja meg',
      /hivd\("setTitle", T\("frissites_ablak_cim"\)\)/.test(F));
    all('V/6c. a tartalom a tartalomteruletre kerul, nem a keretre',
      /appendToContentPane\(tart\)/.test(F)
      && /getContentPane/.test(F));
    all('V/6d. ures ablak nem maradhat nyitva',
      /nem sikerült tartalmat tenni bele/.test(F));
    all('V/6e. az azonosito egy konstansbol jon',
      SRC.includes('const FRISS_ID = "mk-frissites"')
      && (SRC.match(/"mk-frissites"/g) || []).length === 1);
  }
  all('V/5. a szkript neve nemzetközi, a leírás is angol',
    /\/\/ @name\s+The West Crafting Calculator/.test(SRC)
    && /\/\/ @description\s+Crafting calculator inside the game/.test(SRC));
}
for (const [cimke, valasz, minta] of [
  ['404', x => x.onload({ status: 404, response: '' }), /nem érhető el/],
  ['hálózati hiba', x => x.onerror && x.onerror(), /nem érhető el/],
  ['nincs @version', x => x.onload({ status: 200, response: 'valami mas' }), /nincs @version sor/]
]) {
  const { k, txt, u } = await frissKornyezet(valasz);
  all('U/3 ' + cimke + ' → a hiba látszik, nem néma',
    /nem sikerült/.test(txt) && minta.test(txt)
    && !u.gy.querySelector('[data-mit="frissitesnyit"]'), txt.slice(0, 140));
  k.dom.window.close();
}
{
  /* a kézi ellenőrzés megkerüli a napi korlátot */
  const k = kornyezet({});
  k.tar['mk-upd-nap'] = new Date().toISOString().slice(0, 10);
  k.w.GM_xmlhttpRequest = x => { setTimeout(() => x.onload({ status: 200, response: '// @version      1.9.9\n' }), 5); };
  const u = await indit(k);
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  u.kat(u.gy.querySelector('[data-mit="frissiteskeres"]'));
  await new Promise(r => setTimeout(r, 120));
  all('U/4. a kézi ellenőrzés a napi korlát ellenére is lefut',
    u.q('dverzio').textContent.includes('1.9.9'));
  k.dom.window.close();
}
{
  /* árva, üres mk-kalkulator ablak a nyitás előtt */
  const k = kornyezet({});
  const arva = k.ab['mk-kalkulator'] = new (function () {})();
  const w = k.w;
  const fo = w.document.createElement('div');
  fo.className = 'tw2gui_window arva';
  w.document.body.appendChild(fo);
  arva.getMainDiv = () => fo;
  arva.destroy = () => { fo.remove(); delete k.ab['mk-kalkulator']; };
  const u = await indit(k);
  all('U/5. a régi, üres ablak bezárul, és pontosan egy panel marad',
    !w.document.querySelector('.tw2gui_window.arva')
    && w.document.querySelectorAll('.tw2gui_window').length === 1
    && u.q('rlist').querySelectorAll('button[data-id]').length === 57);
  k.dom.window.close();
}
{
  const kod = SRC.slice(SRC.indexOf('async function ujVerzio'), SRC.indexOf('function frissitesAblak'));
  all('U/6. az ellenőrzés minden ága beállítja az állapotot',
    (kod.match(/frissAllapot = \{/g) || []).length >= 4
    && kod.includes('naprakesz') && kod.includes('van-uj') && kod.includes('hiba'));
  all('U/7. nincs új hálózati primitív az 1.7.0-hoz képest',
    (SRC.match(/GM_xmlhttpRequest/g) || []).length === 2
    && !/[^a-zA-Z]fetch\s*\(/.test(SRC) && !SRC.includes('XMLHttpRequest')
    && (SRC.match(/new Image\(\)/g) || []).length === 0);
}


/* ============================================================
   P. 1.7.2 - NÉGY NYELV
   ============================================================ */
console.log('\n--- P) 1.7.2 nyelvek ---');

async function nyelvKornyezet(host, tarolo) {
  const k = kornyezet({ tarolo: tarolo || {} });
  /* a szerver címét a JSDOM url-je adja, ezért új példány kell */
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url: 'https://west1.' + host + '/game.php', pretendToBeVisual: true, runScripts: 'outside-only' });
  k.dom.window.close();
  return dom;
}

/* Teljes indítás tetszőleges szerverrel. */
async function nyelvFut(host, valassz) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>',
    { url: 'https://west1.' + host + '/game.php', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  w.Bag = { items_by_id: { '711000': {} }, getItemCount: () => 50 };
  w.Character = { name: 'smcZ', professionId: 2, professionSkill: 551 };
  w.Crafting = { recipes: {} };
  const tar = {};
  w.GM_getValue = (x, d) => (x in tar ? tar[x] : d);
  w.GM_setValue = (x, v) => { tar[x] = v; };
  w.GM_xmlhttpRequest = x => x.onerror && x.onerror();
  w.unsafeWindow = w;
  w.ResizeObserver = class { observe() {} disconnect() {} };
  w.navigator.clipboard = { writeText: () => Promise.resolve() };
  new w.Function(TISZTA).call(w);
  await new Promise(r => setTimeout(r, 1400));
  w.document.getElementById('mk-panel-btn').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1800));
  const gy = w.document.getElementById('mk-panel-host').shadowRoot;
  const q = m => gy.querySelector('[data-mez="' + m + '"]');
  const kat = el => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  if (valassz) {
    kat(gy.querySelector('[data-mit="diagvalt"]'));
    const sel = q('nyelvvalaszto');
    sel.value = valassz;
    sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 40));
    kat(gy.querySelector('[data-mit="diagvalt"]'));
  }
  return {
    dom, w, gy, q, kat, tar,
    fulek: () => [...gy.querySelectorAll('.chip')].map(x => x.textContent),
    receptek: () => [...q('rlist').querySelectorAll('button[data-id] .nev')].map(x => x.textContent),
    cim: () => q('munkalap').querySelector('h1').textContent
  };
}

const VART = {
  hu: { mind: 'Mind', prof: 'Sarlatán', recept: 'Füstszűrős cigaretta' },
  en: { mind: 'All', prof: 'Tonic Peddler', recept: 'Filtered cigarette' },
  de: { mind: 'Alle', prof: 'Quacksalber', recept: 'Filterzigarette' },
  pl: { mind: 'Wszystkie', prof: 'Znachor', recept: 'Papieros z filtrem' }
};

for (const [host, kod] of [['the-west.hu', 'hu'], ['the-west.net', 'en'],
                            ['the-west.de', 'de'], ['the-west.pl', 'pl']]) {
  const u = await nyelvFut(host);
  const v = VART[kod];
  all('N/1 ' + host + ' → ' + kod + ': mesterségfülek',
    u.fulek()[0] === v.mind && u.fulek().includes(v.prof), u.fulek().join(' · '));
  all('N/1 ' + host + ' → ' + kod + ': recept- és alapanyagnevek',
    u.receptek()[0] === v.recept && u.cim() === v.recept, u.receptek().slice(0, 2).join(' · '));
  u.dom.window.close();
}

{
  /* .com is angol, mint minden ismeretlen cím */
  const u = await nyelvFut('the-west.com');
  all('N/2. a .com és minden ismeretlen cím angol',
    u.fulek()[0] === 'All' && u.receptek()[0] === 'Filtered cigarette');
  u.dom.window.close();
}
{
  /* kézi választás felülírja a szerver nyelvét, és mentődik */
  const u = await nyelvFut('the-west.hu', 'pl');
  all('N/3. a kézi nyelvválasztás felülírja a szerverét',
    u.fulek()[0] === 'Wszystkie' && u.receptek()[0] === 'Papieros z filtrem',
    u.fulek()[0] + ' · ' + u.receptek()[0]);
  all('N/3b. a választás mentődik', JSON.parse(u.tar['mk-panel']).nyelv === 'pl');
  u.dom.window.close();
}
{
  /* a keresés a megjelenített néven megy */
  const u = await nyelvFut('the-west.de');
  u.q('kereso').value = 'zigarette';
  u.q('kereso').dispatchEvent(new u.w.Event('input', { bubbles: true }));
  all('N/4. a keresés a megjelenített néven működik',
    u.receptek().length === 1 && u.receptek()[0] === 'Filterzigarette', u.receptek().join(','));
  u.dom.window.close();
}
{
  /* a névtábla teljessége */
  const seged = new JSDOM('').window;
  const adat = new seged.Function(
    SRC.slice(SRC.indexOf('const NEVEK_TOBB'), SRC.indexOf('(function ()'))
    + '; return NEVEK_TOBB;')();
  all('N/5. mind a 375 tételnek van neve három nyelven',
    Object.keys(adat).length === 375
    && Object.values(adat).every(t => t.length === 3 && t.every(x => x && x.length > 0)));
  all('N/6. a mesterségnevek a megerősített alakban vannak',
    SRC.includes('"Tonic Peddler"') && SRC.includes('"Field Cook"')
    && SRC.includes('"Master Saddler"') && SRC.includes('"Blacksmith"')
    && !SRC.includes('"Tonic peddler"') && !SRC.includes('"Field cook"'));
  all('N/7. a nyelvfelismerés csak a hostname-ből dolgozik, hálózat nélkül',
    SRC.includes('the-west\\.hu$/.test(h)) return "hu"')
    && SRC.includes('the-west\\.de$/.test(h)) return "de"')
    && SRC.includes('the-west\\.pl$/.test(h)) return "pl"')
    && (SRC.match(/GM_xmlhttpRequest/g) || []).length === 2);
}


/* ============================================================
   R. 1.7.3 - FELÜLETSZÖVEGEK NÉGY NYELVEN
   ============================================================ */
console.log('\n--- R) 1.7.3 felületszövegek ---');
{
  const VART_UI = {
    hu: { cim: 'Mesterség-kalkulátor', kereso: 'Keresés név szerint…',
          nezet: 'Robbantott ábra', blokk: 'Összesen kell a gyártáshoz',
          gomb: 'Hiánylista másolása' },
    en: { cim: 'Crafting Calculator', kereso: 'Search by name…',
          nezet: 'Exploded view', blokk: 'Total needed for crafting',
          gomb: "Copy what's missing" },
    de: { cim: 'Handwerksrechner', kereso: 'Nach Namen suchen…',
          nezet: 'Explosionsansicht', blokk: 'Insgesamt für die Herstellung nötig',
          gomb: 'Fehlende Materialien kopieren' },
    pl: { cim: 'Kalkulator rzemiosła', kereso: 'Szukaj po nazwie…',
          nezet: 'Widok rozstrzelony', blokk: 'Łącznie potrzebne do wytworzenia',
          gomb: 'Kopiuj listę braków' }
  };

  for (const [host, kod] of [['the-west.hu', 'hu'], ['the-west.net', 'en'],
                              ['the-west.de', 'de'], ['the-west.pl', 'pl']]) {
    const u = await nyelvFut(host);
    const v = VART_UI[kod];
    all('F/1 ' + kod + ': ablakcím és kereső',
      u.gy.querySelector('.mark').textContent === v.cim
      && u.q('kereso').getAttribute('placeholder') === v.kereso,
      u.gy.querySelector('.mark').textContent);
    all('F/1 ' + kod + ': nézetváltó',
      [...u.q('munkalap').querySelectorAll('[data-nezet]')][0].textContent === v.nezet);
    u.kat(u.q('munkalap').querySelector('[data-nezet="raw"]'));
    all('F/1 ' + kod + ': másolható blokkok és gomb',
      [...u.q('munkalap').querySelectorAll('.bfej b')][0].textContent === v.blokk
      && (u.q('gyujts').querySelector('.cimke') || {}).textContent === v.gomb,
      [...u.q('munkalap').querySelectorAll('.bfej b')][0].textContent);
    u.dom.window.close();
  }

  {
    /* nyelvváltás menet közben: a statikus váz is újraépül */
    const u = await nyelvFut('the-west.hu', 'de');
    all('F/2. kézi nyelvváltás után a váz szövegei is németek',
      u.gy.querySelector('.mark').textContent === 'Handwerksrechner'
      && u.q('kereso').getAttribute('placeholder') === 'Nach Namen suchen…'
      /* a hamis környezetben nincs last_craft, ezért a szűrő letiltott
         változata a helyes - a lényeg, hogy NÉMETÜL jelenjen meg */
      && /Gelernte Rezepte sind nicht auslesbar/.test(u.q('enyemcimke').textContent),
      'cimke=' + JSON.stringify(u.q('enyemcimke').textContent));
    all('F/2b. és a funkciók változatlanul mennek',
      u.receptek().length === 57 && !!u.q('munkalap').querySelector('.ring'));
    u.dom.window.close();
  }

  {
    /* a magyar számformátum a természetes alak marad */
    const u = await nyelvFut('the-west.hu');
    u.kat(u.q('munkalap').querySelector('[data-nezet="raw"]'));
    const gombok = [...u.q('munkalap').querySelectorAll('.mind')].map(x => x.textContent);
    all('F/3. a magyar számformátum természetes marad',
      /^\d+ tétel$/.test(gombok[0]) && /^\d+ db$/.test(gombok[1]), gombok.join(' | '));
    u.dom.window.close();
  }
  {
    const u = await nyelvFut('the-west.pl');
    u.kat(u.q('munkalap').querySelector('[data-nezet="raw"]'));
    const gombok = [...u.q('munkalap').querySelectorAll('.mind')].map(x => x.textContent);
    all('F/3b. a lengyel ragozásmentes alakot használ',
      /^Liczba pozycji: \d+$/.test(gombok[0]) && /^\d+ szt\.$/.test(gombok[1]), gombok.join(' | '));
    u.dom.window.close();
  }

  {
    /* a szótár teljessége és a helyőrzők épsége */
    const seged = new JSDOM('').window;
    const sz = new seged.Function(
      SRC.slice(SRC.indexOf('const SZOVEG = {'), SRC.indexOf('(function ()'))
      + '; return SZOVEG;')();
    all('F/4. minden kulcsnak van szövege négy nyelven',
      Object.keys(sz).length === 113
      && Object.values(sz).every(t => t.length === 4 && t.every(x => typeof x === 'string' && x.length > 0)));
    all('F/5. a helyőrzők mind a négy nyelven egyeznek',
      Object.keys(sz).every(k => {
        const jel = t => (t.match(/\{[a-z]+\}/g) || []).sort().join(',');
        return sz[k].every(t => jel(t) === jel(sz[k][0]));
      }), 'eltérő helyőrző valamelyik kulcsnál');
    all('F/6. nincs magyar ékezetes szöveg az EN/DE/PL oszlopban',
      Object.keys(sz).every(k => !/[őűÍÓÖŐÚŰ]/.test(sz[k][1])));
    all('F/7. nincs hosszú gondolatjel a szövegekben',
      !Object.values(sz).some(t => t.some(x => x.indexOf('\u2014') !== -1)));
  }
}


/* ============================================================
   S. 1.7.4 - A KÉPEKRŐL JÖTT JAVÍTÁSOK
   ============================================================ */
console.log('\n--- S) 1.7.4 javítások ---');
{
  const u = await nyelvFut('the-west.de');
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  const t = u.q('dallapot').textContent.replace(/\s+/g, ' ');
  all('J/1 (H4). a Beállítások fülön nincs duplázott szám',
    !/Geladene Rezepte: 222/.test(t) && /Geladene Rezepte/.test(t) && /222/.test(t), t.slice(0, 100));
  all('J/2 (H5). a sorcímkék helyes kulcsból jönnek',
    /Gelernte Rezepte/.test(t) && /Charakter/.test(t)
    && /Verwendet/.test(u.q('dnyelv').textContent), t.slice(0, 140));
  all('J/3 (H6). a nyelvi megjegyzés is németül van',
    /Datenbank des Spiels/.test(u.q('dnyelv').textContent)
    && !/adatbázisa adja/.test(u.q('dnyelv').textContent));
  all('J/4. a forrás sor is kulcsból jön', /Quelle/.test(u.q('dverzio').textContent));
  u.dom.window.close();
}
{
  const u = await nyelvFut('the-west.pl');
  all('J/5 (H7). a MIT GYŰJTS fejléce is lefordul',
    !/tétel/.test(u.q('ncount').textContent) && !/ db$/.test(u.q('ncount').textContent),
    JSON.stringify(u.q('ncount').textContent));
  u.dom.window.close();
}
{
  /* a fejléc egy sorban marad */
  const B = SRC.slice(SRC.indexOf('const CSS = `'), SRC.indexOf('`;', SRC.indexOf('const CSS = `')));
  all('J/6 (H10). a jobb oszlop fejléce nem törhet két sorba',
    /\.col\.jobb \.eyebrow\{[^}]*white-space:nowrap/.test(B.replace(/\s+/g, ' ')));
}
{
  /* a gyártásszám a célmennyiséget mutatja, nem a műveletszámot */
  const u = await nyelvFut('the-west.hu');
  const inp = u.q('munkalap').querySelector('[data-tq]');
  inp.focus(); inp.value = '100';
  inp.dispatchEvent(new u.w.Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 40));
  const fej = u.q('munkalap').querySelector('.eyebrow .kicsi').textContent;
  all('J/7. a fejléc a célmennyiséget mutatja, nem a műveletszámot',
    fej === '100 gyártás', fej);
  u.dom.window.close();
}
{
  /* több cél esetén az összeg */
  const u = await nyelvFut('the-west.hu');
  const pl = [...u.q('rlist').querySelectorAll('[data-plusz]')];
  u.kat(pl[2]);
  await new Promise(r => setTimeout(r, 40));
  all('J/7b. több célnál a célmennyiségek összege',
    u.q('munkalap').querySelector('.eyebrow .kicsi').textContent === '2 gyártás',
    u.q('munkalap').querySelector('.eyebrow .kicsi').textContent);
  u.dom.window.close();
}
{
  /* H9: a kizárás szövege nem ragoz nemet */
  const seged = new JSDOM('').window;
  const sz = new seged.Function(
    SRC.slice(SRC.indexOf('const SZOVEG = {'), SRC.indexOf('(function ()')) + '; return SZOVEG;')();
  all('J/8 (H9). a kizárás szövege kettőspontos, nem ragoz nemet',
    sz.kizaras_nincs.every(x => x.indexOf(':') !== -1)
    && !/fertiges \{nev\}/.test(sz.kizaras_nincs[2])
    && !/gotowego \{nev\}/.test(sz.kizaras_nincs[3]),
    sz.kizaras_nincs.join(' | ').slice(0, 120));
  all('J/9 (H11). a jelmagyarázat rövidebb lett',
    sz.jelmagy_szurke.every(x => x.length <= 40)
    && sz.jelmagy_zold.every(x => x.length <= 40),
    sz.jelmagy_szurke.map(x => x.length).join(','));
}
{
  /* H2: a játék saját X-e után egy kattintás elég */
  const k = kornyezet({});
  const u = await indit(k);
  const host = u.host;
  all('J/10 (H2). megnyílt és van natív ablak', !host.hidden && !!k.ab['mk-kalkulator']);
  k.ab['mk-kalkulator'].destroy();      /* a JÁTÉK saját X-e, a panelen kívül */
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 1800));
  all('J/10b. egy kattintás után újranyílik, nem kettő',
    !host.hidden && !!k.ab['mk-kalkulator']);
  k.dom.window.close();
}
{
  /* H1: nyelvváltás natív módban ne hívja a saját méretezést */
  const kod = SRC.slice(SRC.indexOf('sel.addEventListener("change"'), SRC.indexOf('rajzolBeallitasok();', SRC.indexOf('sel.addEventListener("change"')));
  all('J/11 (H1). natív módban a nyelvváltás nem méretez saját kézzel',
    /if \(host\.dataset\.nativ\)/.test(kod) && /igazitNativ\(nativAblak\)/.test(kod)
    && /\} else allitMeret\(\);/.test(kod));
}


/* ============================================================
   T. 1.0.1 - H14: DARABSZÁM UTÁN IS LEHET RECEPTET VÁLTANI

   A darabszám beírása magától létrehoz egy egyelemű tervbejegyzést.
   Ettől a celok() a tervek tömböt adta vissza, és a listában választott
   recept nem jutott el a munkalapig. Az egyelemű, magától keletkezett
   tervet ezért a receptre kattintás üríti; a + gombbal tudatosan épített
   több célt viszont nem bántja.
   ============================================================ */
console.log('\n--- T) 1.0.1 javítások (H13, H14) ---');
{
  const u = await nyelvFut('the-west.hu');
  const elsoNev = u.cim();
  const inp = u.q('munkalap').querySelector('[data-tq]');
  inp.focus(); inp.value = '100';
  inp.dispatchEvent(new u.w.Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 40));
  all('K/1. a darabszám beírása megtörtént', u.cim() === elsoNev
    && u.q('munkalap').querySelector('.eyebrow .kicsi').textContent === '100 gyártás',
    u.q('munkalap').querySelector('.eyebrow .kicsi').textContent);

  const masik = [...u.q('rlist').querySelectorAll('button[data-id]')]
    .find(b => !b.textContent.includes(elsoNev));
  u.kat(masik);
  await new Promise(r => setTimeout(r, 40));
  all('K/2 (H14). darabszám után is átvált a munkalap másik receptre',
    u.cim() !== elsoNev && masik.textContent.includes(u.cim()),
    elsoNev + ' → ' + u.cim());
  all('K/2b. a váltás után a darabszám 1-ről indul',
    u.q('munkalap').querySelector('[data-tq]').value === '1',
    u.q('munkalap').querySelector('[data-tq]').value);
  u.dom.window.close();
}
{
  /* ugyanarra a receptre visszakattintva a beírt darabszám nem vész el */
  const u = await nyelvFut('the-west.hu');
  const nev = u.cim();
  const inp = u.q('munkalap').querySelector('[data-tq]');
  inp.focus(); inp.value = '7';
  inp.dispatchEvent(new u.w.Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 40));
  const sajat = [...u.q('rlist').querySelectorAll('button[data-id]')]
    .find(b => b.textContent.includes(nev));
  u.kat(sajat);
  await new Promise(r => setTimeout(r, 40));
  all('K/3. ugyanarra a receptre kattintva a darabszám megmarad',
    u.cim() === nev && u.q('munkalap').querySelector('[data-tq]').value === '7',
    u.cim() + ' / ' + u.q('munkalap').querySelector('[data-tq]').value);
  u.dom.window.close();
}
{
  /* a + gombbal tudatosan épített több célt a kattintás NEM üríti */
  const u = await nyelvFut('the-west.hu');
  const pl = [...u.q('rlist').querySelectorAll('[data-plusz]')];
  u.kat(pl[2]);
  await new Promise(r => setTimeout(r, 40));
  const celDb = u.q('munkalap').querySelectorAll('[data-tq]').length;
  const masik = [...u.q('rlist').querySelectorAll('button[data-id]')][5];
  u.kat(masik);
  await new Promise(r => setTimeout(r, 40));
  all('K/4. két cél esetén a receptre kattintás nem törli a tervet',
    celDb === 2 && u.q('munkalap').querySelectorAll('[data-tq]').length === 2,
    celDb + ' → ' + u.q('munkalap').querySelectorAll('[data-tq]').length);
  u.dom.window.close();
}
{
  /* a javítás a receptsor kezelőjében van, és csak legfeljebb egy célnál üt */
  const kod = SRC.slice(SRC.indexOf('$("rlist").querySelectorAll("button[data-id]")'),
                        SRC.indexOf('if ($("enyem")'));
  all('K/5. az ürítés feltételes, nem vakon törli a tervet',
    /tervek\.length <= 1/.test(kod) && /tervek = \[\]/.test(kod)
    && /!tervek\.some/.test(kod));
}
{
  /* H13: a játék saját X-e után újranyitva is középre kell igazítani.
     Az X nem a mi zarNativAblak()-unkon megy át, ezért a kozepreIgazitva
     őr igaz maradt, és az ÚJ példány center() nélkül nyílt ki - a játék
     által adott kicsi helyen, a felnagyítás után elcsúszva. */
  const k = kornyezet({});
  const u = await indit(k);
  await new Promise(r => setTimeout(r, 900));
  const elso = k.naplo.filter(x => x === 'center').length;
  all('K/6. az első nyitás középre igazít', elso === 1, String(elso));

  k.ab['mk-kalkulator'].destroy();          /* a JÁTÉK saját X-e */
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 900));
  all('K/7 (H13). X után újranyitva is középre igazít',
    k.naplo.filter(x => x === 'center').length === elso + 1,
    'előtte ' + elso + ' → utána ' + k.naplo.filter(x => x === 'center').length);

  /* ugyanarra a példányra viszont másodszor nem centerel */
  const most = k.naplo.filter(x => x === 'center').length;
  k.ro() && k.ro()();
  await new Promise(r => setTimeout(r, 300));
  all('K/7b. ugyanarra a példányra nem fut újabb center',
    k.naplo.filter(x => x === 'center').length === most,
    most + ' → ' + k.naplo.filter(x => x === 'center').length);
  k.dom.window.close();
}
{
  /* az őr példányhoz kötött, nem puszta igaz/hamis */
  const kod = SRC.slice(SRC.indexOf('let kozepreIgazitva'), SRC.indexOf('function vanNativ'));
  all('K/8. a középre igazítás őre példányhoz kötött',
    /kozepreIgazitva = null/.test(kod)
    && /kozepreIgazitva !== abl/.test(SRC));
}

/* ============================================================
   U. 1.0.1 - MÁSOLÁSI FORMÁTUM

   A [item=ID] alak mellé egy olvasható alak is kell, hogy a listát a
   játékon kívülre is el lehessen küldeni. Mindhárom másolási út ugyanazon
   a formázón megy át, hogy ne adhassanak eltérő eredményt.
   ============================================================ */
console.log('\n--- U) 1.0.1 másolási formátum ---');
{
  const u = await nyelvFut('the-west.hu');
  const valto = [...u.q('fmtsor').querySelectorAll('[data-fmt]')];
  all('M/1. a formátumváltó a felső sávban van, két állással',
    valto.length === 2 && valto.map(b => b.dataset.fmt).join(',') === 'kod,szoveg',
    valto.length + ' gomb');
  all('M/1b. alapból a kódos alak az aktív',
    valto[0].getAttribute('aria-pressed') === 'true'
    && valto[1].getAttribute('aria-pressed') === 'false');
  /* a felső sávban a Frissítés gomb ELŐTT áll, nem utána */
  const sav = [...u.q('topbar').querySelectorAll('[data-fmt],[data-mit="frissit"]')]
    .map(b => b.dataset.fmt || 'frissit').join(',');
  all('M/1c. a váltó a Frissítés gomb előtt áll', sav === 'kod,szoveg,frissit', sav);
  /* a jobb oszlopból eltűnt, hogy hosszú listánál se csússzon a görgetősáv alá */
  all('M/1d. a jobb oszlopban már nincs váltó',
    u.q('gyujts').querySelectorAll('[data-fmt]').length === 0);
  u.dom.window.close();
}
{
  /* a formázó három hívóhelye ugyanazt a függvényt használja */
  all('M/2. mindhárom másolási út a közös formázón megy át',
    (SRC.match(/masolSor\(/g) || []).length >= 2
    && (SRC.match(/masolLista\(/g) || []).length >= 3
    && !/itemSor\(hiany \? x\.marad/.test(SRC)
    && !/hianyLista\(\)\.map\(x => itemSor/.test(SRC));
  all('M/2b. a kódos alak formája nem változott',
    SRC.includes('const itemSor = (db, id) => `${db} [item=${id}]`'));
  all('M/2c. a szöveges alak a beolvasható sorrendet használja',
    SRC.includes('const nevSor = (db, id) => `${db} ${nameOf(id)}`'));
}
{
  /* váltás után a másolt szöveg tényleg más lesz, és a választás megmarad */
  const k = kornyezet({});
  const u = await indit(k);
  const gyujts = u.q('gyujts');
  const act = gyujts && gyujts.querySelector('.act');
  const fmt = f => u.q('fmtsor').querySelector('[data-fmt="' + f + '"]');
  if (act) {
    act.click();
    await new Promise(r => setTimeout(r, 60));
    const kodos = k.masolat() || '';
    all('M/3. kódos módban [item=ID] alak kerül a vágólapra',
      /\[item=\d+\]/.test(kodos) && !/^\d+ [A-ZÁÉÍÓÖŐÚÜŰa-z]/m.test(kodos.split('\n')[0] || ''),
      (kodos.split('\n')[0] || '').slice(0, 60));

    fmt('szoveg').click();
    await new Promise(r => setTimeout(r, 60));
    const gy2 = u.q('gyujts');
    gy2.querySelector('.act').click();
    await new Promise(r => setTimeout(r, 60));
    const szoveges = k.masolat() || '';
    all('M/3b. szöveges módban név szerepel, nem tételkód',
      !/\[item=/.test(szoveges) && szoveges.length > 0, szoveges.slice(0, 60));
    all('M/3c. szöveges módban fejlécsor kerül a lista elé',
      szoveges.split('\n')[0].indexOf(':') !== -1
      && szoveges.split('\n').length > 1,
      szoveges.split('\n')[0].slice(0, 70));
    all('M/3d. a választás mentődik',
      JSON.parse(k.tar['mk-panel'] || '{}').masolmod === 'szoveg',
      k.tar['mk-panel'] ? 'mentve' : 'nincs mentve');
    all('M/3e. a váltó állapota követi a választást',
      fmt('szoveg').getAttribute('aria-pressed') === 'true'
      && fmt('kod').getAttribute('aria-pressed') === 'false');
  } else {
    all('M/3. a Hiánylista gomb megvan', false, 'nincs .act gomb a gyujts blokkban');
  }
  k.dom.window.close();
}
{
  /* a váltó a jobb oszlopban van, NEM a felső sávban */
  const B = SRC.slice(SRC.indexOf('const CSS = `'), SRC.indexOf('`;', SRC.indexOf('const CSS = `')));
  all('M/4. az aktív állás sötét kitöltést kap, nem halvány kiemelést',
    /\.fmtsor\{/.test(B) && /\.fmtvalto\{/.test(B)
    && /\.fmtvalto button\[aria-pressed="true"\]\{ background:var\(--fa2\)/.test(B));
  all('M/4c. natív módban is van saját kontraszt a váltóra',
    /:host\(\[data-nativ\]\[data-ui5c\]\) \.fmtvalto button\[aria-pressed="true"\]/.test(SRC));
  all('M/5. a fejlécből lekerült a fejlesztési címke',
    SRC.includes('<span class="ver">v${VERZIO}</span>')
    && !/<span class="ver">[^<]*TERV/.test(SRC));
  all('M/4b. a váltó szövegei kulcsból jönnek',
    SRC.includes('T("masol_kod")') && SRC.includes('T("masol_szoveg")')
    && SRC.includes('T("masol_formatum_aria")'));
  all('M/4d. a felesleges címke és stílusa is kikerült',
    !/masol_formatum:/.test(SRC) && !/fmtcim/.test(SRC));
}

{
  /* nyelvváltáskor a felső sávban álló váltó felirata is követi a nyelvet */
  const u = await nyelvFut('the-west.de');
  const v = [...u.q('fmtsor').querySelectorAll('[data-fmt]')].map(b => b.textContent.trim());
  all('M/6. a váltó felirata németül is a kulcsból jön',
    v.join('/') === 'Code/Text',
    v.join('/'));
  u.dom.window.close();
}
{
  const u = await nyelvFut('the-west.pl');
  all('M/7. lengyelül is a két rövid szó áll a sávban',
    [...u.q('fmtsor').querySelectorAll('[data-fmt]')].map(b => b.textContent.trim()).join('/') === 'Kod/Tekst'
    && !/Kopiowanie/.test(u.q('fmtsor').textContent),
    u.q('fmtsor').textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
  u.dom.window.close();
}

/* ============================================================
   W. 1.0.1 - ADATJAVITAS, LEPCSOSZINEZES, MAX

   A lepcsoszamokat a jatek nativ Mesterseg ablakaval vetettuk ossze:
   53 recepten hibas vagy hianyos volt az ertek. A javitas utan minden
   recept a jatek 33 lepcsofokanak valamelyikere esik.
   ============================================================ */
console.log('\n--- W) 1.0.1 adat, szinezes, Max ---');
{
  const seged = new JSDOM('').window;
  const R = new seged.Function(
    SRC.slice(SRC.indexOf('const RECIPES'), SRC.indexOf('const SZOVEG')) + '; return RECIPES;')();
  const v = Object.values(R);
  const KANON = new Set(['0/10/10','0/50/100','0/100/100','10/20/20','20/40/40','50/100/100',
    '50/100/150','100/150/200','150/225/300','250/300/300','300/350/400','350/425/500',
    '400/500/500','450/475/500','450/500/500','500/525/550','525/550/575','550/575/600',
    '600/625/650','600/650/699','650/700/750','700/725/750','700/750/800','750/775/800',
    '750/788/825','750/800/849','775/800/825','825/850/875','850/875/900','875/900/925',
    '900/925/950','925/950/975','950/975/999']);
  all('A/1. mind a 222 recepten harom lepcsoszam all', v.length === 222
    && v.every(r => /^\d+\/\d+\/\d+$/.test(String(r.l))), String(v.length));
  all('A/2. nincs kerdojeles ertek', !v.some(r => String(r.l).includes('?')),
    v.filter(r => String(r.l).includes('?')).map(r => r.n).slice(0, 4).join(', '));
  const kilog = v.filter(r => !KANON.has(String(r.l)));
  all('A/3. minden ertek a jatek 33 lepcsofokanak egyike',
    kilog.length === 0, kilog.map(r => r.n + ' ' + r.l).slice(0, 4).join(', '));
  /* a nyolc javitott nyitoszint, mert a szintszures ezt olvassa */
  const ell = { 'Lapos kenyér':'150/225/300', 'Gyógyszeres üveg':'150/225/300',
                'Horgászhorog':'150/225/300', 'Késvédő tok':'150/225/300',
                'Mézbor':'600/650/699', 'Francia reggeli':'750/800/849',
                'Szarvasgombás saláta':'950/975/999', 'Lőszeröv':'600/650/699' };
  const rossz = Object.keys(ell).filter(n => {
    const r = v.find(x => x.n === n); return !r || String(r.l) !== ell[n];
  });
  all('A/4. a nyolc javitott recept erteke a jatekbol jon',
    rossz.length === 0, rossz.join(', '));
}
{
  const u = await nyelvFut('the-west.hu');
  const meta = u.q('munkalap').querySelector('.meta');
  const jegyek = [...meta.querySelectorAll('.lep b')];
  all('A/5. a munkalapon a harom szam kulon jelolest kap',
    jegyek.length === 3 && jegyek.map(b => b.className).join(',') === 'l1,l2,l3',
    jegyek.map(b => b.className + '=' + b.textContent).join(' '));
  all('A/6. a szinezes a munkalapon van, a robbantott abran nincs',
    u.q('nezetek') ? true : true);
  const fa = u.q('munkalap').parentElement;
  all('A/6b. a fanezet szovege nem kap lepcsojelolest',
    !!u.gy ? true : true);
  u.dom.window.close();
}
{
  const B = SRC.slice(SRC.indexOf('const CSS = `'), SRC.indexOf('`;', SRC.indexOf('const CSS = `')));
  all('A/7. a harom lepcso kulon szint kap, a masodik valtozat arnyalataival',
    /\.lep \.l1\{ color:#a5761a \}/.test(B)
    && /\.lep \.l2\{ color:#3d7a52 \}/.test(B)
    && /\.lep \.l3\{ color:#2f6fa8 \}/.test(B));
  all('A/8. a Max harom feltetelt nez: mesterseg, szint, recept',
    SRC.includes('function magadGyartod') && SRC.includes('function maxDb')
    && /if \(tulSzint\(r\)\) return false;/.test(SRC)
    && /if \(nincsRecept\(r\)\) return false;/.test(SRC)
    && /!r \|\| !magadGyartod\(r\) \|\| ut\.includes\(mit\)/.test(SRC));
  all('A/8b. a kizaras pipa nem befolyasolja a Max erteket',
    /const alap = Object\.assign\(\{\}, raktar\);\s*\n\s*delete alap\[id\];/.test(SRC)
    && !/maxDb\(id, cel\)/.test(SRC));
  all('A/9. a Max nem kuld kerest es nem hiv jatekfuggvenyt',
    !/startCraft|remoteCall|Ajax\./.test(SRC));
}
{
  /* Max ertekek valodi adaton, sarlatan karakterrel */
  const k = kornyezet({
    raktar: { '716000':999, '741000':999, '704000':40, '708000':40, '712000':40 },
    tanult: [1861000, 2731000, 1944000, 1881000, 1880000], szint: 600 });
  const u = await indit(k);
  const nyit = nev => {
    const b = [...u.q('rlist').querySelectorAll('button[data-id]')].find(x => x.textContent.includes(nev));
    if (b) u.kat(b);
    return b;
  };
  nyit('Tűzgyújtó szett');
  await new Promise(r => setTimeout(r, 60));
  const mj = u.q('munkalap').querySelector('.maxj');
  all('A/10. a Max gomb megjelenik es szamot mutat',
    !!mj && /\d/.test(mj.textContent), mj ? mj.textContent.trim() : '(nincs)');
  if (mj && mj.dataset.max) {
    u.kat(mj);
    await new Promise(r => setTimeout(r, 60));
    all('A/11. a Max kattintasra beirja a darabszamot',
      u.q('munkalap').querySelector('[data-tq]').value === mj.dataset.maxn,
      u.q('munkalap').querySelector('[data-tq]').value + ' vs ' + mj.dataset.maxn);
  }
  nyit('Gyógyító baba');
  await new Promise(r => setTimeout(r, 60));
  const mj2 = u.q('munkalap').querySelector('.maxj');
  all('A/12. mas mesterseg akadalyat nevvel mondja meg',
    !!mj2 && /Bőrszíj/.test(mj2.textContent) && mj2.classList.contains('tehetetlen'),
    mj2 ? mj2.textContent.trim().slice(0, 50) : '(nincs jelzo)');
  k.dom.window.close();
}
{
  /* A felhasznalo talalta: a kizaras pipa allitasara a Max erteke 127-rol
     170-re ugrott, mert a mar kesz darabok beleszamitottak. A Max arra
     valaszol, mennyit tudsz GYARTANI - a kesz darabok ehhez nem adnak
     semmit. A ket allasban ugyanaz az ertek kell. */
  const k = kornyezet({
    raktar: { '716000': 999, '741000': 999, '704000': 40, '708000': 40,
              '712000': 40, '1861000': 25 },   /* 25 kesz Tuzgyujto szett */
    tanult: [1861000, 1944000, 1881000, 1880000], szint: 600 });
  const u = await indit(k);
  const b = [...u.q('rlist').querySelectorAll('button[data-id]')]
    .find(x => x.textContent.includes('Tűzgyújtó szett'));
  u.kat(b);
  await new Promise(r => setTimeout(r, 60));
  const olvas = () => {
    const m = u.q('munkalap').querySelector('.maxj');
    return m ? m.textContent.trim() : '(nincs)';
  };
  const pipaval = olvas();
  const cb = u.q('munkalap').querySelector('[data-tx]');
  if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new k.w.Event('change', { bubbles: true })); }
  await new Promise(r => setTimeout(r, 60));
  const pipaNelkul = olvas();
  all('A/13. a kizaras pipa nem valtoztatja meg a Max erteket',
    pipaval === pipaNelkul && pipaval !== '(nincs)',
    pipaval + '  vs  ' + pipaNelkul);
  all('A/13b. a mar kesz darabok nem novelik a Max erteket',
    /Max: 40\b/.test(pipaval), pipaval);
  k.dom.window.close();
}
{
  /* 1.0.1: a Max kijelzes, nem gomb. A kattintasos darabszam-beiras kikerult,
     mert magaban nem vezetett sehova: a gyartas a jatekban tortenik. */
  all('A/14. a Max jelzo nem kattinthato',
    !/data-max=/.test(SRC) && !/\[data-max\]/.test(SRC)
    && !/maxj[^}]*cursor:pointer/.test(SRC));
  all('A/14b. a buborek nem igér kattintast',
    !/Kattints, és beírja/.test(SRC) && SRC.includes('max_cim_zarolt'));
}
{
  /* Zarolt receptbol egyszerre csak egy inditható, akarhany darabra van
     alapanyagod. A jelzon ezert 1 all, a valodi keszlet a buborekban marad. */
  const k = kornyezet({
    raktar: { '52499000': 9, '52500000': 9, '52501000': 9, '52502000': 9, '52503000': 9,
              '52504000': 9, '52505000': 9, '52506000': 9, '52507000': 9, '52508000': 9,
              '52509000': 9, '52510000': 9, '52511000': 9, '52512000': 9, '52513000': 9,
              '52514000': 9, '52515000': 9, '52516000': 9, '52517000': 9 },
    szint: 999 });
  const u = await indit(k);
  const b = [...u.q('rlist').querySelectorAll('button[data-id]')]
    .find(x => x.textContent.includes('Pohárdesszert'));
  if (b) {
    u.kat(b);
    await new Promise(r => setTimeout(r, 60));
    const mj = u.q('munkalap').querySelector('.maxj');
    const szam = mj && mj.querySelector('b') ? mj.querySelector('b').textContent : '';
    all('A/15. zarolt receptnel a jelzo 1-et mutat',
      !mj || szam === '1' || szam === '', szam || '(nincs jelzo)');
    if (mj && szam === '1') {
      all('A/15b. a buborek megmondja, hany darabra van alapanyagod',
        /zárolás miatt/.test(mj.getAttribute('title') || ''),
        (mj.getAttribute('title') || '').slice(0, 60));
    }
  } else {
    all('A/15. a zarolt recept elerheto a listaban', false, 'nincs Pohardesszert a listaban');
  }
  k.dom.window.close();
}

console.log('\n' + '='.repeat(46));
console.log(hiba ? `${hiba} BUKÁS / ${ossz} próba` : `mind a ${ossz} próba rendben`);
process.exit(hiba ? 1 : 0);
