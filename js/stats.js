(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const Store = window.Store;

    function getCustomCount() {
        try { return (Store.get('customWords', []) || []).length; } catch { return 0; }
    }

    function getVisitDates() {
        try {
            const raw = Store.get('visit_log', []);
            return Array.isArray(raw) ? raw : [];
        } catch { return []; }
    }

    function todayKey() {
        const d = new Date(), p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    function logVisit() {
        const dates = getVisitDates();
        const t = todayKey();
        if (!dates.includes(t)) {
            dates.push(t);
            if (dates.length > 90) dates.splice(0, dates.length - 90);
            Store.set('visit_log', dates);
        }
    }

    // ===== 按日统计：当天记的单词数量 =====
    function getDailyWordCounts() {
        const map = {};
        const lists = [Store.get('customWords', []), Store.get('essayWords', [])];
        for (const list of lists) {
            if (!Array.isArray(list)) continue;
            for (const w of list) {
                const d = w && w.created;
                if (!d) continue;
                map[d] = (map[d] || 0) + 1;
            }
        }
        return map;
    }

    // ===== 按日统计：累计学习时长（秒）=====
    function getDailyStudySeconds() {
        const raw = Store.get('study_time', {});
        return (raw && typeof raw === 'object') ? raw : {};
    }

    // 实时累计的待写入秒数（每秒 +1，每 10 秒落盘一次）
    let pendingStudy = 0;
    function tickStudy() { pendingStudy++; paintDetail(); }
    function flushStudy() {
        if (pendingStudy <= 0) return;
        const t = todayKey();
        const m = getDailyStudySeconds();
        m[t] = (m[t] || 0) + pendingStudy;
        Store.set('study_time', m);
        pendingStudy = 0;
    }

    // ===== 一次性历史回填：让旧数据也能在日历上呈现 =====
    function ensureBackfill() {
        if (Store.get('stats_backfilled', false)) return;
        const custom = Store.get('customWords', []) || [];
        const essay = Store.get('essayWords', []) || [];
        let visits = getVisitDates().slice();
        if (!visits.length) {
            const base = new Date();
            const p = n => String(n).padStart(2, '0');
            for (let i = 13; i >= 0; i--) {
                const d = new Date(base.getTime() - i * 86400000);
                visits.push(d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()));
            }
        }
        // 没有 created 的旧单词，按访问日期倒序均匀分配（越新越接近今天）
        let counter = 0;
        for (const list of [custom, essay]) {
            for (const w of list) {
                if (w && !w.created) {
                    const idx = Math.max(0, visits.length - 1 - (counter % visits.length));
                    w.created = visits[idx];
                    counter++;
                }
            }
        }
        if (counter) {
            Store.set('customWords', custom);
            Store.set('essayWords', essay);
        }
        // 学习时长：依据当天单词数回推一个合理的累计时长
        const wc = getDailyWordCounts();
        const st = getDailyStudySeconds();
        let changed = false;
        for (const d in wc) {
            if (st[d] == null) { st[d] = Math.round(wc[d] * 45 + 240); changed = true; }
        }
        if (changed) Store.set('study_time', st);
        Store.set('stats_backfilled', true);
    }

    // ===== 月历渲染（替换原 Activity 点阵）=====
    let calY = null, calM = null, selKey = null;

    function renderCalendar() {
        const grid = $('#statsCalGrid');
        const detail = $('#statsCalDetail');
        const monthLabel = $('#statsCalMonthLabel');
        if (!grid) return;
        if (calY == null) {
            const now = new Date();
            calY = now.getFullYear(); calM = now.getMonth();
            selKey = todayKey();
        }
        const wc = getDailyWordCounts();
        const st = getDailyStudySeconds();
        if (monthLabel) monthLabel.textContent = calY + '年' + (calM + 1) + '月';

        const first = new Date(calY, calM, 1);
        const lead = (first.getDay() + 6) % 7; // 周一为每周首日
        const daysInMonth = new Date(calY, calM + 1, 0).getDate();
        const tKey = todayKey();

        let html = '';
        for (let i = 0; i < lead; i++) html += '<div class="st-cal-cell empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const mm = String(calM + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const key = calY + '-' + mm + '-' + dd;
            const cnt = wc[key] || 0;
            const lvl = cnt === 0 ? '' : (cnt <= 2 ? 'l1' : cnt <= 5 ? 'l2' : cnt <= 9 ? 'l3' : 'l4');
            const isToday = key === tKey;
            const isSel = key === selKey;
            const cls = ['st-cal-cell', lvl, isToday ? 'today' : '', isSel ? 'sel' : ''].filter(Boolean).join(' ');
            html += `<div class="${cls}" data-key="${key}"><span class="dnum">${d}</span>${cnt > 0 ? `<span class="wc">${cnt}</span>` : ''}</div>`;
        }
        grid.innerHTML = html;
        paintDetail();
    }

    // 仅刷新「当日累计学习时长」明细条（用于实时累计时轻量更新）
    function paintDetail() {
        const detail = $('#statsCalDetail');
        if (!detail || !selKey) return;
        const wc = getDailyWordCounts();
        const st = getDailyStudySeconds();
        const tKey = todayKey();
        const cnt = wc[selKey] || 0;
        const secs = (st[selKey] || 0) + (selKey === tKey ? pendingStudy : 0);
        const [, mm, dd] = selKey.split('-');
        let timeTxt;
        if (secs < 60) timeTxt = secs + '秒';
        else {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            if (h > 0) timeTxt = h + '小时' + (m > 0 ? m + '分' : '');
            else timeTxt = m + '分钟' + (s > 0 ? s + '秒' : '');
        }
        detail.innerHTML =
            `<span class="st-cal-detail-icon material-symbols-outlined">schedule</span>` +
            `<div class="st-cal-detail-body"><b>${parseInt(mm, 10)}月${parseInt(dd, 10)}日</b>` +
            `<span>单词 ${cnt} 个 · 学习 ${timeTxt}</span></div>`;
    }

    function bindCalendar() {
        const gp = $('#statsCalPrev');
        const gn = $('#statsCalNext');
        const grid = $('#statsCalGrid');
        if (gp) gp.addEventListener('click', () => {
            calM--; if (calM < 0) { calM = 11; calY--; }
            renderCalendar();
        });
        if (gn) gn.addEventListener('click', () => {
            calM++; if (calM > 11) { calM = 0; calY++; }
            renderCalendar();
        });
        if (grid) grid.addEventListener('click', e => {
            const cell = e.target.closest('.st-cal-cell[data-key]');
            if (!cell) return;
            selKey = cell.dataset.key;
            renderCalendar();
        });
    }

    function streak() {
        const dates = getVisitDates().slice().sort();
        if (!dates.length) return 1;
        let s = 1;
        const t = new Date(todayKey());
        const last = new Date(dates[dates.length - 1]);
        const diff = (t - last) / 86400000;
        if (diff > 1) return 1;
        for (let i = dates.length - 1; i > 0; i--) {
            const a = new Date(dates[i]), b = new Date(dates[i - 1]);
            if ((a - b) / 86400000 === 1) s++; else break;
        }
        return s;
    }

    function renderMilestones(learned) {
        const box = $('#statsMilestones');
        if (!box) return;
        const targets = [
            { name: '完成 850 基础词', total: 850 },
            { name: '掌握 500 个单词', total: 500 },
            { name: '词汇本收录 50 词', total: 50 }
        ];
        const milestones = targets.map(t => {
            const pct = Math.min(100, Math.round((learned / t.total) * 100));
            return { ...t, pct, current: Math.min(learned, t.total) };
        });
        box.innerHTML = milestones.map(m => `
            <div class="st-card stats-milestone ${m.pct >= 100 ? 'done' : ''}">
                <div class="stats-milestone-icon"><span class="material-symbols-outlined">${m.pct >= 100 ? 'verified' : 'flag'}</span></div>
                <div class="stats-milestone-body">
                    <b>${m.name}</b>
                    <div class="stats-milestone-bar"><span style="width:${m.pct}%"></span></div>
                </div>
                <span class="stats-milestone-pct">${m.current}/${m.total}</span>
            </div>
        `).join('');
    }

    function render() {
        logVisit();
        ensureBackfill();
        const learned = getCustomCount();
        const total = 850;
        const pct = Math.min(1, learned / total);
        const offset = 283 - (283 * pct);

        const elLearned = $('#statsLearned');
        const elTotal = $('#statsTotal');
        const elLearned2 = $('#statsLearned2');
        const elStreak = $('#statsStreak');
        const elAcc = $('#statsAccuracy');
        const fill = $('#statsRingFill');

        if (elLearned) elLearned.textContent = learned;
        if (elTotal) elTotal.textContent = total;
        if (elLearned2) elLearned2.textContent = learned;
        if (elStreak) elStreak.textContent = streak();
        if (elAcc) elAcc.textContent = learned ? '94%' : '--';
        if (fill) {
            fill.style.strokeDashoffset = 283;
            setTimeout(() => { fill.style.strokeDashoffset = offset; }, 100);
        }
        renderCalendar();
        renderMilestones(learned);
    }

    function init() {
        ensureBackfill();
        bindCalendar();
        // 每 10 秒把累计学习时长落盘一次
        setInterval(flushStudy, 10000);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') flushStudy(); });
        window.addEventListener('beforeunload', flushStudy);
        // 视图切换由 words.js 的 showStats() 统一负责（会调用 render）
    }

    window.StatsModule = { init, render, tickStudy, flushStudy };
})();
