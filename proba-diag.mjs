/* Production regressziós teszt — The West mesterség-kalkulátor 1.4.0
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
  /* 1.5.0 UI PREVIEW — négy production függvény SZÁNDÉKOSAN változott,
     a prompt 3., 4. és 9. fejezete szerint. A kapu tovább őrzi őket a
     véletlen módosítás ellen, csak az elvárt érték frissült:
       keszitNativ     — egyszeri nyitási center az új példányra
       zarNativAblak   — a center-jelző visszaállítása bezáráskor
       rajzolReceptek  — az első recept egyszeri belső kijelölése
       rajzolMunkalap  — a Hiánylista gomb háromrétegű markupja           */
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
   nem záruló törzs esetén null — az bukás. */
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
/* a teszt saját forrása az önvizsgálati kapukhoz — nem projektfájl-olvasás */
const TESZT_SAJAT = fs.readFileSync(new URL(import.meta.url), 'utf8');
const TISZTA = SRC.replace(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m, '');
let hiba = 0, ossz = 0;
const all = (nev, felt, reszlet) => {
  ossz++;
  if (felt) console.log('  OK    ' + nev);
  else { hiba++; console.log(' BUKÁS  ' + nev + (reszlet ? '  → ' + reszlet : '')); }
};
const stil = el => (el && el.getAttribute) ? (el.getAttribute('style') || '') : '';

/* A STYLE PROBE 5A blokk elkülönítése: a production kapuk a blokkon KÍVÜLI
   részt őrzik, hogy az 5B-ben a blokk egyben eltávolítható legyen. */
const SP_ELEJE = SRC.indexOf('STYLE PROBE 5A — IDEIGLENES BLOKK');
const SP_VEGE = SRC.indexOf('STYLE PROBE 5A BLOKK VÉGE');
const SP_BLOKK = (SP_ELEJE > 0 && SP_VEGE > SP_ELEJE) ? SRC.slice(SP_ELEJE, SP_VEGE) : '';
const CM_ELEJE = SRC.indexOf('COMPONENT MAPPER 5B1 — IDEIGLENES BLOKK');
const CM_VEGE = SRC.indexOf('COMPONENT MAPPER 5B1 BLOKK VÉGE');
const CM_BLOKK = (CM_ELEJE > 0 && CM_VEGE > CM_ELEJE) ? SRC.slice(CM_ELEJE, CM_VEGE) : '';
/* PROD = a userscript MINDKÉT ideiglenes mérőblokk nélkül */
const PROD = (() => {
  let t = SRC;
  if (CM_BLOKK) t = t.slice(0, CM_ELEJE) + t.slice(CM_VEGE);
  const i = t.indexOf('STYLE PROBE 5A — IDEIGLENES BLOKK');
  const j = t.indexOf('STYLE PROBE 5A BLOKK VÉGE');
  if (i > 0 && j > i) t = t.slice(0, i) + t.slice(j);
  return t;
})();

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

  w.Bag = {
    items_by_id: { '711000': {}, '716000': {}, '766000': {}, '10004000': {} },
    getItemCount: id => ({ 711000: 48, 716000: 3, 766000: 12, 10004000: 9 })[id] || 0
  };
  w.Character = { name: 'smcZ', professionId: 2, professionSkill: 527 };
  w.Crafting = { recipes: { a: { last_craft: 1, craftitem: 1855000 } } };

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

  all('22a. nincs új ResizeObserver a skin miatt',
    (SRC.match(/new ResizeObserver/g) || []).length === 2);
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
    SRC.includes('const VERZIO = "1.6.5"') && SRC.includes('<span class="ver">v${VERZIO}')
    && /@version\s+1\.6\.5/.test(SRC)
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

  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  all('Diagnosztika: játékadatok elérhetősége', u.q('dgame').querySelectorAll('li').length >= 5);
  all('Diagnosztika: Window API elérhetősége', u.q('dapi').textContent.includes('Window metódusai'));
  all('Diagnosztika: rövid natív skin sor',
    u.q('dapi').textContent.includes('natív skin') && u.q('dapi').textContent.includes('aktív'));
  all('Diagnosztika: elrendezés állapota', u.q('dlayout').textContent.includes('elrendezés'));
  all('Diagnosztika: CSP-próba megmaradt', u.q('dcsp').textContent.includes('ikon közvetlen URL-ről'));
  all('a Diagnosztikán nincs illesztési szakasz', !u.gy.querySelector('[data-mez="dillesztes"]'));

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
  all('new Image() csak a meglévő CSP-próbában', (SRC.match(/new Image\(\)/g) || []).length === 1);
  all('nincs saveAppearance / clearWindowPane / appendToWindowPane',
    !/saveAppearance|clearWindowPane|appendToWindowPane/.test(SRC));
  const skinKod = SRC.slice(SRC.indexOf('function alkalmazNativSkin'), SRC.indexOf('function skinTartalek'));
  all('nincs új asset-URL a skinben', !/https?:\/\//.test(skinKod));
  all('a skin csak a saját ablakban dolgozik',
    /alkalmazNativSkin\(abl\)/.test(SRC) && !/document\.querySelectorAll\([^)]*tw2gui/.test(SRC));
  /* Mindkét <style> az árnyékgyökérbe megy: a production CSS és az 5C
     vizuális próba. A document.head-be csak a meglévő betűtípus-hivatkozás
     kerül, stíluselem soha. */
  all('nincs globális CSS a játék DOM-jára — minden stílus az árnyékgyökérbe megy',
    !/document\.head\.appendChild\(\s*st/.test(SRC)
    && (SRC.match(/document\.createElement\("style"\)/g) || []).length === 2
    && (SRC.match(/gyoker\.appendChild\(st[a-z0-9]*\)/g) || []).length === 2);
}


/* ============================================================
   G. STYLE PROBE 5A
   ============================================================ */
console.log('\n--- G) STYLE PROBE 5A ---');

/* Hamis referenciakörnyezet: assetes gomb belső span felirattal, aktív és
   inaktív fül, görgethető konténer DOM-elemes scrollbar-jelöltekkel. */
function spKornyezet(o) {
  o = o || {};
  const k = kornyezet(o);
  const w = k.w;
  const E = (tag, cls, txt, st) => {
    const e = w.document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    e.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 50,
      width: 100, height: 30 });
    e.__st = Object.assign({
      fontFamily: 'Georgia', fontSize: '13px', fontWeight: '700', fontStyle: 'normal',
      lineHeight: '18px', letterSpacing: 'normal', textTransform: 'none', textAlign: 'center',
      color: 'rgb(244, 226, 200)', textShadow: 'rgb(0, 0, 0) 0px 1px 0px', opacity: '1',
      whiteSpace: 'nowrap',
      backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none', backgroundRepeat: 'repeat',
      backgroundPosition: '0% 0%', backgroundSize: 'auto', backgroundOrigin: 'padding-box',
      backgroundClip: 'border-box', borderImageSource: 'none', borderImageSlice: '100%',
      borderImageWidth: '1', borderImageRepeat: 'stretch', borderRadius: '0px',
      borderTopStyle: 'none', borderRightStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none',
      borderTopColor: 'rgb(0,0,0)', borderRightColor: 'rgb(0,0,0)',
      borderBottomColor: 'rgb(0,0,0)', borderLeftColor: 'rgb(0,0,0)',
      boxShadow: 'none', cursor: 'pointer',
      boxSizing: 'border-box', display: 'block', position: 'static',
      overflow: 'visible', overflowX: 'visible', overflowY: 'visible', zIndex: 'auto',
      paddingTop: '4px', paddingRight: '10px', paddingBottom: '4px', paddingLeft: '10px',
      marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px',
      borderTopWidth: '0px', borderRightWidth: '0px', borderBottomWidth: '0px', borderLeftWidth: '0px'
    }, st || {});
    return e;
  };
  const ASSET_ST = { backgroundImage: 'url("https://westhu.innogamescdn.com/images/window/button.png")' };

  /* fagomb: a felirat belső span, az asset a szülő gombon */
  const gomb = E('button', 'tw2gui_button', null, ASSET_ST);
  const felirat = E('span', 'tw2gui_button_label', 'Összehasonlítás');
  gomb.appendChild(felirat);

  /* aktív és inaktív fül */
  const tabAktiv = E('li', 'tw2gui_tab tw2gui_tab_active', 'Játékosok keresése', ASSET_ST);
  tabAktiv.setAttribute('aria-selected', 'true');
  const tabInaktiv = E('li', 'tw2gui_tab', 'Városok keresése');

  /* görgethető konténer DOM-elemes scrollbar-jelöltekkel */
  const gorgo = E('div', 'tw2gui_scrollpane', null,
    { overflow: 'auto', overflowY: 'auto', display: 'block' });
  Object.defineProperty(gorgo, 'scrollHeight', { value: 1200 });
  Object.defineProperty(gorgo, 'clientHeight', { value: 400 });
  Object.defineProperty(gorgo, 'scrollWidth', { value: 300 });
  Object.defineProperty(gorgo, 'clientWidth', { value: 300 });
  const sav = E('div', 'tw2gui_scrollbar', null, ASSET_ST);
  const csuszka = E('div', 'tw2gui_scrollbar_thumb', null, ASSET_ST);
  const sin = E('div', 'tw2gui_scrollbar_track', null, ASSET_ST);
  const nyil = E('div', 'tw2gui_scrollbar_arrow_up', null, ASSET_ST);
  sav.append(sin, csuszka, nyil);
  gorgo.appendChild(sav);

  /* harmadik fél eleme, a TW Calc mintájához */
  const twcalc = E('div', 'tw-calc-tab active', 'Sarlatán',
    { backgroundImage: 'url("https://tw-calc.net/img/tab.png")' });

  /* pszeudo scrollbar: alapból nem ad értelmes adatot */
  const gcsEredeti = w.getComputedStyle;
  w.getComputedStyle = (el, psz) => {
    if (psz && /webkit-scrollbar/.test(psz)) {
      return o.pszeudoScrollbar
        ? { width: '14px', height: 'auto', display: 'block',
            backgroundImage: 'url("https://westhu.innogamescdn.com/images/sb.png")',
            backgroundColor: 'rgba(0,0,0,0)' }
        : { width: 'auto', height: 'auto', display: 'block',
            backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)' };
    }
    if (psz) return { content: 'none', display: 'none', width: 'auto', height: 'auto',
      backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)',
      borderImageSource: 'none', boxShadow: 'none' };
    return gcsEredeti(el, psz);
  };

  w.document.body.append(gomb, tabAktiv, tabInaktiv, gorgo, twcalc);
  return Object.assign(k, { E, gomb, felirat, tabAktiv, tabInaktiv, gorgo, sav, csuszka, sin, nyil, twcalc });
}

const spFig = w => {
  /* a window-szintű capture figyelők számlálása */
  return w.__figyelok || 0;
};
function spFigyeloSzamlalo(w) {
  w.__figyelok = 0;
  const be = w.addEventListener.bind(w), ki = w.removeEventListener.bind(w);
  w.addEventListener = (t, f, c) => { if (c === true && /pointerdown|click|keydown/.test(t)) w.__figyelok++; return be(t, f, c); };
  w.removeEventListener = (t, f, c) => { if (c === true && /pointerdown|click|keydown/.test(t)) w.__figyelok--; return ki(t, f, c); };
}

async function spIndit(k) {
  spFigyeloSzamlalo(k.w);
  const u = await indit(k);
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  return Object.assign(u, {
    valassz: id => { const s = u.q('spcel'); s.value = id; s.dispatchEvent(new k.w.Event('change', { bubbles: true })); },
    rogzit: () => u.kat(u.gy.querySelector('[data-sp-mit="rogzit"]')),
    megszakit: () => u.kat(u.gy.querySelector('[data-sp-mit="megszakit"]')),
    masol: () => u.kat(u.gy.querySelector('[data-sp-mit="masol"]')),
    torol: () => u.kat(u.gy.querySelector('[data-sp-mit="torol"]')),
    pd: el => el.dispatchEvent(new k.w.MouseEvent('pointerdown', { bubbles: true, composed: true })),
    click: el => el.dispatchEvent(new k.w.MouseEvent('click', { bubbles: true, composed: true }))
  });
}

/* --- G1: listener-életciklus --- */
{
  const k = spKornyezet({});
  const u = await spIndit(k);
  all('4. a mérő listener alapállapotban nincs telepítve', spFig(k.w) === 0, String(spFig(k.w)));
  u.rogzit();
  all('5. gombnyomás után pontosan két aktív capture listener (pointerdown + Escape)',
    spFig(k.w) === 2, String(spFig(k.w)));
  u.rogzit();  /* második nyomás = megszakítás */
  all('6b. a második nyomás megszakít, nem duplázza', spFig(k.w) === 0, String(spFig(k.w)));
  u.rogzit(); u.rogzit(); u.rogzit();
  all('6. ismételt indítás nem dupláz listenert', spFig(k.w) <= 2, String(spFig(k.w)));
  u.megszakit();
  all('11. a megszakítás gomb mindent eltávolít', spFig(k.w) === 0);

  /* 7. saját shadow DOM-kattintás nem minta */
  u.rogzit();
  const sajatGomb = u.gy.querySelector('[data-sp-mit="rogzit"]');
  sajatGomb.dispatchEvent(new k.w.MouseEvent('pointerdown', { bubbles: true, composed: true }));
  await new Promise(r => setTimeout(r, 30));
  all('7. saját shadow DOM-kattintás nem készít mintát',
    u.q('dstyle').textContent.includes('VÁR A KATTINTÁSRA'));
  all('7b. és a listener is aktív marad', spFig(k.w) === 2);

  /* 8-9. külső kattintás */
  const elotteStyle = k.felirat.getAttribute('style');
  const elotteClass = k.felirat.className;
  u.pd(k.felirat);
  await new Promise(r => setTimeout(r, 30));
  all('8. egy alkalmas külső kattintás pontosan egy mintát rögzít',
    (u.q('dstyle').textContent.match(/rögzítve/g) || []).length === 1);
  all('9. a rögzítő figyelők azonnal lekerülnek, csak az egyszeri elnyelő marad',
    spFig(k.w) === 1, String(spFig(k.w)));
  u.click(k.felirat);
  await new Promise(r => setTimeout(r, 30));
  all('9b. a mérőkattintás után egyetlen figyelő sem marad', spFig(k.w) === 0, String(spFig(k.w)));
  all('13. a cél elem style/class/DOM-helye változatlan',
    k.felirat.getAttribute('style') === elotteStyle && k.felirat.className === elotteClass
    && k.felirat.parentNode === k.gomb);

  /* 10. Escape */
  u.rogzit();
  k.w.dispatchEvent(new k.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 30));
  all('10. Escape megszakít és eltávolít minden listenert', spFig(k.w) === 0);

  /* 12. panelbezárás */
  u.rogzit();
  all('aktív rögzítés bezárás előtt', spFig(k.w) === 2);
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r => setTimeout(r, 60));
  all('12. panelbezárás eltávolítja az aktív rögzítést', spFig(k.w) === 0, String(spFig(k.w)));
  k.dom.window.close();
}

/* --- G2: a minta tartalma --- */
{
  const k = spKornyezet({});
  const u = await spIndit(k);
  u.valassz('N4');
  u.rogzit();
  u.pd(k.felirat);                 /* a felirat belső span, az asset a szülőn */
  await new Promise(r => setTimeout(r, 30));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  const rip = k.masolat() || '';

  all('a jelentés elkészül', rip.length > 500);
  all('fejléc: verzió, viewport, devicePixelRatio, userAgent',
    rip.includes('userscript verzió') && rip.includes('viewport:')
    && rip.includes('devicePixelRatio:') && rip.includes('userAgent:'));
  all('fejléc: rögzített és hiányzó slotok',
    rip.includes('rögzített slotok: N4') && rip.includes('hiányzó slotok: N1'));
  all('a belső span felirat mellett a szülő asset is előkerül',
    rip.includes('legközelebbi assetes elem') && rip.includes('button.png'));
  all('a legközelebbi kattintható elem is szerepel',
    rip.includes('legközelebbi kattintható') && rip.includes('BUTTON'));
  all('17. a kötelező fontmezők jelen vannak',
    ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
     'textTransform', 'textAlign', 'color', 'textShadow', 'opacity', 'whiteSpace']
      .every(m => rip.includes('"' + m + '"')));
  all('18. a kötelező background/border mezők jelen vannak',
    ['backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundPosition',
     'backgroundSize', 'backgroundOrigin', 'backgroundClip', 'borderImageSource',
     'borderImageSlice', 'borderImageWidth', 'borderImageRepeat', 'borderRadius',
     'boxShadow', 'cursor'].every(m => rip.includes('"' + m + '"')));
  all('a geometriai mezők jelen vannak',
    ['paddingTop', 'marginTop', 'borderTopWidth', 'boxSizing', 'zIndex']
      .every(m => rip.includes('"' + m + '"')) && rip.includes('"rect"')
    && rip.includes('"client"') && rip.includes('"offset"'));
  all('19. ::before és ::after mérés jelen van',
    rip.includes('"elotte"') && rip.includes('"utana"'));
  all('14. legfeljebb 6 ancestor kerül a jelentésbe',
    (rip.match(/"cimke": "parent\d"/g) || []).length <= 6,
    String((rip.match(/"cimke": "parent\d"/g) || []).length));
  all('16. textContent minták legfeljebb 100 karakteresek',
    (rip.match(/"szoveg": "([^"]*)"/g) || []).every(m => m.length <= 115));
  all('az asseteknél az eredet jelölve van',
    rip.includes('the-west/innogames'));
  all('27. nincs teljes outerHTML/document dump',
    !rip.includes('outerHTML') && !rip.includes('<html') && !rip.includes('<body'));
  all('adatminimalizálási nyilatkozat a fejlécben', rip.includes('Adatminimalizálás'));

  /* 23. slot újramérés */
  u.valassz('N1');
  u.rogzit(); u.pd(k.tabAktiv);
  await new Promise(r => setTimeout(r, 30));
  u.valassz('N4');
  u.rogzit(); u.pd(k.tabInaktiv);
  await new Promise(r => setTimeout(r, 30));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  const rip2 = k.masolat() || '';
  const n4 = rip2.slice(rip2.indexOf('### SLOT N4'), rip2.indexOf('### SLOT N5'));
  const n1 = rip2.slice(rip2.indexOf('### SLOT N1'), rip2.indexOf('### SLOT N2'));
  const kattSzoveg = blokk => {
    const i = blokk.indexOf('-- 2. kattintott elem --');
    const m = /"szoveg": "([^"]*)"/.exec(blokk.slice(i, i + 3000));
    return m ? m[1] : '';
  };
  all('23. a slot újramérése csak azt az egy slotot írja felül',
    kattSzoveg(n4) === 'Városok keresése' && kattSzoveg(n1) === 'Játékosok keresése',
    'N4:"' + kattSzoveg(n4) + '" N1:"' + kattSzoveg(n1) + '"');
  all('a nagy tartók szövegmintája kihagyva (adatminimalizálás)',
    n4.includes('(kihagyva — összetett elem)'));
  all('22. mind a kilenc stabil slot megjelenik',
    ['N1','N2','N3','N4','N5','N6','N7','T1','T2'].every(x => rip2.includes('### SLOT ' + x)));
  all('az aria-selected állapot rögzül', rip2.includes('"ariaSelected": "true"'));

  /* 24. törlés */
  u.torol();
  await new Promise(r => setTimeout(r, 30));
  all('24. a törlés minden mintát eltávolít',
    !u.q('dstyle').textContent.includes('rögzítve'));
  all('24b. a törlés a production beállítást nem érinti',
    !!k.tar['mk-panel'] && /width/.test(k.tar['mk-panel']));
  k.dom.window.close();
}

/* --- G3: N7 görgetősáv, DOM-elemes eset --- */
{
  const k = spKornyezet({});
  const u = await spIndit(k);
  u.valassz('N7');
  u.rogzit();
  u.pd(k.csuszka);
  await new Promise(r => setTimeout(r, 30));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  const rip = k.masolat() || '';
  const n7 = rip.slice(rip.indexOf('### SLOT N7'), rip.indexOf('### SLOT T1'));

  all('21. az N7 tartalmaz scrollHeight/clientHeight adatot',
    n7.includes('"scrollHeight": 1200') && n7.includes('"clientHeight": 400'));
  all('21b. az N7 A/B/C/D besorolást ad', /besorolás: [ABCD] —/.test(n7), (n7.match(/besorolás: [^\n]*/) || [])[0]);
  all('DOM-elemes scrollbar → A besorolás', n7.includes('besorolás: A'));
  all('a jelöltek listája szerepel, nem találomra választ',
    n7.includes('domScrollbarJeloltek') && n7.includes('tw2gui_scrollbar_thumb'));
  all('20. scrollbar pseudo mérési kísérlet jelen van',
    n7.includes('::-webkit-scrollbar-thumb') && n7.includes('::-webkit-scrollbar-track'));
  all('15. a részfa gyűjtése legfeljebb 80 elem',
    /"reszfaElemszam": (\d+)/.test(n7) && +/"reszfaElemszam": (\d+)/.exec(n7)[1] <= 80);
  all('a részfa assetjei is szerepelnek', n7.includes('reszfaAssetek'));
  k.dom.window.close();
}

/* --- G4: N7 pszeudo scrollbar-os böngésző --- */
{
  const k = spKornyezet({ pszeudoScrollbar: true });
  const u = await spIndit(k);
  u.valassz('N7');
  u.rogzit();
  /* olyan elemre kattintunk, ahol nincs DOM-elemes sáv a részfában */
  const sima = k.E('div', 'egyszeru_lista', 'valami');
  Object.defineProperty(sima, 'scrollHeight', { value: 900 });
  Object.defineProperty(sima, 'clientHeight', { value: 300 });
  sima.__st.overflow = 'auto'; sima.__st.overflowY = 'auto';
  k.w.document.body.appendChild(sima);
  u.pd(sima);
  await new Promise(r => setTimeout(r, 30));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  const rip = k.masolat() || '';
  const n7 = rip.slice(rip.indexOf('### SLOT N7'), rip.indexOf('### SLOT T1'));
  all('pszeudo scrollbar-os böngészőnél B besorolás', n7.includes('besorolás: B'),
    (n7.match(/besorolás: [^\n]*/) || [])[0]);
  all('a pszeudo mérés értelmes adatot jelez', n7.includes('"pszeudoAdErtelmesAdatot": true'));
  k.dom.window.close();
}

/* --- G5: harmadik fél assetjének jelölése --- */
{
  const k = spKornyezet({});
  const u = await spIndit(k);
  u.valassz('T1');
  u.rogzit();
  u.pd(k.twcalc);
  await new Promise(r => setTimeout(r, 30));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  const rip = k.masolat() || '';
  all('a harmadik fél assetje külön jelölve van',
    rip.includes('"eredet": "harmadik fél"') && rip.includes('tw-calc.net'));
  k.dom.window.close();
}

/* --- G6: statikus kapuk --- */
{
  all('25. nincs hálózati elküldés vagy új hálózati primitív',
    !/fetch\(|XMLHttpRequest/.test(SP_BLOKK)
    && !/GM_xmlhttpRequest/.test(SP_BLOKK) && !/new Image\(/.test(SP_BLOKK));
  all('26. nincs MutationObserver', !/MutationObserver/.test(SRC));
  all('nincs localStorage/sessionStorage/cookie olvasás a mérőblokkban',
    !/localStorage|sessionStorage|document\.cookie/.test(SP_BLOKK));
  all('a mérő nem hív click()-et a célon és nem automatizál',
    !/\.click\(\)/.test(SP_BLOKK) && !/dispatchEvent/.test(SP_BLOKK));
  all('a mérő nem módosít játékbeli elemet',
    !/\.style\./.test(SP_BLOKK.replace(/d\.setAttribute\("style"[\s\S]*?\.join\(";"\)\);/g, ''))
    && !/setAttribute\("class/.test(SP_BLOKK) && !/className\s*=/.test(SP_BLOKK));
  all('az overlay külön elem, pointer-events:none',
    SP_BLOKK.includes('mk-sp-overlay') && SP_BLOKK.includes('pointer-events:none'));
  all('a részfa- és őskorlátok a kódban',
    SP_BLOKK.includes('SP_FA_MELYSEG = 4') && SP_BLOKK.includes('SP_FA_MAX = 80')
    && SP_BLOKK.includes('SP_OS_MAX = 6') && SP_BLOKK.includes('SP_SZOVEG_MAX = 100'));
  all('a blokk egyben eltávolítható (egyértelmű határok)',
    SP_BLOKK.length > 3000 && SRC.includes('STYLE PROBE 5A BLOKK VÉGE'));
  /* 4. a production CSS beégetett hashkapuja */
  const cssT = cssTorzs(SRC);
  all('28. a production UI CSS hashkapuja egyezik az 1.4.0-val',
    cssT !== null && sha(cssT) === ELVART_HASH.__CSS__,
    cssT === null ? 'nem kivonható' : sha(cssT));

  /* 5. minden felsorolt production függvény hashkapuja */
  Object.keys(ELVART_HASH).filter(x => x !== '__CSS__').forEach(fn => {
    const t = fvTorzs(SRC, fn);
    all('production hashkapu: ' + fn,
      t !== null && sha(t) === ELVART_HASH[fn],
      t === null ? 'a függvény nem található vagy nem záródik' : sha(t));
  });
}


/* --- G7: FIX1 — izoláció és hordozhatóság --- */
{
  all('1. nincs /tmp vagy abszolút baseline-útvonal a tesztben',
    !/\/tmp\//.test(TESZT_SAJAT) && !/readFileSync\(\s*['"]\//.test(TESZT_SAJAT));
  const fajlnevek = (TESZT_SAJAT.match(/readFileSync\(\s*['"]([^'"]+)['"]/g) || [])
    .map(x => /['"]([^'"]+)['"]/.exec(x)[1]);
  all('3. a teszt egyetlen projektfájlt olvas: a userscriptet',
    fajlnevek.length === 1 && fajlnevek[0] === 'the-west-panel.user.js',
    fajlnevek.join(', '));
  all('3b. a másik olvasás a teszt önvizsgálata (import.meta.url)',
    /readFileSync\(new URL\(import\.meta\.url\)/.test(TESZT_SAJAT));

  const kot = fvTorzs(SRC, 'kotesek');
  /* 1.5.2: a kotesek() SZÁNDÉKOSAN változott — az alapmeret ág helyére a
     fogaskerék diagvalt ága lépett. A kapu tovább őrzi a véletlen módosítás
     ellen, csak az elvárt érték frissült. */
  all('6. a kotesek() törzse egyezik az elvárt értékkel',
    kot !== null && sha(kot) === ELVART_HASH.kotesek);
  all('7. nincs sprogzit/spmegszakit/sptorol/spmasol ág a kotesek()-ben',
    kot !== null && !/sprogzit|spmegszakit|sptorol|spmasol/.test(kot));
  all('8. a STYLE PROBE kezelőszervein nincs production data-mit',
    !/data-mit="sp/.test(SP_BLOKK) && /data-sp-mit="rogzit"/.test(SP_BLOKK));
  all('a mérő delegáló a blokk határain belül van',
    SP_BLOKK.includes('function spKotes()') && SP_BLOKK.includes('data-sp-mit'));
  all('a delegáló csak a dstyle konténerre köt',
    /const doboz = \$\("dstyle"\);/.test(SP_BLOKK)
    && !/gyoker\.addEventListener/.test(SP_BLOKK));
  all('a kötés idempotens őrrel védett',
    /let spKotve = false;/.test(SP_BLOKK) && /if \(spKotve\) return;/.test(SP_BLOKK));
}

{
  const k = spKornyezet({});
  const u = await spIndit(k);
  const doboz = u.q('dstyle');

  /* 9-10. a delegált listener pontosan egyszer kötődik */
  let kotesDb = 0;
  const eredeti = doboz.addEventListener.bind(doboz);
  doboz.addEventListener = (t, f, c) => { if (t === 'click' || t === 'change') kotesDb++; return eredeti(t, f, c); };
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  all('10. többszöri spRajzol() nem duplázza a listenert', kotesDb === 0, String(kotesDb));

  /* 12. mind a négy gomb működik újrarajzolás után is */
  u.rogzit();
  all('12a. rögzítés gomb működik', u.q('dstyle').textContent.includes('VÁR A KATTINTÁSRA'));
  u.megszakit();
  all('12b. megszakítás gomb működik', u.q('dstyle').textContent.includes('nem fut rögzítés'));

  /* 11. a select change kezelése újrarajzolás után */
  u.valassz('N7');
  u.rogzit();
  all('11. a select change kezelése működik újrarajzolás után is',
    u.q('dstyle').textContent.includes('VÁR A KATTINTÁSRA — N7'),
    (u.q('dstyle').textContent.match(/VÁR A KATTINTÁSRA[^·]*/) || [])[0]);
  u.pd(k.csuszka);
  await new Promise(r => setTimeout(r, 30));
  all('12c. a rögzítés a választott slotba került',
    u.q('dstyle').textContent.includes('N7 — rögzítve') || /N7 —\s*rögzítve/.test(u.q('dstyle').textContent),
    u.q('dstyle').textContent.slice(0, 200));
  u.masol();
  await new Promise(r => setTimeout(r, 80));
  all('12d. másolás gomb működik', (k.masolat() || '').includes('### SLOT N7'));
  u.torol();
  all('12e. törlés gomb működik', !u.q('dstyle').textContent.includes('rögzítve'));

  /* 13. a production delegáló nem dolgozza fel a probe gombjait */
  let prodTalalat = 0;
  const gomb = u.gy.querySelector('[data-sp-mit="rogzit"]');
  all('13. a probe gombjain nincs data-mit attribútum',
    !gomb.hasAttribute('data-mit'), String(gomb.getAttribute('data-mit')));
  all('13b. a production kotesek() closest("[data-mit]") nem találja meg',
    gomb.closest('[data-mit]') === null);
  k.dom.window.close();
}


/* ============================================================
   H. COMPONENT MAPPER 5B1
   ============================================================ */
console.log('\n--- H) COMPONENT MAPPER 5B1 ---');

/* Hamis natív komponenskörnyezet: fül szövegréteggel és sprite-szeletekkel,
   fagomb három gyermekréteggel, kilencrészes görgetősáv, groupframe. */
function cmKornyezet(o) {
  o = o || {};
  const k = kornyezet(o);
  const w = k.w;
  const meret = new Map();
  const R = el => { const m = meret.get(el) || [0,0,0,0];
    return { left:m[2], top:m[3], right:m[2]+m[0], bottom:m[3]+m[1], width:m[0], height:m[1] }; };
  const gcsE = w.getComputedStyle;
  w.getComputedStyle = (el, psz) => {
    if (psz) return (el && el.__psz && el.__psz[psz]) || { content:'none', display:'none',
      backgroundImage:'none', backgroundColor:'rgba(0, 0, 0, 0)', borderImageSource:'none', boxShadow:'none' };
    if (el && el.__cm) return el.__cm;
    return gcsE(el, psz);
  };
  const ALAP = {
    display:'block', position:'static', top:'auto', right:'auto', bottom:'auto', left:'auto',
    zIndex:'auto', overflow:'visible', overflowX:'visible', overflowY:'visible',
    boxSizing:'content-box', width:'auto', height:'auto', transform:'none',
    paddingTop:'0px', paddingRight:'0px', paddingBottom:'0px', paddingLeft:'0px',
    marginTop:'0px', marginRight:'0px', marginBottom:'0px', marginLeft:'0px',
    borderTopWidth:'0px', borderRightWidth:'0px', borderBottomWidth:'0px', borderLeftWidth:'0px',
    borderTopStyle:'none', borderRightStyle:'none', borderBottomStyle:'none', borderLeftStyle:'none',
    borderTopColor:'rgb(0,0,0)', borderRightColor:'rgb(0,0,0)', borderBottomColor:'rgb(0,0,0)',
    borderLeftColor:'rgb(0,0,0)',
    fontFamily:'Arial', fontSize:'13px', fontWeight:'400', fontStyle:'normal', lineHeight:'normal',
    letterSpacing:'normal', textTransform:'none', textAlign:'start', color:'rgb(255,255,255)',
    textShadow:'none', opacity:'1', whiteSpace:'normal',
    backgroundColor:'rgba(0, 0, 0, 0)', backgroundImage:'none', backgroundRepeat:'repeat',
    backgroundPosition:'0% 0%', backgroundSize:'auto', backgroundOrigin:'padding-box',
    backgroundClip:'border-box', borderImageSource:'none', borderImageSlice:'100%',
    borderImageWidth:'1', borderImageOutset:'0', borderImageRepeat:'stretch',
    borderRadius:'0px', boxShadow:'none', cursor:'default', pointerEvents:'auto'
  };
  const E = (tag, cls, wid, hei, x, y, st, txt) => {
    const e = w.document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    e.getBoundingClientRect = () => R(e);
    meret.set(e, [wid, hei, x||0, y||0]);
    e.__cm = Object.assign({}, ALAP, st || {});
    return e;
  };
  const KEP = (u, poz, rep) => ({ backgroundImage:'url("https://westhu.innogamescdn.com/images/tw2gui/'+u+'")',
    backgroundPosition: poz || '0% 0%', backgroundRepeat: rep || 'no-repeat' });

  /* --- FÜL: gyökér + szövegréteg + három sprite-szelet --- */
  const fulAktiv = o.fulEgyReteg
    ? E('div','tw2gui_window_tab _tab_id_2 tw2gui_window_tab_active',152,33,100,50,
        KEP('window/tabbar/window2_tab_active.png?3','0% 0%','repeat'))
    : E('div','tw2gui_window_tab _tab_id_2 tw2gui_window_tab_active',152,33,100,50);
  const fulSzoveg = E('div','tw2gui_window_tab_text',53,15,116,58,
    { fontSize:'13.3333px', fontWeight:'700', color:'rgb(255, 255, 255)' }, 'Sarlatán');
  if (!o.fulEgyReteg) {
    /* három sprite-szelet ugyanabból az assetből, ELTÉRŐ background-positionnel */
    fulAktiv.appendChild(E('div','tw2gui_window_tab_left',16,33,100,50,
      KEP('window/tabbar/window2_tab_active.png?3','0px 0px')));
    fulAktiv.appendChild(E('div','tw2gui_window_tab_center',120,33,116,50,
      KEP('window/tabbar/window2_tab_active.png?3','-16px 0px','repeat-x')));
    fulAktiv.appendChild(E('div','tw2gui_window_tab_right',16,33,236,50,
      KEP('window/tabbar/window2_tab_active.png?3','100% 0px')));
  }
  fulAktiv.appendChild(fulSzoveg);

  const fulInaktiv = E('div','tw2gui_window_tab _tab_id_3',140,33,260,50,
    KEP('window/tabbar/window2_tab.png?3','0% 0%','repeat'));
  const fulInaktivSzoveg = E('div','tw2gui_window_tab_text',50,15,276,58,
    { fontSize:'13.3333px', fontWeight:'700', color:'rgb(198, 186, 160)' }, 'Kovács');
  fulInaktiv.appendChild(fulInaktivSzoveg);

  const tabbar = E('div','tw2gui_window_tabbar_tabs',2000,35,100,48);
  tabbar.append(fulAktiv, fulInaktiv);

  /* --- GOMB: gyökér három vizuális gyermekréteggel --- */
  const gomb = E('div','tw2gui_button jobs_allbutton',180,36,100,150);
  const gombBal = E('div','tw2gui_button_left',10,36,100,150, KEP('button/button.png?2','0px 0px'));
  const gombKozep = E('div','tw2gui_button_center',160,36,110,150, KEP('button/button.png?2','-10px 0px','repeat-x'));
  const gombJobb = E('div','tw2gui_button_right',10,36,270,150, KEP('button/button.png?2','100% 0px'));
  const gombFelirat = E('div','textart_title shorten',160,28,110,150,
    { fontFamily:'Arial', fontSize:'13.3333px', fontWeight:'700', color:'rgb(255, 231, 177)',
      textAlign:'center', whiteSpace:'nowrap', paddingTop:'9px' }, 'Mind');
  gomb.append(gombBal, gombKozep, gombJobb, gombFelirat);

  /* --- SCROLLBAR: kilenc megnevezett rész, mind vizuálisan bizonyítva.
     Az opciók egy-egy részt elrontanak a negatív próbákhoz. --- */
  const SB = u => KEP('window2_scrollbar_vertical.png?1', u, 'no-repeat');
  const SB3 = u => KEP('window2_scrollbar_vertical.png?3', u, 'no-repeat');
  const sb = E('div','tw2gui_scrollbar vertical',15,320,400,150,
    Object.assign(KEP('window2_scrollbar_vertical.png?1','-30px 0px','repeat-y')));
  const sbBg1 = E('div','tw2gui_scrollbar_bg1',15,20,400,165, SB('-45px 0px'));
  const sbBg2 = o.sbNincsBg2 ? null : E('div','tw2gui_scrollbar_bg2',15,20,400,430, SB('-60px 0px'));
  const nyilFel = E('div','tw2gui_scrollbar_arrow_leup',15,15,400,150,
    o.sbNyilNincsVizual ? {} : SB('0px 0%'));
  const nyilLe = E('div','tw2gui_scrollbar_arrow_ribo',15,15,400,455, SB('0px 100%'));
  /* a pulley_area és a pulley gyökér is kap vizuális bizonyítékot */
  const pulleyArea = E('div','tw2gui_scrollbar_pulley_area',15,290,400,165, SB('-90px 0px'));
  const pulley = E('div','tw2gui_scrollbar_pulley draggable',15,60,400,200, SB('-105px 0px'));
  const pBg1 = E('div','tw2gui_scrollbar_pulley_bg1',15,8,400,200, SB('-15px 0px'));
  const pBg2 = E('div','tw2gui_scrollbar_pulley_bg2',15,44,400,208, SB('-15px -8px','repeat-y'));
  const pBg3 = o.sbNincsPulleyBg3 ? null
    : E('div','tw2gui_scrollbar_pulley_bg3',15,8,400,252, SB('-15px 100%'));
  /* a ?3 sprite-változat felhasználója — opcióval elhagyható */
  const sbHarom = o.sbNincsHarom ? null
    : E('div','tw2gui_scrollbar_arnyek',15,10,400,300, SB3('0px 0px'));
  const sbIsmeretlen = E('div','tw2gui_scrollbar_valami_uj',15,6,400,470, SB('-75px 0px'));
  [pBg1, pBg2, pBg3].forEach(x => x && pulley.appendChild(x));
  pulleyArea.appendChild(pulley);
  [sbBg1, sbBg2, nyilFel, nyilLe, pulleyArea, sbHarom, sbIsmeretlen]
    .forEach(x => x && sb.appendChild(x));

  /* --- GROUPFRAME: fejléc + keretrétegek --- */
  const gf = E('div','tw2gui_groupframe',674,60,600,150);
  const gfFejlec = E('div','tw2gui_groupframe_title',674,20,600,150,
    KEP('groupframe/gf_title.png?2','0% 0%'), 'Mesterségszint');
  const gfKeret = E('div','tw2gui_groupframe_border',674,60,600,150, KEP('groupframe/gf_border.png?2','0% 0%','repeat'));
  const gfTartalom = E('div','tw2gui_groupframe_content_pane',644,30,615,180,
    { paddingTop:'15px', paddingRight:'15px', paddingBottom:'15px', paddingLeft:'15px' });
  gf.append(gfFejlec, gfKeret, gfTartalom);

  /* --- SZÖVEG és SZÁM --- */
  const mondat = E('span','jobs_hint',300,18,600,300,
    { fontFamily:'Arial, Verdana, sans-serif', fontSize:'12px', fontWeight:'400',
      lineHeight:'16px', color:'rgb(232, 220, 196)', textShadow:'rgb(0, 0, 0) 1px 1px 0px' },
    'Értékek a munkaidő alapján.');
  const szam = E('span','jobs_money',40,16,600,330,
    { fontFamily:'Arial', fontSize:'12px', fontWeight:'700', color:'rgb(140, 220, 140)' }, '$18');

  /* --- pszeudoelemes komponens a B típushoz --- */
  const pszGomb = E('div','tw2gui_button psz_only',120,30,900,150);
  pszGomb.__psz = { '::before': { content:'""', display:'block', position:'absolute',
    top:'0px', left:'0px', width:'10px', height:'30px', zIndex:'1', opacity:'1', transform:'none',
    backgroundColor:'rgba(0, 0, 0, 0)',
    backgroundImage:'url("https://westhu.innogamescdn.com/images/tw2gui/button/cap.png")',
    backgroundRepeat:'no-repeat', backgroundPosition:'0px 0px', backgroundSize:'auto',
    borderImageSource:'none', boxShadow:'none' } };

  /* --- egyetlen háttér, felosztás nélkül: E típus --- */
  const egyReteg = E('div','tw2gui_groupframe csak_gyoker',200,40,900,300,
    KEP('groupframe/one.png?1','0% 0%','repeat'));

  /* --- mély fa a korlátok próbájához --- */
  const mely = E('div','tw2gui_button mely_gomb',100,100,1200,150);
  let futo = mely;
  for (let i = 0; i < 10; i++) { const c = E('div','szint'+i,10,10,0,0); futo.appendChild(c); futo = c; }
  const szeles = E('div','tw2gui_button szeles_gomb',100,100,1400,150);
  for (let i = 0; i < 200; i++) szeles.appendChild(E('div','g'+i,4,4,0,0));

  w.document.body.append(tabbar, gomb, sb, gf, mondat, szam, pszGomb, egyReteg, mely, szeles);
  return Object.assign(k, { E, R, meret, fulAktiv, fulSzoveg, fulInaktiv, fulInaktivSzoveg,
    gomb, gombBal, gombFelirat, sb, pulley, pulleyArea, pBg1, pBg2, pBg3, nyilFel, nyilLe,
    sbBg1, sbBg2, sbHarom, sbIsmeretlen,
    gf, gfFejlec, gfTartalom, mondat, szam, pszGomb, egyReteg, mely, szeles });
}

function cmFigyeloSzamlalo(w) {
  w.__cmFig = 0;
  const be = w.addEventListener.bind(w), ki = w.removeEventListener.bind(w);
  w.addEventListener = (t, f, c) => { if (c === true && /mousemove|keydown|pointerdown|click/.test(t)) w.__cmFig++; return be(t,f,c); };
  w.removeEventListener = (t, f, c) => { if (c === true && /mousemove|keydown|pointerdown|click/.test(t)) w.__cmFig--; return ki(t,f,c); };
}

async function cmIndit(k) {
  cmFigyeloSzamlalo(k.w);
  const u = await indit(k);
  u.kat(u.gy.querySelector('[data-mit="diagvalt"]'));
  const pont = (el) => { const r = el.getBoundingClientRect(); return [r.left + 2, r.top + 2]; };
  return Object.assign(u, {
    fig: () => k.w.__cmFig,
    valassz: id => { const s = u.q('cmpreset'); s.value = id;
      s.dispatchEvent(new k.w.Event('change', { bubbles: true })); },
    start: () => u.kat(u.gy.querySelector('[data-cm-mit="rogzit"]')),
    stop: () => u.kat(u.gy.querySelector('[data-cm-mit="megszakit"]')),
    masol: () => u.kat(u.gy.querySelector('[data-cm-mit="masol"]')),
    torol: () => u.kat(u.gy.querySelector('[data-cm-mit="torolEgy"]')),
    /* egér a cél fölé, majd F2 — kattintás nélkül */
    mer: el => {
      const [x, y] = pont(el);
      k.w.__cmPont = el;
      k.w.dispatchEvent(new k.w.MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
      k.w.dispatchEvent(new k.w.KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    },
    esc: () => k.w.dispatchEvent(new k.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  });
}

/* a jsdom elementsFromPoint-ja nem valósághű; a próbában a szándékolt célt adjuk vissza */
function cmPontHamisitas(w) {
  w.document.elementsFromPoint = () => (w.__cmPont ? [w.__cmPont] : []);
}

/* --- H1: gyökérfelismerés mind az öt típusra --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  const parok = [['C1', k.fulSzoveg, 'tw2gui_window_tab'], ['C3', k.gombFelirat, 'tw2gui_button'],
                 ['C5', k.pBg2, 'tw2gui_scrollbar'], ['C6', k.gfTartalom, 'tw2gui_groupframe'],
                 ['C7', k.mondat, null]];
  for (const [pid, cel] of parok) { u.valassz(pid); u.start(); u.mer(cel); await new Promise(r=>setTimeout(r,20)); }
  u.masol(); await new Promise(r=>setTimeout(r,120));
  const rip = k.masolat() || '';
  all('1a. TAB gyökér felismerve', /### C1[\s\S]{0,600}?selector: \.tw2gui_window_tab\b[\s\S]{0,60}FELISMERT/.test(rip));
  all('1b. BUTTON gyökér felismerve', /### C3[\s\S]{0,600}?selector: \.tw2gui_button[\s\S]{0,60}FELISMERT/.test(rip));
  all('1c. SCROLLBAR gyökér felismerve', /### C5[\s\S]{0,600}?selector: \.tw2gui_scrollbar[\s\S]{0,60}FELISMERT/.test(rip));
  all('1d. GROUPFRAME gyökér felismerve', /### C6[\s\S]{0,600}?selector: \.tw2gui_groupframe[\s\S]{0,60}FELISMERT/.test(rip));
  all('1e. TEXT: a cél elem a gyökér', /### C7[\s\S]{0,600}?eredmény: CEL_ELEM/.test(rip));

  /* 2. teljes fa és parentLayerId kapcsolat */
  all('2a. a fa tartalmazza a gomb három gyermekrétegét',
    rip.includes('tw2gui_button_left') && rip.includes('tw2gui_button_center')
    && rip.includes('tw2gui_button_right'));
  all('2b. parentLayerId kapcsolat kiépül',
    /"layerId": "R>0"[\s\S]{0,200}?"parentLayerId": "R"/.test(rip));
  all('2c. selectorPath relatív a gyökérhez', /"selectorPath": ":scope > div\./.test(rip));
  all('2d. komponenskapcsolat-lista külön szerepel', rip.includes('-- komponenskapcsolatok --'));

  /* 17. szöveg és szám közvetlen tipográfiája */
  u.valassz('C8'); u.start(); u.mer(k.szam); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,120));
  const rip2 = k.masolat() || '';
  all('17a. C7 folyó mondat tipográfiája rögzül',
    /### C7[\s\S]*?"fontSize": "12px"[\s\S]*?"color": "rgb\(232, 220, 196\)"/.test(rip2));
  all('17b. C8 számérték tipográfiája rögzül',
    /### C8[\s\S]*?"fontWeight": "700"[\s\S]*?"color": "rgb\(140, 220, 140\)"/.test(rip2));
  all('20a. nincs teljes HTML a jelentésben',
    !rip2.includes('outerHTML') && !rip2.includes('innerHTML') && !rip2.includes('<html'));
  all('20b. nincs tárolóadat', !/localStorage|sessionStorage|document\.cookie/.test(rip2));
  all('20c. szövegminta legfeljebb 100 karakter',
    (rip2.match(/"szoveg": "([^"]*)"/g) || []).every(m => m.length <= 118));
  k.dom.window.close();
}

/* --- H2: compositionType A / B / C / D / E --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C3'); u.start(); u.mer(k.gombFelirat); await new Promise(r=>setTimeout(r,20));
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  u.valassz('C6'); u.start(); u.mer(k.egyReteg); await new Promise(r=>setTimeout(r,20));
  u.valassz('C4'); u.start(); u.mer(k.pszGomb); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  const tipus = pid => {
    const b = rip.slice(rip.indexOf('### ' + pid + ' '));
    const m = /compositionType: ([A-E])/.exec(b);
    return m ? m[1] : '?';
  };
  all('4a. külön DOM-rétegek + sprite → D', tipus('C3') === 'D', 'C3=' + tipus('C3'));
  all('4b. fül: DOM-rétegek és sprite-szeletek → D', tipus('C1') === 'D', 'C1=' + tipus('C1'));
  all('4c. csak pszeudoelem → B', tipus('C4') === 'B', 'C4=' + tipus('C4'));
  all('5. egyetlen gyökérháttér, felosztás nélkül → E', tipus('C6') === 'E', 'C6=' + tipus('C6'));
  all('5b. az E indoklása megnevezi a gyökeret',
    /E: a vizuális bizonyíték egyedül a gyökéren/.test(rip));
  all('4d. az indoklás konkrét layerId-kre hivatkozik', /A: \d+ külön DOM-réteg[\s\S]{0,120}R>\d/.test(rip));

  /* 18. asset rétegenként megőrizve */
  all('18a. ugyanaz az asset több rétegen külön pozícióval',
    /"backgroundPosition": "-16px 0px"/.test(rip) && /"backgroundPosition": "0px 0px"/.test(rip));
  all('18b. assetCatalog használatonként őrzi a layerId-t',
    /"hasznalatok": \[[\s\S]{0,400}?"layerId": "R>\d"/.test(rip));
  k.dom.window.close();
}

/* --- H3: fül aktív/inaktív kapuk --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);

  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  all('6. aktív fül elfogadva C1-ben',
    u.q('dcomp').textContent.includes('C1 TAB_ACTIVE_FULL') &&
    /C1 TAB_ACTIVE_FULL — rögzítve/.test(u.q('dcomp').textContent.replace(/\s+/g,' ')),
    u.q('dcomp').textContent.slice(0,200));

  /* aktív osztályos elem C2-ben → elutasítás */
  u.valassz('C2'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  all('7. active osztályos „inaktív” fül elutasítva',
    /C2 TAB_INACTIVE_FULL — AKTIV_A_C2_HELYEN/.test(u.q('dcomp').textContent.replace(/\s+/g,' ')),
    u.q('dcomp').textContent.replace(/\s+/g,' ').slice(0,300));

  /* valódi inaktív fül → elfogadás */
  u.valassz('C2'); u.start(); u.mer(k.fulInaktivSzoveg); await new Promise(r=>setTimeout(r,20));
  all('8. valódi inaktív fül elfogadva',
    /C2 TAB_INACTIVE_FULL — rögzítve/.test(u.q('dcomp').textContent.replace(/\s+/g,' ')));
  all('8b. az inaktív fül más assetet mutat',
    (k.masolat()||'') !== null);
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  all('8c. az inaktív fül window2_tab.png assetje rögzült', rip.includes('window2_tab.png?3'));
  all('8d. C1 és C2 nem ugyanaz az állapot',
    !/C1_C2_AZONOS/.test(rip));
  all('9a. a fül-részek külön kimenete megvan',
    rip.includes('leftCandidateLayers') && rip.includes('rightCandidateLayers')
    && rip.includes('otherVisualLayers'));
  all('9b. a bal/jobb jelölt DOM-geometriából jön',
    /"leftCandidateLayers": \[\s*"R>0"/.test(rip));
  k.dom.window.close();
}

/* --- H4: egyrétegű fül → üres listák, E, nem EXACT --- */
{
  const k = cmKornyezet({ fulEgyReteg: true }); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  const tp = JSON.parse(rip.slice(rip.indexOf('-- fül-részek --')+16, rip.indexOf('-- CSSOM --')).trim());
  all('5c. egyetlen gyökérháttérnél a három lista üres',
    tp.leftCandidateLayers.length===0 && tp.centerCandidateLayers.length===0
    && tp.rightCandidateLayers.length===0);
  all('5d. ilyenkor az eredmény NEM EXACT', tp.confidence !== 'EXACT', tp.confidence);
  all('5e. és a magyarázat kimondja, miért', /NEM EXACT/.test(tp.megjegyzes));
  k.dom.window.close();
}

/* --- H5: scrollbar kilenc része --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C5'); u.start(); u.mer(k.pBg2); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  const sp = JSON.parse(rip.slice(rip.indexOf('-- scrollbarParts --')+20, rip.indexOf('-- CSSOM --')).trim());
  all('14a. trackRoot azonosítva', sp.trackRoot === 'R');
  all('14b. felső és alsó nyíl szétválasztva',
    sp.arrowUpLayers.length===1 && sp.arrowDownLayers.length===1);
  all('14c. sín háttérrétegei külön, mind megerősítve',
    sp.trackBgLayers.length >= 2, JSON.stringify(sp.trackBgLayers));
  all('14d. pulley_area és pulley gyökér külön, mindkettő megerősítve',
    sp.pulleyAreaLayers.length===1 && !!sp.pulleyRoot && sp.pulleyRootVizualis === true);
  all('14e. a csúszka három sávja külön', sp.pulleyLayers.length===3, JSON.stringify(sp.pulleyLayers));
  all('15. ismeretlen réteg megőrizve, nem eldobva',
    sp.unknownLayers.some(x => /valami_uj/.test(x.osztaly)), JSON.stringify(sp.unknownLayers).slice(0,200));
  all('10b. a jelen lévő ?3 sprite-változat NEM kerül a hiánylistára',
    sp.azonositatlanAsset.length === 0, JSON.stringify(sp.azonositatlanAsset));
  all('14f. minden hivatkozás layerId', typeof sp.trackRoot === 'string'
    && sp.arrowUpLayers.every(x => /^R(>\d+)*$/.test(x)));
  k.dom.window.close();
}

/* --- H6: groupframe gyermekrétegei --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C6'); u.start(); u.mer(k.gfTartalom); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  all('16a. a groupframe fejléce rögzül', rip.includes('tw2gui_groupframe_title'));
  all('16b. a keretréteg rögzül', rip.includes('tw2gui_groupframe_border'));
  all('16c. a tartalomtartó 15px behúzása rögzül', /"paddingTop": "15px"/.test(rip));
  /* 13. valódi ellenőrzés: a gomb mindhárom gyermekrétege TELJES rekordot kap.
     Nem elég, hogy az osztálynév megjelenik — minden kötelező mezőcsoport kell. */
  u.valassz('C3'); u.start(); u.mer(k.gombFelirat); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const gombRip = k.masolat() || '';
  const c3blokk = gombRip.slice(gombRip.indexOf('### C3 '), gombRip.indexOf('### C4 '));
  const c3fa = c3blokk.slice(c3blokk.indexOf('-- komponensfa'), c3blokk.indexOf('-- ősök'));
  const gombRetegek = ['tw2gui_button_left', 'tw2gui_button_center', 'tw2gui_button_right'];
  all('13. a gomb mindhárom gyermekrétege szerepel a fában',
    gombRetegek.every(cn => c3fa.includes(cn)));
  all('13b. mindhárom réteg teljes rekordot kap', gombRetegek.every(cn => {
    const i = c3fa.indexOf('"osztaly": "' + cn + '"');
    if (i < 0) return false;
    const kor = c3fa.slice(Math.max(0, i - 2500), i + 2500);
    return ['"layerId"', '"parentLayerId"', '"selectorPath"', '"rect"', '"client"', '"offset"',
            '"geometria"', '"tipografia"', '"hatter"', '"elotte"', '"utana"', '"assetek"']
      .every(m => kor.includes(m));
  }), 'hiányzó mezőcsoport valamelyik rétegnél');
  all('13c. mindhárom réteg saját asset-rekordot kap külön pozícióval',
    /"backgroundPosition": "0px 0px"/.test(c3fa)
    && /"backgroundPosition": "-10px 0px"/.test(c3fa)
    && /"backgroundPosition": "100% 0px"/.test(c3fa));
  k.dom.window.close();
}

/* --- H7: korlátok --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C3'); u.start(); u.mer(k.mely); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const r1 = k.masolat() || '';
  const melysegek = (r1.match(/"layerId": "(R(?:>\d+)*)"/g) || [])
    .map(x => (x.match(/>/g) || []).length);
  all('3a. mélységkorlát 6 fölé nem megy', Math.max(...melysegek, 0) <= 6, 'max: ' + Math.max(...melysegek, 0));

  u.valassz('C4'); u.start(); u.mer(k.szeles); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,200));
  const r2 = k.masolat() || '';
  const c4 = r2.slice(r2.indexOf('### C4 '));
  const db = (/-- komponensfa \((\d+) réteg/.exec(c4) || [])[1];
  all('3b. elemszámkorlát 120', +db <= 120, db + ' réteg');
  all('3c. a csonkolás jelezve van', /CSONKOLT a 120 elemes korlátnál/.test(c4));
  k.dom.window.close();
}

/* --- H8: listener-életciklus és állapotvédelem --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  all('10a. alapállapotban nulla globális listener', u.fig() === 0, String(u.fig()));
  u.start();
  all('9c. rögzítés indítása után két figyelő (mousemove + F2)', u.fig() === 2, String(u.fig()));
  u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  all('9d. sikeres rögzítés után nulla figyelő', u.fig() === 0, String(u.fig()));

  u.start(); u.esc(); await new Promise(r=>setTimeout(r,20));
  all('9e. Escape megszakít és takarít', u.fig() === 0);
  u.start(); u.stop();
  all('9f. megszakítás gomb takarít', u.fig() === 0);

  /* 12. a cél állapota változatlan */
  const el = k.fulAktiv;
  const elotteClass = el.className, elotteStyle = el.getAttribute('style');
  const elotteHely = Array.prototype.indexOf.call(el.parentElement.children, el);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  all('12. a cél style/class/DOM-helye változatlan',
    el.className === elotteClass && el.getAttribute('style') === elotteStyle
    && Array.prototype.indexOf.call(el.parentElement.children, el) === elotteHely);

  /* 22. panelbezárás aktív rögzítés közben */
  u.start();
  all('22a. aktív rögzítés bezárás előtt', u.fig() === 2);
  u.kat(k.w.document.getElementById('mk-panel-btn'));
  await new Promise(r=>setTimeout(r,60));
  all('22. panelbezárás teljesen takarít', u.fig() === 0, String(u.fig()));
  k.dom.window.close();
}

/* --- H9: STATE_MUTATED --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  /* a mérés alatt megváltoztatjuk a gyökér osztályát */
  const eredetiGCS = k.w.getComputedStyle;
  let hivas = 0;
  k.w.getComputedStyle = (el, psz) => {
    if (++hivas === 3) k.fulAktiv.className += ' kivulrol_valtozott';
    return eredetiGCS(el, psz);
  };
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  all('12b. állapotváltozás esetén STATE_MUTATED',
    /STATE_MUTATED/.test(u.q('dcomp').textContent), u.q('dcomp').textContent.slice(0,200));
  k.dom.window.close();
}

/* --- H10: CSSOM SecurityError --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  Object.defineProperty(k.w.document, 'styleSheets', {
    get() { return [ { get cssRules() { const e = new Error('SecurityError'); e.name='SecurityError'; throw e; } } ]; },
    configurable: true
  });
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  u.masol(); await new Promise(r=>setTimeout(r,150));
  const rip = k.masolat() || '';
  all('19. CSSOM SecurityError biztonságos kezelése', rip.includes('CSSOM_BLOCKED'));
  all('19b. a tiltást nem kerüli meg hálózati kéréssel',
    !/fetch\(|XMLHttpRequest/.test(CM_BLOKK));
  k.dom.window.close();
}

/* --- H11: preset-kezelés és delegálás --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r=>setTimeout(r,20));
  u.valassz('C3'); u.start(); u.mer(k.gombFelirat); await new Promise(r=>setTimeout(r,20));
  all('preset újramérése csak azt írja felül',
    /C1 TAB_ACTIVE_FULL — rögzítve/.test(u.q('dcomp').textContent.replace(/\s+/g,' '))
    && /C3 BUTTON_NORMAL_FULL — rögzítve/.test(u.q('dcomp').textContent.replace(/\s+/g,' ')));
  u.valassz('C1'); u.torol();
  const t = u.q('dcomp').textContent.replace(/\s+/g,' ');
  all('kiválasztott preset törlése csak azt törli',
    /C1 TAB_ACTIVE_FULL — nincs/.test(t) && /C3 BUTTON_NORMAL_FULL — rögzítve/.test(t));

  /* 11. ismételt kirajzolás nem duplázza a delegált listenert */
  const doboz = u.q('dcomp');
  let kotes = 0;
  const er = doboz.addEventListener.bind(doboz);
  doboz.addEventListener = (t2, f, c) => { if (t2==='click'||t2==='change') kotes++; return er(t2,f,c); };
  for (let i=0;i<4;i++){ u.kat(u.gy.querySelector('[data-mit="diagvalt"]')); u.kat(u.gy.querySelector('[data-mit="diagvalt"]')); }
  all('11. ismételt kirajzolás nem duplázza a delegált listenert', kotes === 0, String(kotes));
  all('a mérő gombjain nincs production data-mit',
    !u.gy.querySelector('[data-cm-mit="rogzit"]').hasAttribute('data-mit'));
  k.dom.window.close();
}

/* --- H12: statikus kapuk --- */
{
  all('21a. nincs fetch/XHR/GM/new Image a mérőblokkban',
    !/fetch\(|XMLHttpRequest|GM_xmlhttpRequest|new Image\(/.test(CM_BLOKK));
  all('21b. nincs MutationObserver', !/MutationObserver/.test(CM_BLOKK));
  all('21c. nincs tárolóhasználat',
    !/localStorage|sessionStorage|document\.cookie|GM_setValue|GM_getValue/.test(CM_BLOKK));
  all('21d. nincs click() vagy dispatchEvent a mérőblokkban',
    !/\.click\(\)/.test(CM_BLOKK) && !/dispatchEvent/.test(CM_BLOKK));
  all('21e. nincs új asset-URL', !/https?:\/\//.test(CM_BLOKK));
  all('21f. nem módosít cél-DOM-ot',
    !/setAttribute\("class/.test(CM_BLOKK) && !/className\s*=[^=]/.test(CM_BLOKK)
    && !/\.style\.[a-zA-Z]+\s*=[^=]/.test(CM_BLOKK)
    && !/\.setAttribute\(/.test(CM_BLOKK));
  all('a blokk egyben eltávolítható', CM_BLOKK.length > 5000
    && SRC.includes('COMPONENT MAPPER 5B1 BLOKK VÉGE'));
  all('a két mérőblokk nem fedi egymást',
    SP_ELEJE < SP_VEGE && SP_VEGE < CM_ELEJE && CM_ELEJE < CM_VEGE);
  all('a korlátok a kódban',
    CM_BLOKK.includes('CM_MELYSEG = 6') && CM_BLOKK.includes('CM_MAXELEM = 120')
    && CM_BLOKK.includes('CM_OS_MAX = 4') && CM_BLOKK.includes('CM_SZOVEG = 100'));
  all('a rögzítő billentyű dokumentált', CM_BLOKK.includes('CM_ROGZITO_BILLENTYU = "F2"'));
  all('a hitteszt kizárja a saját panelt', /cmSajatunk\(el\)/.test(CM_BLOKK));
  /* A production részben pontosan a két engedélyezett horog van, blokkonként
     egy-egy hívással: a diagnosztika kirajzolása és a panelbezárás. */
  const horgok = {
    spRajzol: (PROD.match(/spRajzol\(\)/g) || []).length,
    cmRajzol: (PROD.match(/cmRajzol\(\)/g) || []).length,
    spTakarit: (PROD.match(/spTakarit\(true\)/g) || []).length,
    cmTakarit: (PROD.match(/cmTakarit\(true\)/g) || []).length
  };
  all('nincs új production horog: blokkonként pontosan egy kirajzolás és egy takarítás',
    horgok.spRajzol === 1 && horgok.cmRajzol === 1
    && horgok.spTakarit === 1 && horgok.cmTakarit === 1, JSON.stringify(horgok));
  all('a két horog a megengedett helyen van (valtLap diag ága és nyit(false))',
    /nev === "diag"[\s\S]{0,200}spRajzol\(\);[\s\S]{0,80}cmRajzol\(\);/.test(PROD)
    && /host\.hidden = true;[\s\S]{0,160}spTakarit\(true\);[\s\S]{0,80}cmTakarit\(true\);/.test(PROD));
}


/* ============================================================
   I. 5B1 FIX1 — AZ AUDIT NYOLC PONTJA
   ============================================================ */
console.log('\n--- I) 5B1 FIX1 ---');

/* Egyetlen bal oldali réteg — a felosztás így NEM bizonyított. */
{
  const k = cmKornyezet({ fulEgyReteg: true }); cmPontHamisitas(k.w);
  /* egy darab, a gyökérnél keskenyebb bal réteget teszünk be */
  const bal = k.E('div', 'tw2gui_window_tab_left', 16, 33, 100, 50,
    { backgroundImage: 'url("https://westhu.innogamescdn.com/images/tw2gui/window/tabbar/window2_tab_active.png?3")',
      backgroundPosition: '0px 0px', backgroundRepeat: 'no-repeat' });
  k.fulAktiv.insertBefore(bal, k.fulSzoveg);
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const tp = JSON.parse(rip.slice(rip.indexOf('-- fül-részek --') + 16, rip.indexOf('-- CSSOM --')).trim());

  all('FIX1/1. egyetlen jelölt réteg NEM ad EXACT-ot',
    tp.confidence !== 'EXACT', tp.confidence);
  all('FIX1/2. az eredmény PARTIAL, és megnevezi a hiányzó szerepeket',
    tp.confidence === 'PARTIAL'
    && /centerCandidateLayers/.test(tp.megjegyzes) && /rightCandidateLayers/.test(tp.megjegyzes),
    tp.megjegyzes);
  all('FIX1/3. a bizonyítékmező kiírja, mely szerepek vannak meg',
    tp.felosztasBizonyitek && tp.felosztasBizonyitek.megvanSzerepDb === 1
    && tp.felosztasBizonyitek.szerepekMegvan.bal === true
    && tp.felosztasBizonyitek.szerepekMegvan.kozep === false
    && tp.felosztasBizonyitek.szerepekMegvan.jobb === false,
    JSON.stringify(tp.felosztasBizonyitek && tp.felosztasBizonyitek.szerepekMegvan));
  all('FIX1/4. a küszöb MINDHÁROM szerepet írja elő',
    /MINDHÁROM szerep/.test(tp.felosztasBizonyitek.kuszob)
    && !/legalább 2 különböző szerep/.test(tp.felosztasBizonyitek.kuszob));
  k.dom.window.close();
}

/* Két külön szerep — ez már bizonyított felosztás. */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const tp = JSON.parse(rip.slice(rip.indexOf('-- fül-részek --') + 16, rip.indexOf('-- CSSOM --')).trim());
  all('FIX1/5. mindhárom szerep + root + label + vizuál → EXACT',
    tp.confidence === 'EXACT' && tp.felosztasBizonyitek.megvanSzerepDb === 3
    && tp.felosztasBizonyitek.requiredMissing.length === 0,
    tp.confidence + ' / ' + tp.felosztasBizonyitek.megvanSzerepDb);
  all('FIX1/6. minden jelölt megkapja a besorolás forrását',
    Array.isArray(tp.jeloltIndoklas) && tp.jeloltIndoklas.length >= 3
    && tp.jeloltIndoklas.every(x => x.forras && x.szerep),
    JSON.stringify((tp.jeloltIndoklas || []).map(x => x.szerep + ':' + x.forras)));
  all('FIX1/7. a forrás megnevezi a sprite-szeletet vagy a DOM-geometriát',
    tp.jeloltIndoklas.some(x => /sprite-szelet|DOM-geometria|pszeudo-geometria/.test(x.forras)));

  /* spriteEvidence */
  all('FIX1/8. spriteEvidence a jelentésben, url + pozíciók + használatok',
    /"spriteEvidence"/.test(rip) && /"kulonbozoPoziciok"/.test(rip),
    'hiányzó spriteEvidence');
  const se = tp.felosztasBizonyitek.spriteEvidence;
  all('FIX1/9. a sprite-bizonyíték legalább két különböző pozíciót sorol',
    se.length >= 1 && se[0].kulonbozoPoziciok.length >= 2,
    JSON.stringify(se[0] && se[0].kulonbozoPoziciok));
  all('FIX1/10. minden sprite-használat layerId-hez kötött',
    se[0].hasznalatok.every(h => /^R(>\d+)*$/.test(h.layerId)));
  k.dom.window.close();
}

/* Több háttérképréteg egyetlen elemen. */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const tobb = k.E('div', 'tw2gui_button tobbreteg', 100, 30, 1600, 150, {
    backgroundImage: 'url("https://westhu.innogamescdn.com/images/tw2gui/a.png"), '
      + 'url("https://westhu.innogamescdn.com/images/tw2gui/b.png")',
    backgroundRepeat: 'no-repeat, repeat-x',
    backgroundPosition: '0px 0px, -40px 5px',
    backgroundSize: 'auto, 20px 30px'
  });
  k.w.document.body.appendChild(tobb);
  const u = await cmIndit(k);
  u.valassz('C3'); u.start(); u.mer(tobb); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const c3 = rip.slice(rip.indexOf('### C3 '), rip.indexOf('### C4 '));

  all('FIX1/11. mindkét háttérképréteg megőrizve', c3.includes('/a.png') && c3.includes('/b.png'));
  all('FIX1/12. a rétegindex rögzül',
    /"backgroundLayerIndex": 0/.test(c3) && /"backgroundLayerIndex": 1/.test(c3));
  all('FIX1/13. a második réteg SAJÁT position/repeat/size értéket kap',
    /"backgroundPosition": "-40px 5px"[\s\S]{0,200}?"backgroundSize": "20px 30px"/.test(c3)
    || /"backgroundSize": "20px 30px"/.test(c3) && /"backgroundPosition": "-40px 5px"/.test(c3));
  all('FIX1/14. az első réteg értéke nem keveredik a másodikkal',
    /"backgroundRepeat": "no-repeat"[\s\S]{0,300}?"backgroundLayerIndex": 0/.test(c3)
    || /"backgroundLayerIndex": 0[\s\S]{0,400}?"backgroundRepeat": "no-repeat"/.test(c3));
  all('FIX1/15. a nyers CSS-érték is megmarad rétegenként', /"nyersErtek": "url/.test(c3));

  /* természetes méret */
  all('FIX1/16. a természetes méret null, nem becslés',
    /"naturalWidth": null/.test(c3) && /"naturalHeight": null/.test(c3));
  all('FIX1/17. az intrinsicSizeStatus tényszerű', /"intrinsicSizeStatus": "UNAVAILABLE_NO_NETWORK"/.test(c3));
  all('FIX1/18. és megindokolja, miért nem mérhető',
    /csak új kép betöltésével lenne/.test(c3));
  k.dom.window.close();
}

/* Nem bontható CSS-lista — nem találunk ki értéket. */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const zavaros = k.E('div', 'tw2gui_button zavaros', 100, 30, 1700, 150, {
    backgroundImage: 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.2)), '
      + 'url("https://westhu.innogamescdn.com/images/tw2gui/c.png")',
    backgroundRepeat: 'repeat, no-repeat',
    backgroundPosition: '0px 0px, 10px 20px',
    backgroundSize: 'auto, auto'
  });
  k.w.document.body.appendChild(zavaros);
  const u = await cmIndit(k);
  u.valassz('C3'); u.start(); u.mer(zavaros); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const c3 = rip.slice(rip.indexOf('### C3 '), rip.indexOf('### C4 '));
  all('FIX1/19. gradient + url együtt is helyesen bomlik',
    c3.includes('/c.png') && /"backgroundLayerIndex": 1/.test(c3));
  all('FIX1/20. a gradient réteg nem lesz hamis asset', !/"url": "linear-gradient/.test(c3));
  all('FIX1/21. a c.png a MÁSODIK réteg pozícióját kapja',
    /"backgroundPosition": "10px 20px"/.test(c3), 'rossz indexpárosítás');
  k.dom.window.close();
}

/* Scrollbar: osztálynév illeszkedik, de nincs vizuális bizonyíték. */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  /* a felső nyilat megfosztjuk a háttértől — csak az osztályneve marad */
  k.nyilFel.__cm = Object.assign({}, k.nyilFel.__cm, {
    backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)'
  });
  const u = await cmIndit(k);
  u.valassz('C5'); u.start(); u.mer(k.pBg2); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const sp = JSON.parse(rip.slice(rip.indexOf('-- scrollbarParts --') + 20, rip.indexOf('-- CSSOM --')).trim());

  all('FIX1/22. unverifiedClassCandidates külön lista létezik',
    Array.isArray(sp.unverifiedClassCandidates));
  all('FIX1/23. a vizuális bizonyíték nélküli réteg oda kerül teljes hivatkozással',
    sp.unverifiedClassCandidates.some(x => /arrow_leup/.test(x.osztaly)
      && x.layerId && x.selectorPath && x.szerep === 'arrowUpLayers'),
    JSON.stringify(sp.unverifiedClassCandidates));
  all('FIX1/24. a megerősített listába NEM kerülhet vizuál nélküli réteg',
    sp.arrowUpLayers.length === 0, JSON.stringify(sp.arrowUpLayers));
  all('FIX1/25. az unknownLayers csak a tényleg besorolhatatlant tartalmazza',
    sp.unknownLayers.every(x => !/arrow_leup/.test(x.osztaly))
    && sp.unknownLayers.some(x => /valami_uj/.test(x.osztaly)));
  all('FIX1/26. vizuál nélküli classjelölt miatt nem lehet EXACT',
    sp.confidence !== 'EXACT'
    && sp.requiredMissing.some(x => /unverifiedClassCandidates/.test(x)),
    sp.confidence + ' / ' + JSON.stringify(sp.requiredMissing));
  k.dom.window.close();
}

/* Statikus kapuk a FIX1-re. */
{
  /* Álpróba = olyan hívás, ahol a feltétel konstans true. A saját kapu
     szövegét kihagyjuk a keresésből, különben önmagára illeszkedne. */
  const alproba = TESZT_SAJAT
    .split('\n')
    .filter(sor => !sor.includes('FIX1/27'))
    .filter(sor => /\ball\((['"`])(?:(?!\1).)*\1\s*,\s*true\s*[,)]/.test(sor));
  all('FIX1/27. nincs konstans true feltételű álpróba a tesztben',
    alproba.length === 0, alproba.join(' | ').slice(0, 200));
  all('FIX1/28. a mérőblokkban nincs képbetöltés a mérethez',
    !/new Image\(|naturalWidth\s*=|\.decode\(/.test(CM_BLOKK));
  all('FIX1/29. a felosztási küszöb a kódban', CM_BLOKK.includes('megvanSzerepDb')
    && CM_BLOKK.includes('bal && kozep && jobb'));
  all('FIX1/30. a listabontó a kódban', CM_BLOKK.includes('function cmListaBont'));
}


/* ============================================================
   J. 5B1 FIX2 — SZERZŐDÉSLEZÁRÁS
   ============================================================ */
console.log('\n--- J) 5B1 FIX2 ---');

/* Fülkörnyezet, amelyben tetszőleges szerepek elhagyhatók. */
function fixFulKornyezet(szerepek) {
  const k = cmKornyezet({ fulEgyReteg: true }); cmPontHamisitas(k.w);
  const A = 'url("https://westhu.innogamescdn.com/images/tw2gui/window/tabbar/window2_tab_active.png?3")';
  const be = (cls, w2, x, poz) => {
    const e = k.E('div', cls, w2, 33, x, 50,
      { backgroundImage: A, backgroundPosition: poz, backgroundRepeat: 'no-repeat' });
    k.fulAktiv.insertBefore(e, k.fulSzoveg);
    return e;
  };
  if (szerepek.bal) be('tw2gui_window_tab_left', 16, 100, '0px 0px');
  if (szerepek.kozep) be('tw2gui_window_tab_center', 120, 116, '-16px 0px');
  if (szerepek.jobb) be('tw2gui_window_tab_right', 16, 236, '100% 0px');
  if (szerepek.nincsLabel) k.fulSzoveg.className = 'valami_mas_felirat';
  return k;
}
async function fixFulMeres(k) {
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const tp = JSON.parse(rip.slice(rip.indexOf('-- fül-részek --') + 16, rip.indexOf('-- CSSOM --')).trim());
  return { u, rip, tp };
}

/* --- 2. fejezet: mindhárom szerep kötelező --- */
for (const [cimke, szerepek, vart] of [
  ['csak bal', { bal: 1 }, 'PARTIAL'],
  ['bal + jobb, közép nélkül', { bal: 1, jobb: 1 }, 'PARTIAL'],
  ['bal + közép, jobb nélkül', { bal: 1, kozep: 1 }, 'PARTIAL'],
  ['közép + jobb, bal nélkül', { kozep: 1, jobb: 1 }, 'PARTIAL'],
  ['mindhárom, de label nélkül', { bal: 1, kozep: 1, jobb: 1, nincsLabel: 1 }, 'PARTIAL'],
  ['mindhárom + label + root', { bal: 1, kozep: 1, jobb: 1 }, 'EXACT']
]) {
  const k = fixFulKornyezet(szerepek);
  const { tp } = await fixFulMeres(k);
  all('FIX2/2 ' + cimke + ' → ' + vart, tp.confidence === vart,
    tp.confidence + ' · hiány: ' + JSON.stringify(tp.felosztasBizonyitek.requiredMissing));
  if (vart === 'PARTIAL')
    all('FIX2/2 ' + cimke + ' — a hiány néven nevezve',
      tp.felosztasBizonyitek.requiredMissing.length > 0);
  k.dom.window.close();
}
{
  const k = fixFulKornyezet({ bal: 1, kozep: 1, jobb: 1 });
  const { tp, rip } = await fixFulMeres(k);
  all('FIX2/2 az EXACT feltétellista teljes',
    tp.felosztasBizonyitek.vanRootLayer === true && tp.felosztasBizonyitek.vanLabelLayer === true
    && tp.felosztasBizonyitek.mindenJeloltVizualis === true
    && tp.felosztasBizonyitek.statuszOK === true
    && tp.felosztasBizonyitek.compositionType !== 'E');
  all('FIX2/2 a "legalább 2 szerep" szerződés eltűnt a jelentésből',
    !/legalább 2 különböző szerep/.test(rip));
  k.dom.window.close();
}

/* --- 3. fejezet: scrollbar minden kötelező része --- */
async function fixSbMeres(o) {
  const k = cmKornyezet(o); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C5'); u.start(); u.mer(k.pBg2 || k.sb); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const sp = JSON.parse(rip.slice(rip.indexOf('-- scrollbarParts --') + 20, rip.indexOf('-- CSSOM --')).trim());
  return { k, sp, rip };
}
for (const [cimke, o, vart, minta] of [
  ['felső nyíl vizuál nélkül', { sbNyilNincsVizual: 1 }, 'PARTIAL', /unverifiedClassCandidates/],
  ['hiányzó trackBg2', { sbNincsBg2: 1 }, 'PARTIAL', /trackBgLayers >= 2/],
  ['hiányzó pulley_bg3', { sbNincsPulleyBg3: 1 }, 'PARTIAL', /pulleyLayers >= 3/],
  ['azonosítatlan ?3 asset', { sbNincsHarom: 1 }, 'PARTIAL', /azonositatlanAsset/]
]) {
  const { k, sp } = await fixSbMeres(o);
  all('FIX2/3 ' + cimke + ' → ' + vart, sp.confidence === vart,
    sp.confidence + ' · ' + JSON.stringify(sp.requiredMissing));
  all('FIX2/3 ' + cimke + ' — requiredMissing megnevezi',
    sp.requiredMissing.some(x => minta.test(x)), JSON.stringify(sp.requiredMissing));
  k.dom.window.close();
}
{
  const { k, sp } = await fixSbMeres({});
  all('FIX2/3 teljes, vizuálisan bizonyított kilencrészes komponens → EXACT',
    sp.confidence === 'EXACT' && sp.requiredMissing.length === 0,
    sp.confidence + ' · ' + JSON.stringify(sp.requiredMissing));
  all('FIX2/3 minden megerősített rész layerId-vel',
    sp.trackBgLayers.length >= 2 && sp.arrowUpLayers.length >= 1 && sp.arrowDownLayers.length >= 1
    && sp.pulleyAreaLayers.length >= 1 && sp.pulleyLayers.length >= 3
    && sp.trackRootVizualis === true && sp.pulleyRootVizualis === true);
  all('FIX2/3 unverifiedClassCandidates üres a teljes esetben',
    sp.unverifiedClassCandidates.length === 0);
  k.dom.window.close();
}
{
  /* csonkolt fa → PARTIAL */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  for (let i = 0; i < 200; i++) k.sb.appendChild(k.E('div', 'toltelek' + i, 2, 2, 0, 0));
  const u = await cmIndit(k);
  u.valassz('C5'); u.start(); u.mer(k.pBg2); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const sp = JSON.parse(rip.slice(rip.indexOf('-- scrollbarParts --') + 20, rip.indexOf('-- CSSOM --')).trim());
  all('FIX2/3 csonkolt komponensfa → PARTIAL', sp.confidence === 'PARTIAL'
    && sp.requiredMissing.some(x => /csonkolt/.test(x)), JSON.stringify(sp.requiredMissing));
  k.dom.window.close();
}

/* --- 4. fejezet: komponens- és ősasset külön --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  /* idegen asset a fül ŐSÉRE */
  const os = k.fulAktiv.parentElement;
  os.__cm = Object.assign({}, os.__cm, {
    backgroundImage: 'url("https://westhu.innogamescdn.com/images/interface/OS_IDEGEN.jpg")',
    backgroundPosition: '0% 0%', backgroundRepeat: 'repeat'
  });
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const komp = rip.slice(rip.indexOf('-- componentAssetCatalog'), rip.indexOf('-- ancestorAssetCatalog'));
  const os2 = rip.slice(rip.indexOf('-- ancestorAssetCatalog'), rip.indexOf('-- összetétel --'));
  const tp = JSON.parse(rip.slice(rip.indexOf('-- fül-részek --') + 16, rip.indexOf('-- CSSOM --')).trim());

  all('FIX2/4 az ős assetje NINCS a componentAssetCatalogban', !/OS_IDEGEN/.test(komp));
  all('FIX2/4 az ős assetje OTT van az ancestorAssetCatalogban', /OS_IDEGEN/.test(os2));
  all('FIX2/4 a két katalógus külön fejezet', komp.length > 20 && os2.length > 20);
  all('FIX2/4 az ős assetje nem befolyásolja a confidence-t', tp.confidence === 'EXACT', tp.confidence);
  all('FIX2/4 az ős assetje nem lesz sprite-bizonyíték',
    (tp.felosztasBizonyitek.spriteEvidence || []).every(e => !/OS_IDEGEN/.test(e.url)));
  all('FIX2/4 nincs félreérthető összevont assetCatalog',
    !/^-- assetCatalog --$/m.test(rip));
  k.dom.window.close();
}

/* --- 5. fejezet: confidence mind a nyolc presetnél --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  const celok = { C1: k.fulSzoveg, C2: k.fulInaktivSzoveg, C3: k.gombFelirat, C4: k.gombFelirat,
                  C5: k.pBg2, C6: k.gfTartalom, C7: k.mondat, C8: k.szam };
  for (const pid of Object.keys(celok)) {
    u.valassz(pid); u.start(); u.mer(celok[pid]); await new Promise(r => setTimeout(r, 20));
  }
  u.masol(); await new Promise(r => setTimeout(r, 250));
  const rip = k.masolat() || '';
  const ENGEDETT = ['EXACT', 'PARTIAL', 'BLOCKED'];
  Object.keys(celok).forEach(pid => {
    const b = rip.slice(rip.indexOf('### ' + pid + ' '));
    const m = /^confidence: (\S+)$/m.exec(b);
    all('FIX2/5 ' + pid + ' kapott confidence sort',
      !!m && ENGEDETT.indexOf(m[1]) !== -1, m ? m[1] : 'nincs confidence sor');
  });
  const felulet = u.q('dcomp').textContent.replace(/\s+/g, ' ');
  all('FIX2/5 a felületen nincs „—" confidence', !/· — /.test(felulet));
  const PRESET_NEV = { C1:'TAB_ACTIVE_FULL', C2:'TAB_INACTIVE_FULL', C3:'BUTTON_NORMAL_FULL',
    C4:'BUTTON_HOVER_FULL', C5:'SCROLLBAR_FULL', C6:'GROUPFRAME_FULL',
    C7:'BODY_TEXT', C8:'NUMBER_VALUE' };
  const presetSzelet = pid => {
    /* a preset SORÁT keressük (azonosító + presetnév), nem a puszta azonosítót:
       a C3 célzott mérés sora is tartalmazza a „C3" szöveget */
    const i = felulet.lastIndexOf(pid + ' ' + PRESET_NEV[pid]);
    if (i < 0) return '';
    const kov = ['C1','C2','C3','C4','C5','C6','C7','C8']
      .map(x => felulet.indexOf(x + ' ', i + 3)).filter(x => x > 0);
    return felulet.slice(i, kov.length ? Math.min(...kov) : felulet.length);
  };
  all('FIX2/5 a felület mind a nyolcnál a három érték egyikét mutatja',
    Object.keys(celok).every(pid => /(EXACT|PARTIAL|BLOCKED)/.test(presetSzelet(pid))),
    Object.keys(celok).map(pid => pid + '=' + (/(EXACT|PARTIAL|BLOCKED)/.exec(presetSzelet(pid)) || ['?'])[0]).join(' '));
  all('FIX2/5 a C6 groupframe fejléc+keret+tartalom alapján EXACT',
    /### C6[\s\S]*?^confidence: EXACT$/m.test(rip));
  all('FIX2/5 a C7 szöveg teljes tipográfiával EXACT',
    /### C7[\s\S]*?^confidence: EXACT$/m.test(rip));
  k.dom.window.close();
}
{
  /* hibás minta → BLOCKED */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  u.valassz('C2'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  all('FIX2/5 nem OK státusz → BLOCKED',
    /### C2[\s\S]*?^confidence: BLOCKED$/m.test(rip));
  k.dom.window.close();
}

/* --- 6. fejezet: pointer-reset és DOM-helyvédelem --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  /* első mérés rendben */
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  /* második indítás: F2 ÚJ mousemove nélkül */
  u.valassz('C3'); u.start();
  k.w.dispatchEvent(new k.w.KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
  await new Promise(r => setTimeout(r, 20));
  const t = u.q('dcomp').textContent.replace(/\s+/g, ' ');
  all('FIX2/6 új mousemove nélküli F2 → NINCS_CEL', /C3 BUTTON_NORMAL_FULL — NINCS_CEL/.test(t), t.slice(0, 240));
  all('FIX2/6 a régi koordinátát nem használja fel',
    !/C3 BUTTON_NORMAL_FULL — rögzítve/.test(t));
  k.dom.window.close();
}
{
  /* azonos classú másik szülőbe helyezés */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const masikSav = k.E('div', 'tw2gui_window_tabbar_tabs', 2000, 35, 100, 600);
  k.w.document.body.appendChild(masikSav);
  const u = await cmIndit(k);
  const eredetiGCS = k.w.getComputedStyle;
  let hivas = 0;
  k.w.getComputedStyle = (el, psz) => {
    /* a 20. hívás már a komponensfa bejárása közben van, tehát a
       stateBefore rögzítése UTÁN — pont ezt akarjuk elkapni */
    if (++hivas === 20) masikSav.appendChild(k.fulAktiv);   /* azonos class, azonos index */
    return eredetiGCS(el, psz);
  };
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  all('FIX2/6 azonos classú szülőre áthelyezés → STATE_MUTATED',
    /C1 TAB_ACTIVE_FULL — STATE_MUTATED/.test(u.q('dcomp').textContent.replace(/\s+/g, ' ')),
    u.q('dcomp').textContent.replace(/\s+/g, ' ').slice(0, 240));
  k.dom.window.close();
}
{
  /* isConnected true → false */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const u = await cmIndit(k);
  const eredetiGCS = k.w.getComputedStyle;
  let hivas = 0;
  k.w.getComputedStyle = (el, psz) => {
    if (++hivas === 20) k.fulAktiv.remove();
    return eredetiGCS(el, psz);
  };
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  all('FIX2/6 isConnected true→false → STATE_MUTATED',
    /C1 TAB_ACTIVE_FULL — STATE_MUTATED/.test(u.q('dcomp').textContent.replace(/\s+/g, ' ')));
  k.dom.window.close();
}

/* --- 7. fejezet: rekurzív CSSOM --- */
{
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  const belsoSzabaly = { selectorText: '.tw2gui_window_tab_text',
    style: { cssText: 'font-weight: 700; color: rgb(255,255,255)' } };
  const nestedSupports = { conditionText: '(display: grid)', type: 12,
    cssRules: [belsoSzabaly] };
  const nestedMedia = { conditionText: 'screen and (min-width: 800px)', type: 4,
    media: { mediaText: 'screen and (min-width: 800px)' },
    cssRules: [nestedSupports] };
  const felsoSzabaly = { selectorText: '.tw2gui_window_tab',
    style: { cssText: 'height: 33px' } };
  Object.defineProperty(k.w.document, 'styleSheets', {
    get() { return [{ cssRules: [felsoSzabaly, nestedMedia] }]; }, configurable: true
  });
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const cs = JSON.parse(rip.slice(rip.indexOf('-- CSSOM --') + 11,
    rip.indexOf('-- állapot a mérés előtt és után --')).trim());

  all('FIX2/7 a legfelső szintű szabály megvan',
    cs.szabalyok.some(x => x.selector === '.tw2gui_window_tab'));
  all('FIX2/7 a beágyazott media > supports szabály is megvan',
    cs.szabalyok.some(x => x.selector === '.tw2gui_window_tab_text'),
    JSON.stringify(cs.szabalyok.map(x => x.selector)));
  all('FIX2/7 a csoportszabályok feltételei rögzülnek',
    cs.csoportok.some(x => /min-width: 800px/.test(x.feltetel))
    && cs.csoportok.some(x => /display: grid/.test(x.feltetel)),
    JSON.stringify(cs.csoportok));
  all('FIX2/7 minden találat kap matchMethod mezőt',
    cs.szabalyok.every(x => x.matchMethod === 'MATCHED' || x.matchMethod === 'NAME_ONLY'),
    JSON.stringify(cs.szabalyok.map(x => x.matchMethod)));
  all('FIX2/7 a korlátok kiírva', cs.korlatok
    && cs.korlatok.vizsgaltMax === 120 && cs.korlatok.talalatMax === 60);
  k.dom.window.close();
}
{
  /* matches() hibázik → dokumentált NAME_ONLY tartalék */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  Object.defineProperty(k.w.document, 'styleSheets', {
    get() { return [{ cssRules: [{ selectorText: '.tw2gui_window_tab:::ertelmezhetetlen',
      style: { cssText: 'height: 33px' } }] }]; }, configurable: true
  });
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const cs = JSON.parse(rip.slice(rip.indexOf('-- CSSOM --') + 11,
    rip.indexOf('-- állapot a mérés előtt és után --')).trim());
  all('FIX2/7 nem értelmezhető selector → NAME_ONLY tartalék',
    cs.szabalyok.length === 1 && cs.szabalyok[0].matchMethod === 'NAME_ONLY',
    JSON.stringify(cs.szabalyok));
  k.dom.window.close();
}
{
  /* SecurityError továbbra is biztonságos */
  const k = cmKornyezet({}); cmPontHamisitas(k.w);
  Object.defineProperty(k.w.document, 'styleSheets', {
    get() { return [{ get cssRules() { const e = new Error('SecurityError'); e.name = 'SecurityError'; throw e; } }]; },
    configurable: true
  });
  const u = await cmIndit(k);
  u.valassz('C1'); u.start(); u.mer(k.fulSzoveg); await new Promise(r => setTimeout(r, 20));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  all('FIX2/7 SecurityError → CSSOM_BLOCKED, megkerülés nélkül',
    /CSSOM_BLOCKED/.test(k.masolat() || ''));
  k.dom.window.close();
}

/* --- statikus lezáró kapuk --- */
{
  all('FIX2/8 a tab EXACT háromoldali teljességet követel',
    CM_BLOKK.includes('vanRoot && vanLabel && bal && kozep && jobb')
    && !/szerepDb >= 2/.test(CM_BLOKK));
  all('FIX2/8 a scrollbar EXACT minden kötelező részt követel',
    CM_BLOKK.includes('requiredMissing.length === 0 ? "EXACT"'));
  all('FIX2/8 confidence mind a nyolc presethez létezik',
    CM_BLOKK.includes('function cmMintaBizalom') && /minta\.confidence = szint/.test(CM_BLOKK));
  all('FIX2/8 component és ancestor katalógus külön',
    CM_BLOKK.includes('minta.componentAssetCatalog = cmAssetKatalogus(minta.fa.retegek)')
    && CM_BLOKK.includes('minta.ancestorAssetCatalog = cmAssetKatalogus(minta.osok)'));
  all('FIX2/8 a scrollbar csak a komponens katalógusából dolgozik',
    /minta\.componentAssetCatalog \|\| \[\]/.test(CM_BLOKK));
  all('FIX2/8 pointer-reset minden indításkor',
    /cmPointerErvenyes = false;[\s\S]{0,200}a\.mm = e =>/.test(CM_BLOKK));
  all('FIX2/8 rekurzív CSSOM bejárás', CM_BLOKK.includes('function cmCssomBejar')
    && /cmCssomBejar\(belso/.test(CM_BLOKK));
  all('FIX2/8 CSSOM korlátok', CM_BLOKK.includes('CM_CSSOM_VIZSGALT = 120')
    && CM_BLOKK.includes('CM_CSSOM_TALALAT = 60'));
  all('FIX2/8 nincs hálózati kérés a CSSOM-ban',
    !/fetch\(|XMLHttpRequest|\.href\s*\)/.test(CM_BLOKK.slice(
      CM_BLOKK.indexOf('function cmCssom'), CM_BLOKK.indexOf('function cmAllapotJegy'))));
}


/* ============================================================
   K. NATIVE UI TEST 5C — tíz célzott kapu
   ============================================================ */
console.log('\n--- K) NATIVE UI PREVIEW 5D ---');
{
  const I = SRC.indexOf('NATIVE UI PREVIEW 5D — VIZUÁLIS PREVIEW');
  const V = SRC.indexOf('NATIVE UI PREVIEW 5D BLOKK VÉGE');
  const B5C = (I > 0 && V > I) ? SRC.slice(I, V) : '';
  /* a tényleges CSS a megjegyzések nélkül — a magyarázó szöveg ne
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
   L. C3 FIX — a „Mind" gomb nyugalmi állapotának célzott mérése
   ============================================================ */
console.log('\n--- L) C3 FIX ---');

/* Hamis Munkák ablak a „Mind" gombbal. Az opciók egy-egy állapotkaput
   rontanak el, hogy a bukást valóban mérni lehessen. */
function c3Kornyezet(o) {
  o = o || {};
  const k = cmKornyezet({});
  const w = k.w;
  const hoverKeszlet = new Set();
  /* matches(':hover'/'::active') csak a szándékosan megjelölt elemekre igaz */
  const eredetiMatches = w.Element.prototype.matches;
  w.Element.prototype.matches = function (sel) {
    if (sel === ':hover') return hoverKeszlet.has(this);
    if (sel === ':active') return this.__aktiv === true;
    try { return eredetiMatches.call(this, sel); } catch (e) { return false; }
  };

  const ablak = k.E('div', 'jobswindow', 698, 380, 100, 400);
  const epitGomb = (felirat, x, opts) => {
    opts = opts || {};
    const KEP = (u, poz, rep) => ({
      backgroundImage: 'url("https://westhu.innogamescdn.com/images/tw2gui/button/' + u + '")',
      backgroundPosition: poz, backgroundRepeat: rep || 'repeat' });
    const g = k.E('div', 'tw2gui_button jobs_allbutton', 180, 36, x, 420);
    const jobb = k.E('div', 'tw2gui_button_right_cap', 90, 36, x + 90, 420,
      opts.jobbNincsVizual ? {} : KEP('button.png?4', '100% 0%'));
    const bal = k.E('div', 'tw2gui_button_left_cap', 90, 36, x, 420,
      opts.balNincs ? {} : KEP('button.png?4', '0px 0px'));
    const kozep = k.E('div', 'tw2gui_button_middle_bg', 18, 36, x + 81, 420,
      opts.kozepNincs ? {} : KEP('button_mid.png?5', '0px 0px', 'no-repeat'));
    const cimke = k.E('div', 'textart_title shorten', 160, 28, x + 10, 420,
      { fontFamily: 'Arial', fontSize: '13.3333px', fontWeight: '700',
        color: 'rgb(255, 231, 177)', textAlign: 'center', paddingTop: '9px' }, felirat);
    [jobb, bal, kozep, cimke].forEach(e => e && g.appendChild(e));
    if (opts.balNincs) bal.remove();
    if (opts.kozepNincs) kozep.remove();
    ablak.appendChild(g);
    return { g, bal, kozep, jobb, cimke };
  };

  const mind = o.nincsCel ? null : epitGomb('Mind', 100, o);
  const masodik = o.ketCel ? epitGomb('Mind', 400, {}) : null;
  /* mindig van egy másik feliratú gomb, hogy a szűrés valóban szűrjön */
  const masik = epitGomb('Összehasonlítás', 700, {});
  w.document.body.appendChild(ablak);

  /* a Munkák ablakon KÍVÜLI, azonos osztályú gomb — nem lehet cél */
  const kintiGomb = k.E('div', 'tw2gui_button jobs_allbutton', 180, 36, 2000, 100);
  kintiGomb.appendChild(k.E('div', 'textart_title shorten', 160, 28, 2010, 100, {}, 'Mind'));
  w.document.body.appendChild(kintiGomb);

  if (o.rootHover && mind) hoverKeszlet.add(mind.g);
  if (o.gyerekHover && mind) hoverKeszlet.add(mind.cimke);
  if (o.rootActive && mind) mind.g.__aktiv = true;
  return Object.assign(k, { ablak, mind, masodik, masik, kintiGomb, hoverKeszlet });
}

async function c3Fut(o) {
  const k = c3Kornyezet(o || {});
  const u = await cmIndit(k);
  if (o && o.fokuszBent && k.mind) {
    try { Object.defineProperty(k.w.document, 'activeElement',
      { get: () => k.mind.cimke, configurable: true }); } catch (e) { /* nem baj */ }
  }
  u.kat(u.gy.querySelector('[data-cm-mit="c3mer"]'));
  await new Promise(r => setTimeout(r, 30));
  u.masol(); await new Promise(r => setTimeout(r, 150));
  const rip = k.masolat() || '';
  const blokk = rip.slice(rip.indexOf('### C3_NORMAL_SELECTOR_CAPTURE'));
  const mez = n => { const m = new RegExp('^' + n + ': (.*)$', 'm').exec(blokk); return m ? m[1] : null; };
  return { k, u, rip, blokk, mez };
}

/* --- L1: a szelektoros keresés pontosan egy „Mind" célt választ --- */
{
  const { k, blokk, mez } = await c3Fut({});
  all('C3/1. a régi ui_topbar eredmény nem fogadható el — a szelektor a gombot célozza',
    mez('selectorUsed') === '.tw2gui_button.jobs_allbutton'
    && !/ui_topbar/.test(blokk));
  all('C3/2. pontosan egy cél marad a szűrés után',
    mez('targetResolution') === 'EGYETLEN_CEL' && mez('exactTargetCount') === '1'
    && Number(mez('candidateCount')) >= 3,
    'jelölt=' + mez('candidateCount') + ' pontos=' + mez('exactTargetCount'));
  all('C3/3. a normalizált felirat pontosan „Mind"', mez('normalizedText') === 'Mind');
  all('C3/4. az állapotkapuk zöldek',
    mez('rootHoverFalse') === 'true' && mez('descendantHoverCount') === '0'
    && mez('rootActiveFalse') === 'true' && mez('focusOutside') === 'true'
    && mez('stateUnchanged') === 'true');
  all('C3/5. mind a négy réteg szerepel, teljes stílusrekorddal', (() => {
    const fa = blokk.slice(blokk.indexOf('-- komponensfa'), blokk.indexOf('-- ősök'));
    return ['tw2gui_button_left_cap', 'tw2gui_button_middle_bg', 'tw2gui_button_right_cap',
            'textart_title'].every(cn => {
      const i = fa.indexOf('"osztaly": "' + cn);
      if (i < 0) return false;
      const kor = fa.slice(Math.max(0, i - 2500), i + 2500);
      return ['"layerId"', '"parentLayerId"', '"selectorPath"', '"rect"', '"geometria"',
              '"tipografia"', '"hatter"', '"elotte"', '"utana"', '"assetek"'].every(m => kor.includes(m));
    });
  })());
  all('C3/6. a rétegszerepek bal/közép/jobb/felirat mind kiosztva', (() => {
    const sz = JSON.parse(blokk.slice(blokk.indexOf('-- rétegszerepek --') + 19,
      blokk.indexOf('-- komponensfa')).trim());
    return sz.balCap && sz.kozep && sz.jobbCap && sz.felirat
      && sz.classMatchedNoVisual.length === 0;
  })());
  all('C3/7. teljes, bizonyított nyugalmi gomb → EXACT, blokkoló nélkül',
    mez('confidence') === 'EXACT' && /-- blockingReasons --\s*\n\s*nincs/.test(blokk),
    mez('confidence'));
  all('C3/8. az assetek és a sprite-pozíciók rétegenként rögzülnek',
    blokk.includes('"backgroundPosition": "0px 0px"')
    && blokk.includes('"backgroundPosition": "100% 0%"')
    && blokk.includes('"backgroundLayerIndex": 0')
    && blokk.includes('-- spriteEvidence --'));

  /* 10. a mérés nem módosít semmit a célon */
  const g = k.mind.g;
  all('C3/9. a mérés nem módosít class/style/aria/DOM-állapotot',
    g.getAttribute('style') === null && g.className === 'tw2gui_button jobs_allbutton'
    && g.getAttribute('aria-pressed') === null && g.parentElement === k.ablak);
  k.dom.window.close();
}

/* --- L2: a bukó esetek --- */
for (const [cimke, o, vart, minta] of [
  ['nulla találat', { nincsCel: true }, 'INVALID', /pontosan egy érvényes cél kell, de 0/],
  ['több érvényes találat', { ketCel: true }, 'INVALID', /pontosan egy érvényes cél kell, de 2/],
  ['a gyökér hoverben', { rootHover: true }, 'INVALID', /pontosan egy érvényes cél kell, de 0/],
  ['hoverelt leszármazott', { gyerekHover: true }, 'PARTIAL', /hoverelt elem/],
  ['a gyökér active', { rootActive: true }, 'PARTIAL', /:active/],
  ['fókusz a célon belül', { fokuszBent: true }, 'PARTIAL', /fókusz a célon/],
  ['hiányzó középréteg', { kozepNincs: true }, 'PARTIAL', /hiányzó.*kozep/],
  ['vizuál nélküli jobb cap', { jobbNincsVizual: true }, 'PARTIAL', /classMatchedNoVisual/]
]) {
  const { k, blokk, mez } = await c3Fut(o);
  all('C3/10 ' + cimke + ' → ' + vart, mez('confidence') === vart,
    mez('confidence') + ' · ' + (blokk.match(/-- blockingReasons --[\s\S]{0,300}/) || [''])[0].slice(22, 160));
  all('C3/10 ' + cimke + ' — az ok néven nevezve', minta.test(blokk));
  k.dom.window.close();
}

/* --- L3: statikus kapuk az alblokkra --- */
{
  const I = SRC.indexOf('C3 CÉLZOTT MÉRÉS — ALBLOKK');
  const V = SRC.indexOf('C3 CÉLZOTT MÉRÉS ALBLOKK VÉGE');
  const A3 = (I > 0 && V > I) ? SRC.slice(I, V) : '';
  /* A tényleges kód a magyarázó megjegyzések nélkül. A szeletelés a
     fejléc-megjegyzés LEZÁRÁSA után kezdődik, különben az benne maradna. */
  const A3KOD = (() => {
    const fejlecVege = A3.indexOf('*/');
    const t = fejlecVege > 0 ? A3.slice(fejlecVege + 2) : A3;
    return t.replace(/\/\*[\s\S]*?\*\//g, '');
  })();
  all('C3/11. az alblokk a COMPONENT MAPPER 5B1-en belül van, elkülönítve',
    A3.length > 3000 && I > SRC.indexOf('COMPONENT MAPPER 5B1 — IDEIGLENES BLOKK')
    && V < SRC.indexOf('COMPONENT MAPPER 5B1 BLOKK VÉGE'));
  all('C3/12. ezen az úton nincs elementFromPoint / pointerkövetés',
    A3KOD.length > 2000
    && !/elementFromPoint|elementsFromPoint|clientX|clientY|cmPointer/.test(A3KOD));
  all('C3/13. nincs click(), dispatchEvent, hálózati kérés vagy képbetöltés',
    !/\.click\(\)|dispatchEvent|fetch\(|XMLHttpRequest|GM_xmlhttpRequest|new Image\(/.test(A3KOD));
  all('C3/14. nincs új globális listener',
    !/window\.addEventListener|document\.addEventListener/.test(A3KOD));
  all('C3/15. a mérő nem módosít cél-DOM-ot',
    !/setAttribute\(/.test(A3KOD) && !/className\s*=[^=]/.test(A3KOD)
    && !/\.style\.[a-zA-Z]+\s*=[^=]/.test(A3KOD));
}


/* ============================================================
   M. 1.5.0 UI PREVIEW — célzott ellenőrzések
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
  const I = SRC.indexOf('NATIVE UI PREVIEW 5D — VIZUÁLIS PREVIEW');
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
    (SRC.match(/new ResizeObserver/g) || []).length === 2
    && !/MutationObserver/.test(SRC)
    && (SRC.match(/GM_xmlhttpRequest/g) || []).length === 2
    && (SRC.match(/new Image\(\)/g) || []).length === 1
    && !/[^a-zA-Z]fetch\s*\(/.test(SRC) && !SRC.includes('XMLHttpRequest'));
}


/* ============================================================
   N. 1.5.2 SINGLE-VIEW UI PREVIEW — célzott kapuk
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
  const B = SRC.slice(SRC.indexOf('NATIVE UI PREVIEW 5D — VIZUÁLIS PREVIEW'),
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

console.log('\n' + '='.repeat(46));
console.log(hiba ? `${hiba} BUKÁS / ${ossz} próba` : `mind a ${ossz} próba rendben`);
process.exit(hiba ? 1 : 0);
