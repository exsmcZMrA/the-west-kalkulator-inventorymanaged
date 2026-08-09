// ==UserScript==
// @name         Mesterség-kalkulátor — raktár import
// @namespace    the-west-kalkulator
// @version      1.0
// @description  Egy gomb a játékban, ami átküldi a raktárkészletet a mesterség-kalkulátorba.
// @author       —
// @match        https://*.the-west.hu/game.php*
// @match        https://*.the-west.net/game.php*
// @match        https://*.the-west.com/game.php*
// @match        https://*.the-west.de/game.php*
// @match        https://*.the-west.pl/game.php*
// @match        https://*.the-west.cz/game.php*
// @match        https://*.the-west.sk/game.php*
// @match        https://*.the-west.es/game.php*
// @match        https://*.the-west.fr/game.php*
// @match        https://*.the-west.it/game.php*
// @match        https://*.the-west.nl/game.php*
// @match        https://*.the-west.gr/game.php*
// @match        https://*.the-west.pt/game.php*
// @match        https://*.the-west.ro/game.php*
// @match        https://*.the-west.se/game.php*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @run-at       document-idle
// ==/UserScript==

/* =======================================================================
   A kalkulátor címe. Csak akkor kell hozzányúlni, ha a repó neve vagy a
   GitHub Pages beállítása változik.
   ======================================================================= */
const CALC_URL = "https://exsmczmra.github.io/the-west-kalkulator-inventorymanaged/";

(function () {
    "use strict";

    /* megvárjuk, amíg a játék betölti a raktárat */
    let tries = 0;
    const wait = setInterval(() => {
        if (typeof unsafeWindow !== "undefined" && unsafeWindow.Bag && unsafeWindow.Bag.getItemCount) {
            clearInterval(wait);
            addButton();
        } else if (window.Bag && window.Bag.getItemCount) {
            clearInterval(wait);
            addButton();
        } else if (++tries > 60) {
            clearInterval(wait);
        }
    }, 1000);

    function game() {
        return (typeof unsafeWindow !== "undefined" && unsafeWindow.Bag) ? unsafeWindow : window;
    }

    /* a raktár teljes tartalma: azonosító/1000 : darabszám
       nem rögzített listából dolgozik, ezért új tárgyaknál sem évül el  */
    function readInventory() {
        const W = game();
        const bag = W.Bag;
        const out = [];
        const seen = {};
        Object.keys(bag.items_by_id || {}).forEach(key => {
            const id = Number(key);
            if (!id || seen[id]) return;
            seen[id] = 1;
            let c = 0;
            try { c = bag.getItemCount(id) || 0; } catch (e) { return; }
            if (c > 0 && id % 1000 === 0) out.push((id / 1000) + ":" + c);
        });
        return out;
    }

    function addButton() {
        if (document.getElementById("mk-import-btn")) return;
        const b = document.createElement("div");
        b.id = "mk-import-btn";
        b.textContent = "📦 Kalkulátor";
        b.title = "Raktárkészlet küldése a mesterség-kalkulátorba";
        b.style.cssText = [
            "position:fixed", "left:10px", "bottom:10px", "z-index:99999",
            "background:#2f261d", "color:#e0a844", "border:1px solid #e0a844",
            "border-radius:6px", "padding:6px 12px", "cursor:pointer",
            "font:600 13px/1.2 Arial,sans-serif", "user-select:none",
            "box-shadow:0 2px 6px rgba(0,0,0,.5)"
        ].join(";");
        b.onmouseover = () => b.style.background = "#3d3125";
        b.onmouseout = () => b.style.background = "#2f261d";

        b.onclick = () => {
            const data = readInventory();
            if (!data.length) {
                flash(b, "Üres raktár?");
                return;
            }
            const payload = data.join(",");
            try { GM_setClipboard(payload); } catch (e) { /* nem baj, az URL úgyis viszi */ }

            const url = CALC_URL.replace(/\/+$/, "/") + "#imp=" + payload;
            try {
                GM_openInTab(url, { active: true, insert: true });
            } catch (e) {
                window.open(url, "_blank");
            }
            flash(b, "✓ " + data.length + " tétel");
        };

        document.body.appendChild(b);
    }

    function flash(el, txt) {
        const old = el.textContent;
        el.textContent = txt;
        setTimeout(() => el.textContent = old, 1800);
    }
})();
