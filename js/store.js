/* ============================================================
   夏天 · 存储 & 通用工具
   ============================================================ */
window.Store = (function () {
    const PREFIX = 'summer_';
    return {
        get(key, def) {
            try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : def; }
            catch (e) { return def; }
        },
        set(key, val) {
            try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
        },
        remove(key) { try { localStorage.removeItem(PREFIX + key); } catch (e) {} }
    };
})();

window.U = (function () {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fmtDate(ts) {
        const d = new Date(ts);
        const p = n => (n < 10 ? '0' + n : '' + n);
        return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function fmtDateShort(ts) {
        const d = new Date(ts);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    // 带种子的伪随机（用于游戏可复现，这里简单用 Math.random 亦可）
    function rand(n) { return Math.floor(Math.random() * n); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let toastTimer;
    function toast(msg) {
        const el = $('#toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
    }

    return { $, $$, esc, fmtDate, fmtDateShort, rand, pick, shuffle, toast };
})();
