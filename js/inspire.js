/* ============================================================
   夏天 · 灵感游戏模块（灵感扭蛋机 + 海上丝路贸易模拟）
   ============================================================ */
(function () {
    const { $, $$, esc, toast, pick, shuffle } = window.U;
    const DATA = window.DATA;

    /* ============ 星轨结晶（跨页面共享货币，与 gacha.html 共用同一 localStorage 键） ============ */
    const CRYSTAL_KEY = 'summer_crystal_v1';
    const DAILY_CRYSTAL = 20000;
    function _cToday(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
    function _cGet(){ try{ const r=localStorage.getItem(CRYSTAL_KEY); if(r) return JSON.parse(r); }catch(e){} return {balance:0, lastDaily:null}; }
    function _cSave(s){ try{ localStorage.setItem(CRYSTAL_KEY, JSON.stringify(s)); }catch(e){} }
    function ensureDailyCrystal(){
        const s=_cGet(); const t=_cToday();
        if (s.lastDaily !== t) {
            let days = 1;
            if (s.lastDaily) { const a=new Date(s.lastDaily+'T00:00:00'), b=new Date(t+'T00:00:00'); days = Math.max(1, Math.round((b-a)/86400000)); }
            s.balance = (s.balance||0) + DAILY_CRYSTAL * days;
            s.lastDaily = t; _cSave(s);
        }
        return s.balance;
    }
    function getCrystal(){ ensureDailyCrystal(); return _cGet().balance; }
    function addCrystal(n){ const s=_cGet(); s.balance = (s.balance||0) + n; _cSave(s); return s.balance; }
    function spendCrystal(n){ const s=_cGet(); if ((s.balance||0) < n) return false; s.balance -= n; _cSave(s); return true; }
    function refreshSilkCrystal(){ const el = $('#silkCrystalBalance'); if (el) el.textContent = getCrystal().toLocaleString(); }
    ensureDailyCrystal();   // 进入灵感模块即补当日结晶

    /* ============ 灵感扭蛋机 ============ */
    const TYPE_LABEL = { prompt: '写作提示', story: '故事开头', keyword: '关键词组合', challenge: '创意挑战' };
    let capsuleMode = 'create';     // create | food
    let createMode = 'prompt';      // prompt | story | keyword | challenge
    let currentInspire = null;
    let savedInspirations = window.Store.get('inspirations', []);
    let lastFoodResult = null;

    function drawInspire() {
        const pool = DATA.INSPIRE[createMode];
        let p;
        do { p = pick(pool); } while (currentInspire === p && pool.length > 1);
        currentInspire = p;
        const card = $('#inspireCard');
        card.classList.add('flip');
        setTimeout(() => {
            const badge = $('#inspireTypeBadge');
            badge.textContent = TYPE_LABEL[createMode];
            badge.className = 'inspire-type-badge ' + createMode;
            $('#inspireContent').innerHTML = esc(p);
        }, 280);
        setTimeout(() => card.classList.remove('flip'), 600);
    }

    function saveInspire() {
        if (!currentInspire) { toast('请先抽取一个灵感'); return; }
        if (savedInspirations.some(s => s.text === currentInspire)) { toast('已经收藏过啦'); return; }
        savedInspirations.unshift({ type: createMode, text: currentInspire, date: Date.now() });
        window.Store.set('inspirations', savedInspirations);
        renderSaved();
        toast('已收藏到灵感夹');
    }

    function renderSaved() {
        const list = $('#inspireSavedList');
        $('#inspireSavedCount').textContent = savedInspirations.length;
        if (!savedInspirations.length) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><p>还没有收藏的灵感</p><span>抽取后点「收藏」保存</span></div>`;
            return;
        }
        list.innerHTML = savedInspirations.map((s, i) => `
            <div class="inspire-saved-item">
                <div class="inspire-saved-item-content">
                    <div class="inspire-saved-item-type">${TYPE_LABEL[s.type] || '灵感'}</div>
                    <div class="inspire-saved-item-text">${esc(s.text)}</div>
                </div>
                <button class="icon-btn del-ins" data-i="${i}" aria-label="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`).join('');
        $$('.del-ins', list).forEach(b => b.addEventListener('click', () => {
            savedInspirations.splice(+b.dataset.i, 1);
            window.Store.set('inspirations', savedInspirations);
            renderSaved(); toast('已删除');
        }));
    }

    /* ---- 食材 → 食物 ---- */
    const SYNONYM = { 西红柿: '番茄', 洋芋: '土豆', 马铃薯: '土豆', 洋白菜: '白菜', 胡罗卜: '胡萝卜', 胡萝贝: '胡萝卜', 虾米: '虾', 鸡卵: '鸡蛋', 西红杮: '番茄', 猪柳: '猪肉', 牛腩: '牛肉' };
    function normalizeIng(s) {
        s = s.trim();
        return SYNONYM[s] || s;
    }
    function parseIngredients(raw) {
        return raw.split(/[，,、;\s]+/).map(normalizeIng).map(s => s.trim()).filter(Boolean);
    }
    function genFood() {
        const ings = parseIngredients($('#foodInput').value);
        if (!ings.length) { toast('请先输入食材'); return; }
        const have = new Set(ings);
        const matched = DATA.DISHES.map(d => {
            const hit = d.need.filter(n => have.has(n)).length;
            const missing = d.need.filter(n => !have.has(n));
            return { d, hit, missing };
        }).filter(x => x.hit > 0)
          .sort((a, b) => b.hit - a.hit || (a.d.need.length - a.hit) - (b.d.need.length - b.hit));

        let html = '';
        if (matched.length) {
            html += `<p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">你手头有：<b style="color:var(--gold-soft)">${ings.join('、')}</b>，可以做出这些 👇</p>`;
            matched.slice(0, 5).forEach(x => {
                const needTxt = x.missing.length
                    ? `还需：${x.missing.join('、')}`
                    : `✅ 食材齐了`;
                html += `
                    <div style="text-align:left;padding:12px 14px;border:1px solid var(--border);border-radius:13px;margin-bottom:10px;background:var(--surface);">
                        <div style="font-weight:600;font-size:15px;">${esc(x.d.name)} <span style="font-size:11px;color:var(--text-3);font-weight:400;border:1px solid var(--border);padding:1px 8px;border-radius:8px;margin-left:6px;">${esc(x.d.cuisine)}</span></div>
                        <div style="font-size:12.5px;color:var(--text-2);margin:6px 0;">${esc(x.d.desc)}</div>
                        <div style="font-size:11.5px;color:var(--gold-soft);">${needTxt}</div>
                    </div>`;
            });
        } else {
            // 无精确匹配：给组合创意
            html += `<p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">暂时没有直接匹配的菜谱，但你可以大胆组合 🔥</p>`;
            const a = ings[0], b = ings[1] || ings[0];
            const ideas = [
                `试试【${a}炒${b}】——热锅快炒，简单又香`,
                `做一道【${a}${b}汤】——清爽暖胃，适合家常`,
                `把${a}和${b}一起炖/烤，惊喜往往在"乱搭"里`,
                `没有菜谱？那就拍成"冰箱清空挑战"视频，真实感拉满`
            ];
            ideas.slice(0, Math.min(4, ings.length + 1)).forEach(t => {
                html += `<div style="text-align:left;padding:11px 14px;border:1px dashed var(--border);border-radius:13px;margin-bottom:9px;background:var(--surface-2);font-size:14px;">${esc(t)}</div>`;
            });
        }
        $('#foodResult').innerHTML = html;
        lastFoodResult = $('#foodResult').innerText;
        toast('已生成灵感');
    }

    /* ============ 海上丝路贸易模拟 ============ */
    const G = (() => {
        const map = {};
        DATA.GOODS.forEach(g => map[g.key] = g.id ? g : g); // keep ref
        return map;
    })();
    const goodByKey = {};
    DATA.GOODS.forEach(g => goodByKey[g.key] = g);

    let game = null;
    const PORTS = ['泉州港','广州港','明州港','扬州港','登州港','番禺港','合浦港','琅琊港'];

    /* 价格机制参数：分层波动 + 均值回归 + 波段限制，杜绝单向持续涨跌 */
    const REVERSION = 0.25;     // 每轮向（合理价）回归比例：偏弱 → 波动明显；后市偏置独立承载多轮趋势
    const BAND_LO = 0.10;       // 价格下限 = 基准价 * 0.10（可跌至原价一成）
    const BAND_HI = 20.00;      // 价格上限 = 基准价 * 20.00（最高可涨至原价 20 倍）
    const FUTURE_BIAS_SCALE = 0.9; // 后市预告作用强度（每轮叠加，趋势更显著）

    /* 分层波动率（vol）：每个货物按 tier 决定 自然浮动 / 普通逸闻 / 重大逸闻 的幅度
       nat    = 无逸闻自然浮动 ±范围（规则①：±30%~±80% 缓慢回归基准）
       normal = 普通逸闻 ±范围（规则②：±50%~±500%）
       major  = 重大逸闻 ±范围（规则②：天灾/战乱/通商禁令 等，±100%~±2000%） */
    const TIERS = {
        perish: { nat:[0.30,0.80], normal:[0.5,5.0],  major:[1.0,20.0] }, // 生鲜时令：波动率最高，易暴涨暴跌
        luxury: { nat:[0.28,0.72], normal:[0.5,4.5],  major:[1.0,18.0] }, // 高端奢侈品：易冲高也易大跌
        goods:  { nat:[0.25,0.70], normal:[0.5,4.0],  major:[1.0,15.0] }, // 日用物资：气候/节日/战争大幅波动
        meds:   { nat:[0.20,0.60], normal:[0.4,3.5],  major:[0.8,12.0] }, // 药品：中等偏高，战乱疫病大涨
        mid:    { nat:[0.20,0.55], normal:[0.5,3.0],  major:[1.0,10.0] }  // 其他（大米/海鱼/茶叶/贡品）
    };


    // 按模式返回可用货物：新增的 大米/海鱼/茶叶/贡品 仅 50 轮出现
    function goodsForMode(mode) {
        return DATA.GOODS.filter(g => !g.modes || g.modes.includes(mode));
    }

    function newGame(totalRounds) {
        const mode = totalRounds >= 50 ? '50' : '30';
        const avail = goodsForMode(mode);
        const prices = {};
        avail.forEach(g => prices[g.key] = g.base);
        const prev = {};
        avail.forEach(g => prev[g.key] = g.base);
        const initialGold = totalRounds >= 50 ? 4000 : 2000;
        game = {
            total: totalRounds,
            round: 1,
            gold: initialGold,
            initialGold,
            capacity: 200,
            baseCap: 200,
            expandCost: 4000,
            prices,
            prev,
            warehouse: {},          // key -> {qty, avg}
            market: [],             // 本轮 4~8 种货物 key（按模式）
            news: [],               // 本轮逸闻（已生效展示）
            futureQueue: [],        // 后市预告/假消息回调队列：{key, dir, mag, start, rounds}
            log: [],
            port: pick(PORTS)
        };
        rollMarket();
        genNews();
    }

    function rollMarket() {
        const mode = game.total >= 50 ? '50' : '30';
        const avail = goodsForMode(mode);
        const round = game.round;

        // 1) 汇总本轮生效中的「后市预告 / 假消息回调」多轮偏置
        const activeBias = {};
        game.futureQueue = game.futureQueue.filter(f => {
            if (round >= f.start) {
                if (round < f.start + f.rounds) {
                    activeBias[f.key] = (activeBias[f.key] || 0) + (f.dir === 'up' ? f.mag : -f.mag);
                    return true;   // 本轮回合仍生效
                }
                return false;      // 已到期，移除
            }
            return true;           // 尚未开始
        });

        // 2) 各货物价格：分层自然浮动 + 均值回归 + 多轮偏置，限制在波段内（双向波动，无单向漂移）
        avail.forEach(g => {
            const old = game.prices[g.key];
            const base = g.base;
            const tier = TIERS[g.vol || 'mid'];

            // ① 无逸闻自然浮动：本轮合理价（fair）在「基准价 ±nat」区间内游走
            //    —— 自然波动是温和的基准附近抖动；暴涨暴跌主要由逸闻（规则②）驱动
            const natMag = tier.nat[0] + Math.random() * (tier.nat[1] - tier.nat[0]);
            const natDir = Math.random() < 0.5 ? -1 : 1;
            let fair = base * (1 + natDir * natMag + (activeBias[g.key] || 0));
            fair = Math.max(base * BAND_LO, Math.min(base * BAND_HI, fair));

            // 均值回归到 fair（缓慢），再钳制在波段内
            let np = old * (1 - REVERSION) + fair * REVERSION;
            np = Math.round(np);
            np = Math.max(Math.round(base * BAND_LO), Math.min(Math.round(base * BAND_HI), np));
            game.prev[g.key] = old;                  // 记录上轮价用于趋势
            game.prices[g.key] = np;
        });

        // 3) 抽取本轮货市：30 轮 4-6 件，50 轮 5-8 件（逸闻必出自其中）
        const lo = game.total >= 50 ? 5 : 4;
        const hi = game.total >= 50 ? 8 : 6;
        const n = lo + Math.floor(Math.random() * (hi - lo + 1));
        game.market = shuffle(avail.map(g => g.key)).slice(0, n);
    }

    function applyNews(n) {
        n.goods.forEach(k => {
            const g = goodByKey[k]; if (!g) return;
            const factor = 1 + (n.dir === 'up' ? 1 : -1) * n.mag;
            let np = Math.max(1, Math.round(game.prices[k] * factor));
            np = Math.max(Math.round(g.base * BAND_LO), Math.min(Math.round(g.base * BAND_HI), np));
            game.prices[k] = np;
        });
    }

    // 对数均匀分布抽取逸闻幅度：返回 [r0,r1] 之间的幅度（真/假逸闻套用同一套幅度）
    function newsMag(tier, major) {
        const r = major ? TIERS[tier].major : TIERS[tier].normal;
        const lo = Math.log(r[0]), hi = Math.log(r[1]);
        return Math.exp(lo + Math.random() * (hi - lo));
    }

    function genNews() {
        game.news = [];
        const displayed = game.market;                 // 本轮展示的货物
        if (!displayed || !displayed.length) return;

        const count = 1 + (Math.random() < 0.55 ? 1 : 0); // 1~2 条
        const used = [];
        for (let i = 0; i < count; i++) {
            // 至少引用本轮展示货物之一（硬性规则）
            const cands = displayed.filter(k => !used.includes(k));
            const k = pick(cands.length ? cands : displayed);
            used.push(k);
            const g = goodByKey[k];
            const pool = DATA.EVENTS[k] || DATA.EVENTS.sugarcane;  // 该货物专属事件库
            const dir = Math.random() < 0.5 ? 'up' : 'down';        // 随机选 涨/跌 方向
            const ev = pick(pool[dir]);                             // 取该方向的专属事件
            const tier = g.vol || 'mid';
            const major = !!ev.major;                  // 重大消息（天灾/战乱/通商禁令/新矿/禁奢/商路阻断/疫病等）
            const mag = newsMag(tier, major);          // 真/假逸闻套用同一套幅度
            const truth = Math.random() < 0.6;         // 约 60% 为真
            const isFuture = Math.random() < 0.5;      // 当前行情 / 后市预告
            const claimedDir = dir;                    // 文案宣称方向

            const text = ev.txt.replace('{G}', g.name);
            const tag = isFuture ? '【后市预告】' : '【本日行情】';
            const flavor = Math.random() < 0.35 ? '（市井议论纷纷）' : '';
            game.news.push(tag + text + flavor);

            if (isFuture) {
                // ② 后市预告：预示后续若干轮（2~5 轮后生效，持续 2~4 轮走向）
                // 真→按宣称方向延续趋势；假→反方向（预言落空）
                const offset = 2 + Math.floor(Math.random() * 4);
                const rounds = 2 + Math.floor(Math.random() * 3);
                const effDir = truth ? claimedDir : (claimedDir === 'up' ? 'down' : 'up');
                game.futureQueue.push({ key: k, dir: effDir, mag: mag * FUTURE_BIAS_SCALE, start: game.round + offset, rounds });
            } else {
                // ② 当前行情：真/假 都先按「宣称方向」制造冲高/跳水（假消息骗住玩家）
                applyNews({ goods: [k], dir: claimedDir, mag });
                // 假消息随后快速回调：1~2 轮后反向拉回，增加博弈难度
                if (!truth) {
                    const cbRounds = 1 + Math.floor(Math.random() * 2);
                    game.futureQueue.push({ key: k, dir: (claimedDir === 'up' ? 'down' : 'up'), mag: mag * 0.8, start: game.round + 1, rounds: cbRounds });
                }
            }
        }

        // 特殊事件：朝廷征集（全随机，作用随机展示货物，方向随机、幅度极大）
        // 随机择一件本轮展示货物，方向随机、幅度极大、市价乱舞，玩家难以预料涨跌；
        // 单次可把价格推向数倍或打到一成比例，但均值回归保证不会无限漂移。
        if (Math.random() < 0.22) {
            const k = pick(displayed);                  // 仍从展示货物中取，满足硬规则
            const g = goodByKey[k];
            const dir = Math.random() < 0.5 ? 'up' : 'down';
            const mag = newsMag('luxury', true) * 0.8; // 重大级别幅度（略收）
            const flavorTxt = [
                '朝廷一道诏令征调「{G}」，市井哗然，价势难料。',
                '内廷飞檄急征「{G}」，商旅奔走，是涨是跌全凭天意。',
                '钦差至港强征「{G}」，货主仓皇，市价一阵乱舞。',
                '圣旨临港征「{G}」以充内库，商贾失色，行市骤变。'
            ];
            const text = pick(flavorTxt).replace('{G}', g.name);
            game.news.push('【特殊·朝廷征集】' + text);
            applyNews({ goods: [k], dir, mag });
        }
    }

    function usedCap() {
        return Object.values(game.warehouse).reduce((s, x) => s + x.qty, 0);
    }

    /* ---------- 夜间交易终端渲染 ---------- */
    let selectedKey = null;     // 当前选中交易的货物
    let sortMode = null;        // null 自然序 | 'desc' | 'asc'

    function trendPct(k) {
        const prev = game.prev[k];
        if (!prev) return 0;
        return Math.round((game.prices[k] - prev) / prev * 100);
    }

    function trendBadge(pct) {
        if (pct >= 100) return `<span class="sn-trend sn-up sn-hot"><span class="material-symbols-outlined">keyboard_double_arrow_up</span>暴涨</span>`;
        if (pct > 0) return `<span class="sn-trend sn-up"><span class="material-symbols-outlined">trending_up</span>+${pct}%</span>`;
        if (pct <= -50) return `<span class="sn-trend sn-down sn-hot"><span class="material-symbols-outlined">keyboard_double_arrow_down</span>暴跌</span>`;
        if (pct < 0) return `<span class="sn-trend sn-down"><span class="material-symbols-outlined">trending_down</span>${pct}%</span>`;
        return `<span class="sn-trend sn-flat"><span class="material-symbols-outlined">trending_flat</span>0%</span>`;
    }

    function renderNews() {
        const el = $('#silkNewsText');
        if (!game || !game.news.length) {
            el.textContent = '本港风平浪静，暂无逸闻与今日邮报。';
            return;
        }
        el.textContent = game.news.join(' ｜ ');
    }

    function tradeQty() {
        return Math.max(1, parseInt($('#silkQtyInput').value) || 1);
    }

    function renderTradePanel() {
        const nameEl = $('#silkSheetName'), priceEl = $('#silkSheetPrice');
        const buyBtn = $('#silkBuyBtn'), sellBtn = $('#silkSellBtn');
        if (!game || !selectedKey) {
            nameEl.textContent = '点选一件货物开始交易';
            priceEl.textContent = '单价: -- 两';
            $('#silkTradeCost').textContent = '--';
            $('#silkTradeCap').textContent = '--';
            buyBtn.disabled = true; sellBtn.disabled = true;
            return;
        }
        const g = goodByKey[selectedKey];
        const held = game.warehouse[selectedKey];
        const price = game.prices[selectedKey] != null ? game.prices[selectedKey] : (held ? held.avg : 0);
        const qty = tradeQty();
        nameEl.textContent = g.name;
        priceEl.textContent = `单价: ${price} 两`;
        $('#silkTradeCost').textContent = `${(price * qty).toLocaleString()} 两`;
        $('#silkTradeCap').textContent = `${qty} 担`;
        buyBtn.disabled = !game.market.includes(selectedKey);
        sellBtn.disabled = !held || held.qty <= 0;
    }

    function renderGame() {
        const used = usedCap();
        $('#silkRoundLabel').textContent = `第 ${game.round} / ${game.total} 轮`;
        $('#silkGold').textContent = game.gold.toLocaleString();
        $('#silkCapLabel').textContent = `${used} / ${game.capacity} 担`;
        $('#silkPortName').textContent = game.port;

        const capPct = Math.min(100, Math.round((used / game.capacity) * 100));
        $('#silkCapBar').style.width = capPct + '%';

        // 货市卡片（2 列，点选交易）
        let keys = game.market.slice();
        if (sortMode === 'desc') keys.sort((a, b) => game.prices[b] - game.prices[a]);
        if (sortMode === 'asc') keys.sort((a, b) => game.prices[a] - game.prices[b]);
        $('#silkGoodsGrid').innerHTML = keys.map(k => {
            const g = goodByKey[k];
            const price = game.prices[k];
            const pct = trendPct(k);
            const cls = pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat');
            const sign = pct > 0 ? '+' : '';
            return `
                <div class="sn-good ${k === selectedKey ? 'selected' : ''}" data-key="${k}">
                    <div class="sn-good-ic">${g.icon || '📦'}</div>
                    <div class="sn-good-main">
                        <div class="sn-good-name">${g.name}</div>
                        <div class="sn-good-price"><span class="material-symbols-outlined">monetization_on</span>${price}</div>
                    </div>
                    <span class="sn-badge ${cls}">${sign}${pct}%</span>
                </div>`;
        }).join('');

        // 仓库（点选可在交易底栏卖出）
        const whList = $('#silkWarehouseList');
        const wkeys = Object.keys(game.warehouse).filter(k => game.warehouse[k].qty > 0);
        if (!wkeys.length) {
            whList.innerHTML = `<div class="sn-wh-empty">
                <div class="sn-wh-empty-ic"><span class="material-symbols-outlined">inventory_2</span></div>
                <p>暂无货物待售</p>
                <span>点击上方商品即可买入</span>
            </div>`;
        } else {
            whList.innerHTML = wkeys.map(k => {
                const g = goodByKey[k];
                const x = game.warehouse[k];
                const cur = game.prices[k] != null ? game.prices[k] : x.avg;
                const pnl = cur - x.avg;
                return `
                    <div class="sn-wh-item ${k === selectedKey ? 'selected' : ''}" data-key="${k}">
                        <span class="sn-wh-ic">${g.icon || '📦'}</span>
                        <div class="sn-wh-info">
                            <div class="sn-wh-name">${g.name} ×${x.qty}</div>
                            <div class="sn-wh-meta">均价 ${x.avg} · 现价 ${cur}</div>
                        </div>
                        <span class="sn-pnl ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${pnl}</span>
                    </div>`;
            }).join('');
        }

        // 扩容按钮
        const expandBtn = $('#silkExpandBtn');
        expandBtn.title = `扩建仓库 +100（花费 ${game.expandCost} 两）`;
        expandBtn.disabled = game.gold < game.expandCost;

        if (selectedKey) renderTradePanel();
    }

    function expand() {
        if (game.gold < game.expandCost) { toast('金币不足'); return; }
        game.gold -= game.expandCost;
        game.capacity += 100;
        game.expandCost += 5000;
        toast('仓库已扩建 +100');
        renderGame();
    }

    function buy(k, qty) {
        if (!k || qty <= 0) return;
        if (!game.market.includes(k)) { toast('该货物不在本港货市'); return; }
        const price = game.prices[k];
        const cost = price * qty;
        if (cost > game.gold) { toast('银两不足'); return; }
        if (usedCap() + qty > game.capacity) { toast('船舱容量不足，可扩容'); return; }
        game.gold -= cost;
        const x = game.warehouse[k] || { qty: 0, avg: 0 };
        x.avg = Math.round((x.avg * x.qty + price * qty) / (x.qty + qty));
        x.qty += qty;
        game.warehouse[k] = x;
        toast(`已买入 ${goodByKey[k].name} ×${qty}`);
        renderGame();
    }
    function sell(k, qty) {
        if (!k || qty <= 0) return;
        const x = game.warehouse[k];
        if (!x || x.qty <= 0) { toast('未持有该货物'); return; }
        if (qty > x.qty) { toast('数量超出持有'); return; }
        const price = game.prices[k] != null ? game.prices[k] : x.avg;
        game.gold += price * qty;
        x.qty -= qty;
        if (x.qty === 0) delete game.warehouse[k];
        toast(`已卖出 ${goodByKey[k].name} ×${qty}`);
        renderGame();
    }

    function nextRound() {
        if (game.round >= game.total) { settle(); return; }
        game.round++;
        // 换港口，避免连续同港
        const others = PORTS.filter(p => p !== game.port);
        game.port = pick(others.length ? others : PORTS);
        rollMarket();
        genNews();
        // 选中货物若已不可交易（不在货市且未持有）则清除
        if (selectedKey && !game.market.includes(selectedKey) && !game.warehouse[selectedKey]) selectedKey = null;
        renderNews();
        renderGame();
    }

    /* 排行榜（两种模式独立，localStorage 持久化） */
    function rankKey(total){ return 'silk_rank_' + total; }
    function getRank(total){ return window.Store.get(rankKey(total), []); }
    function saveRank(total, rec){
        const list = getRank(total);
        list.push(rec);
        list.sort((a,b)=> b.score - a.score);
        window.Store.set(rankKey(total), list.slice(0, 50));
    }
    function fmtDate(ts){
        const d = new Date(ts); const p = n => String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function renderRank(total){
        const list = getRank(total);
        if(!list.length) return '<div class="silk-rank-empty">暂无排行记录，完成一局即可上榜。</div>';
        return list.map((r,i)=>`
            <div class="silk-rank-item">
                <span class="silk-rank-no ${i<3?'top':''}">${i+1}</span>
                <div class="silk-rank-info">
                    <div class="silk-rank-score ${r.score>=0?'pos':'neg'}">${r.score>=0?'+':''}${r.score.toLocaleString()} 分</div>
                    <div class="silk-rank-meta">${r.total}轮 · ${fmtDate(r.date)} · 资产 ${r.asset.toLocaleString()}</div>
                </div>
            </div>`).join('');
    }

    function settle() {
        // 清仓结算：有实时市价按市价，无则按买入均价
        let proceed = 0;
        const detail = [];
        Object.keys(game.warehouse).forEach(k => {
            const x = game.warehouse[k];
            if (!x.qty) return;
            const price = (game.prices[k] != null) ? game.prices[k] : x.avg;
            const sub = price * x.qty;
            proceed += sub;
            detail.push(`${goodByKey[k].name} ×${x.qty} @ ${price} = +${sub}`);
        });
        const finalAsset = game.gold + proceed;
        const score = finalAsset - game.initialGold; // 净收益作为本局得分

        // 写入对应模式排行榜（30/50 独立）
        saveRank(game.total, { score, asset: finalAsset, date: Date.now(), total: game.total });

        $('#silkGame').style.display = 'none';
        $('#silkResult').style.display = 'block';
        $('#silkFinalScore').textContent = finalAsset.toLocaleString();
        const sign = '+';
        const profitTxt = `本局总得分（净收益） ${score>=0?sign:''}${score.toLocaleString()}`;
        $('#silkResultDetail').innerHTML = `
            <div style="margin-bottom:8px;">初始本金 <b style="color:var(--gold-soft)">${game.initialGold.toLocaleString()}</b> · 结算总资产 <b style="color:var(--gold-soft)">${finalAsset.toLocaleString()}</b></div>
            <div style="margin-bottom:12px;color:${score >= 0 ? '#9fe9c8' : '#ffb3b3'}">${profitTxt}</div>
            <div style="color:var(--text-3);font-size:12px;">清仓明细：</div>
            <div style="font-size:12.5px;line-height:1.8;margin-top:4px;">${detail.length ? detail.join('<br>') : '仓库无存货，仅剩现金。'}</div>`;

        /* 星轨结晶领取：本局得分（净收益）每满 10 万可兑换 100 结晶 */
        const claimUnits = Math.floor(Math.max(0, score) / 100000);
        const claimBox = $('#silkClaimBox');
        claimBox.dataset.units = String(claimUnits);
        if (claimUnits > 0) {
            const amt = claimUnits * 100;
            $('#silkClaimInfo').textContent = `本局得分 ${score.toLocaleString()} 可兑换 ${amt} 星轨结晶（每 10 万得分兑换 100）`;
            $('#silkClaimBtn').textContent = `领取 ${amt} 星轨结晶`;
            claimBox.style.display = 'block';
        } else {
            claimBox.style.display = 'none';
        }
        refreshSilkCrystal();

        $('#silkRankTitle').textContent = `🏆 排行榜（${game.total}轮）`;
        $('#silkRank').innerHTML = renderRank(game.total);
    }

    function setCapsuleFull(full) {
        const app = $('#app');
        if (app) app.classList.toggle('capsule-full', full);
    }

    function init() {
        /* 灵感扭蛋机 子标签 */
        $$('#inspireTabs .tab-chip').forEach(tab => tab.addEventListener('click', () => {
            $$('#inspireTabs .tab-chip').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sub = tab.dataset.sub;
            $('#capsuleView').style.display = sub === 'capsule' ? 'block' : 'none';
            $('#silkView').style.display = sub === 'silk' ? 'block' : 'none';
            setCapsuleFull(sub === 'capsule');
            if (sub === 'silk') refreshSilkCrystal();
        }));
        /* 不再默认进入 capsule 全屏：用户进入灵感游戏 landing 页时先显示 tab 与底部导航，
           手动点击「灵感扭蛋机」后再沉浸式全屏，避免找不到返回入口。 */

        /* 扭蛋机已替换为独立 gacha.html，iframe 自动加载，无需旧事件绑定 */

        /* 海上丝路 */
        let chosenRounds = 30;
        $$('#silkSetup .silk-mode-pick .mode-chip').forEach(b => b.addEventListener('click', () => {
            $$('#silkSetup .silk-mode-pick .mode-chip').forEach(x => x.classList.remove('active'));
            b.classList.add('active'); chosenRounds = +b.dataset.rounds;
        }));
        function closeSheet() {
            selectedKey = null;
            $$('#silkGoodsGrid .sn-good').forEach(el => el.classList.remove('selected'));
            $$('#silkWarehouseList .sn-wh-item').forEach(el => el.classList.remove('selected'));
            $('#silkSheet').classList.remove('show');
        }
        $('#silkStartBtn').addEventListener('click', () => {
            newGame(chosenRounds);
            selectedKey = null; sortMode = null;
            closeSheet();
            $('#silkSetup').style.display = 'none';
            $('#silkResult').style.display = 'none';
            $('#silkGame').style.display = 'flex';
            renderNews();
            renderGame();
            refreshSilkCrystal();
            toast('启航！愿风借你银帆');
        });
        $('#silkNextBtn').addEventListener('click', nextRound);
        $('#silkExpandBtn').addEventListener('click', expand);
        $('#silkExitBtn').addEventListener('click', () => {
            if (!confirm('确定离港吗？本局进度将不保存。')) return;
            closeSheet();
            $('#silkGame').style.display = 'none';
            $('#silkResult').style.display = 'none';
            $('#silkSetup').style.display = 'block';
            refreshSilkCrystal();
        });
        $('#silkRestartBtn').addEventListener('click', () => {
            $('#silkResult').style.display = 'none';
            $('#silkGame').style.display = 'none';
            $('#silkSetup').style.display = 'block';
            refreshSilkCrystal();
        });
        /* 星轨结晶领取（结算页） */
        $('#silkClaimBtn').addEventListener('click', () => {
            const box = $('#silkClaimBox');
            const units = parseInt(box.dataset.units || '0', 10);
            if (!units) return;
            const got = addCrystal(units * 100);
            box.style.display = 'none';
            toast(`已领取 ${units*100} 星轨结晶，当前持有 ${got.toLocaleString()}`);
            refreshSilkCrystal();
        });
        // 排行榜直达弹层
        let rankTab = '30';
        function openRank() {
            $('#silkRankModalList').innerHTML = renderRank(rankTab);
            $('#silkRankModal').style.display = 'flex';
        }
        $('#silkRankBtn').addEventListener('click', openRank);
        $('#silkRankClose').addEventListener('click', () => { $('#silkRankModal').style.display = 'none'; });
        $('#silkRankModal').addEventListener('click', e => {
            if (e.target.id === 'silkRankModal') $('#silkRankModal').style.display = 'none';
        });
        $$('#silkRankModal .silk-mode-pick .mode-chip').forEach(b => b.addEventListener('click', () => {
            $$('#silkRankModal .silk-mode-pick .mode-chip').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            rankTab = b.dataset.rtab;
            $('#silkRankModalList').innerHTML = renderRank(rankTab);
        }));
        // 点选货市/仓库货物 → 弹出交易底栏
        function selectGood(k) {
            selectedKey = k;
            $$('#silkGoodsGrid .sn-good').forEach(el => el.classList.toggle('selected', el.dataset.key === selectedKey));
            $$('#silkWarehouseList .sn-wh-item').forEach(el => el.classList.toggle('selected', el.dataset.key === selectedKey));
            renderTradePanel();
            $('#silkSheet').classList.add('show');
        }
        $('#silkGoodsGrid').addEventListener('click', e => {
            const card = e.target.closest('[data-key]'); if (card) selectGood(card.dataset.key);
        });
        $('#silkWarehouseList').addEventListener('click', e => {
            const item = e.target.closest('[data-key]'); if (item) selectGood(item.dataset.key);
        });
        $('#silkSheetClose').addEventListener('click', closeSheet);
        // 数量步进器
        $('#silkQtyMinus').addEventListener('click', () => {
            $('#silkQtyInput').value = Math.max(1, tradeQty() - 1);
            renderTradePanel();
        });
        $('#silkQtyPlus').addEventListener('click', () => {
            $('#silkQtyInput').value = tradeQty() + 1;
            renderTradePanel();
        });
        $('#silkQtyInput').addEventListener('input', renderTradePanel);
        // 买入 / 卖出
        $('#silkBuyBtn').addEventListener('click', () => buy(selectedKey, tradeQty()));
        $('#silkSellBtn').addEventListener('click', () => sell(selectedKey, tradeQty()));
        // 价格排序：自然序 → 降序 → 升序 循环
        $('#silkSortBtn').addEventListener('click', () => {
            sortMode = sortMode === null ? 'desc' : (sortMode === 'desc' ? 'asc' : null);
            $('#silkSortBtn').classList.toggle('on', sortMode !== null);
            renderGame();
            toast(sortMode === 'desc' ? '按价格从高到低' : sortMode === 'asc' ? '按价格从低到高' : '恢复自然排序');
        });
    }

    window.InspireModule = { init, _debug: { newGame, rollMarket, genNews, getState: () => game, setRound: (r) => { if (game) game.round = r; } } };
})();
