/* ============================================================
   夏天 · 每日单词模块
   - 四类词库（基础词汇 / 四级词汇 / 我的词汇本 / 作文生词本）独立持久化学习进度
   - 切换页面 / 词库 / 分类均保留上次位置，互不干扰
   - 每 20 个已浏览单词自动成组，【本组复习】一键平铺整组复习
   ============================================================ */
(function () {
    const { $, $$, esc, toast } = window.U;
    const DATA = window.DATA;

    const CATS = [
        { code: 'op', label: '操作词' },
        { code: 'gt', label: '通用名词' },
        { code: 'pt', label: '具象名词' },
        { code: 'qg', label: '性质形容词' },
        { code: 'qo', label: '反义词组' }
    ];
    const GROUP_SIZE = 20;
    const BROWSE_CAP = 60;

    // 每日单词背景图：每 12 小时按时间片轮换一张
    const WORD_BGS = [
        'assets/word-bg-1.png',
        'assets/word-bg-2.png',
        'assets/word-bg-3.png',
        'assets/word-bg-4.jpg'
    ];
    const HALF_DAY = 12 * 60 * 60 * 1000;
    let currentBgIdx = -1;
    function applyWordBg() {
        const idx = Math.floor(Date.now() / HALF_DAY) % WORD_BGS.length;
        if (idx === currentBgIdx) return;
        currentBgIdx = idx;
        const el = $('#page-words');
        if (el) el.style.backgroundImage = `url('${WORD_BGS[idx]}?v=20260731a')`;
    }

    // 当天日期键（YYYY-MM-DD），用于按日统计单词与学习时长
    function todayKey() {
        const d = new Date(), p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    let bank = 'daily';          // 'daily' | 'cet4' | 'custom' | 'essay'
    let catFilter = 'op';        // 当前基础词库分类（仅 daily 生效）
    let index = 0;               // 当前词索引（在 activeList 内）
    let customWords = window.Store.get('customWords', []) || [];
    let essayWords = window.Store.get('essayWords', []) || [];   // 作文生词本（独立于我的词汇本）
    let mode = 'study';          // 'study' | 'search' | 'wordbook' | 'review'
    let studyFrom = 'tab';       // 'tab' | 'wordbook' | 'search' | 'essay'
    let searchReturn = 'tab';
    let searchQuery = '';
    let reviewWords = [];        // 当前复习组（最近 GROUP_SIZE 个已浏览词快照）
    let reviewHideMastered = false;

    /* ---------- 进度持久化（四词库独立） ---------- */
    function bankKey() {
        return bank === 'daily' ? 'daily|' + catFilter : bank;
    }
    function saveProgress() {
        const prog = window.Store.get('wordProgress', {}) || {};
        prog[bankKey()] = index;
        window.Store.set('wordProgress', prog);
    }
    function loadProgress() {
        const prog = window.Store.get('wordProgress', {}) || {};
        const v = prog[bankKey()];
        index = (typeof v === 'number' && v >= 0) ? v : 0;
    }
    function getGroup() {
        const groups = window.Store.get('wordGroups', {}) || {};
        return groups[bankKey()] || [];
    }
    function getMastered() {
        const m = window.Store.get('wordMastered', {}) || {};
        return m[bankKey()] || [];
    }

    /* ---------- 词库列表 ---------- */
    function activeList() {
        if (bank === 'daily') return DATA.DAILY_WORDS.filter(w => w.cat === catFilter);
        if (bank === 'cet4') return DATA.CET4_WORDS;
        if (bank === 'custom') return customWords;
        if (bank === 'essay') return essayWords;
        return [];
    }
    function isSaved(w) {
        const lw = (w || '').toLowerCase();
        return customWords.some(c => (c.w || '').toLowerCase() === lw);
    }
    function speak(text) {
        if (!text || !('speechSynthesis' in window)) return;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.85;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
    }

    /* ---------- 视图切换 ---------- */
    function hideStats() {
        const sv = $('#statsView');
        if (sv) sv.style.display = 'none';
    }
    function showStudy(from) {
        mode = 'study'; studyFrom = from;
        $('#wordStudyView').style.display = 'block';
        $('#wordReviewView').style.display = 'none';
        $('#wordSearchView').style.display = 'none';
        $('#wordbookListView').style.display = 'none';
        $('#essayView').style.display = 'none';
        hideStats();
        $('#wordBackBtn').style.display = (from === 'tab') ? 'none' : 'flex';
        $('#wordCatTabs').style.display = (bank === 'daily') ? 'flex' : 'none';
        syncCatChips();
        renderStudy();
    }
    function showWordbook() {
        mode = 'wordbook';
        $('#wordStudyView').style.display = 'none';
        $('#wordReviewView').style.display = 'none';
        $('#wordSearchView').style.display = 'none';
        $('#wordbookListView').style.display = 'block';
        $('#essayView').style.display = 'none';
        hideStats();
        renderWordbook();
    }
    function showSearch() {
        searchReturn = studyFrom;
        mode = 'search';
        $('#wordStudyView').style.display = 'none';
        $('#wordReviewView').style.display = 'none';
        $('#wordSearchView').style.display = 'block';
        $('#wordbookListView').style.display = 'none';
        $('#essayView').style.display = 'none';
        hideStats();
        $('#wordSearchInput').value = searchQuery;
        $('#wordSearchInput').focus();
        runSearch(searchQuery);
    }
    function showStats() {
        mode = 'stats';
        $('#wordStudyView').style.display = 'none';
        $('#wordReviewView').style.display = 'none';
        $('#wordSearchView').style.display = 'none';
        $('#wordbookListView').style.display = 'none';
        $('#essayView').style.display = 'none';
        const sv = $('#statsView');
        if (sv) sv.style.display = 'block';
        if (window.StatsModule) window.StatsModule.render();
    }
    function syncCatChips() {
        $$('#wordCatTabs .word-cat-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.cat === catFilter);
        });
    }

    /* ---------- 学习视图渲染 ---------- */
    function renderStudy() {
        const list = activeList();
        const exCard = $('#wordExampleCard');
        const phRow = $('#wordPhoneticRow');
        if (!list.length) {
            $('#wordText').textContent = '—';
            $('#wordPhonetic').textContent = '';
            $('#wordMeaning').textContent = '';
            $('#wordExample').textContent = '';
            $('#wordExampleTrans').textContent = '';
            $('#wordProgressTop').textContent = '0 / 0';
            exCard.style.display = 'none';
            if (bank === 'essay' && !essayWords.length) {
                toast('作文生词本还是空的，去「作文本」选中单词加入吧');
            }
            updateReviewBtn();
            return;
        }
        if (index >= list.length) index = list.length - 1;
        if (index < 0) index = 0;
        const w = list[index];
        $('#wordText').textContent = w.w;
        $('#wordPhonetic').textContent = w.p || '';
        phRow.style.display = w.p ? 'flex' : 'none';
        $('#wordMeaning').textContent = w.m || '';

        // EXAMPLE 例句区：常显；优先展示词条自带例句，没有则提示点击随机例句
        exCard.style.display = '';
        const exEn = $('#wordExample'), exCn = $('#wordExampleTrans');
        if (w.e) {
            exEn.classList.remove('placeholder');
            exEn.style.display = ''; exEn.textContent = w.e;
            exCn.style.display = w.et ? '' : 'none'; exCn.textContent = w.et || '';
        } else {
            exEn.classList.add('placeholder');
            exEn.style.display = ''; exEn.textContent = '暂无例句，点击「随机例句」从词库获取。';
            exCn.style.display = 'none'; exCn.textContent = '';
        }

        $('#wordProgressTop').textContent = `${index + 1} / ${list.length}`;

        const fav = $('#saveWordBtn');
        const saved = isSaved(w.w);
        fav.classList.toggle('active', saved);
        fav.classList.toggle('in-book', bank === 'custom');

        recordBrowse(w);
        saveProgress();
        updateReviewBtn();
    }

    // 记录已浏览单词到当前词库的分组序列（避免连续重复）
    function recordBrowse(w) {
        const key = bankKey();
        const groups = window.Store.get('wordGroups', {}) || {};
        const arr = groups[key] || [];
        const snap = { w: w.w, p: w.p || '', m: w.m || '', e: w.e || '', et: w.et || '' };
        const last = arr[arr.length - 1];
        if (last && last.w === snap.w) return;
        arr.push(snap);
        if (arr.length > BROWSE_CAP) arr.shift();
        groups[key] = arr;
        window.Store.set('wordGroups', groups);
    }

    function updateReviewBtn() {
        const btn = $('#wordReviewBtn');
        if (!btn) return;
        const ok = getGroup().length >= GROUP_SIZE;
        btn.disabled = !ok;
        btn.classList.toggle('ready', ok);
    }

    /* ---------- 随机例句（EXAMPLE 区） ---------- */
    const EX_TEMPLATES = [
        { e: w => `Could you send me more details about the "${w}" in your latest catalog?`, et: w => `你能把最新目录里关于“${w}”的更多细节发给我吗？` },
        { e: w => `We hope to place a trial order first to check the ${w} before mass production.`, et: w => `我们希望先下试单，在量产前确认一下 ${w}。` },
        { e: w => `Please make sure the ${w} meets the requirements listed in our contract.`, et: w => `请确保 ${w} 符合我们合同中列出的要求。` },
        { e: w => `Thanks for your quick reply — the ${w} you mentioned works well for us.`, et: w => `感谢你的快速回复——你提到的 ${w} 对我们来说很合适。` },
        { e: w => `In daily conversation, people often use the word "${w}" like this.`, et: w => `在日常交流中，人们经常这样使用“${w}”这个词。` },
        { e: w => `Our client asked about the ${w} again during this morning's meeting.`, et: w => `今天早上开会时，客户又问到了 ${w} 的情况。` }
    ];
    let lastExample = '';

    function collectExamples(word) {
        const lw = (word || '').toLowerCase();
        if (!lw) return [];
        const re = new RegExp('\\b' + lw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es|ed|d|ing)?\\b', 'i');
        const pool = [];
        [DATA.DAILY_WORDS, DATA.CET4_WORDS, customWords, essayWords].forEach(list => {
            (list || []).forEach(item => {
                if (item.e && re.test(item.e)) pool.push({ e: item.e, et: item.et || '' });
            });
        });
        return pool;
    }

    function exampleFor(word) {
        let pool = collectExamples(word);
        let candidates = pool.filter(x => x.e !== lastExample);
        if (!candidates.length) candidates = pool;
        if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
        const t = EX_TEMPLATES[Math.floor(Math.random() * EX_TEMPLATES.length)];
        return { e: t.e(word), et: t.et(word) };
    }

    function randomExample() {
        const l = activeList(); if (!l.length) return;
        const w = l[index]; if (!w) return;
        const picked = exampleFor(w.w);
        lastExample = picked.e;
        const exEn = $('#wordExample'), exCn = $('#wordExampleTrans');
        exEn.classList.remove('placeholder');
        exEn.style.display = ''; exEn.textContent = picked.e;
        exCn.style.display = picked.et ? '' : 'none'; exCn.textContent = picked.et || '';
    }

    /* ---------- 词汇本列表渲染 ---------- */
    function renderWordbook() {
        const list = $('#wordbookList');
        if (!customWords.length) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><p>词汇本还是空的</p><span>在下方录入单词，或浏览系统词库时点击「收藏」</span></div>`;
            return;
        }
        list.innerHTML = customWords.map((c, i) => `
            <div class="wordbook-item" data-i="${i}">
                <div class="wordbook-item-info">
                    <div class="wordbook-item-word">${esc(c.w)} <span class="wb-phon">${esc(c.p || '')}</span></div>
                    <div class="wordbook-item-meaning">${esc(c.m || '')}</div>
                </div>
                <button class="icon-btn del-cw" data-i="${i}" aria-label="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`).join('');
        $$('.wordbook-item', list).forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.del-cw')) return;
                const i = +item.dataset.i;
                saveProgress();
                bank = 'custom'; loadProgress(); index = i; showStudy('wordbook');
            });
        });
        $$('.del-cw', list).forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = +btn.dataset.i;
            customWords.splice(i, 1);
            window.Store.set('customWords', customWords);
            renderWordbook();
            toast('已删除');
        }));
    }

    /* ---------- 搜索（英文 / 中文释义 / 作文本文字） ---------- */
    function runSearch(q) {
        searchQuery = q;
        const box = $('#wordSearchResults');
        const query = (q || '').trim().toLowerCase();
        if (!query) {
            box.innerHTML = `<div class="search-hint">输入英文或中文释义，快速定位单词</div>`;
            return;
        }
        const banks = [
            { key: 'daily', label: '基础词汇', list: DATA.DAILY_WORDS },
            { key: 'cet4', label: '四级词汇', list: DATA.CET4_WORDS },
            { key: 'custom', label: '我的词汇本', list: customWords },
            { key: 'essay', label: '作文生词本', list: essayWords }
        ];
        const results = [];
        for (const b of banks) {
            for (let i = 0; i < b.list.length; i++) {
                const w = b.list[i];
                const hay = ((w.w || '') + ' ' + (w.m || '') + ' ' + (w.et || '') + ' ' + (w.p || '') + ' ' + (w.def || '')).toLowerCase();
                if (hay.indexOf(query) !== -1) {
                    results.push({ bank: b.key, label: b.label, w });
                    if (results.length >= 60) break;
                }
            }
            if (results.length >= 60) break;
        }
        // 作文本检索（英文/中文内容）
        let essayHtml = '';
        if (window.EssayModule) {
            const eres = window.EssayModule.search(query);
            if (eres.length) {
                essayHtml = `<div class="search-section-title">作文本</div>` + eres.map(e => `
                    <div class="search-result essay-result" data-essay="${e.id}">
                        <div class="search-result-main">
                            <div class="search-result-word">${esc(e.title)}</div>
                            <div class="search-result-meaning">${esc(e.snippet)}${e.snippet.length >= 60 ? '…' : ''}</div>
                        </div>
                        <span class="search-result-bank">作文</span>
                    </div>`).join('');
            }
        }
        if (!results.length && !essayHtml) {
            box.innerHTML = `<div class="search-hint">没有找到匹配的单词或作文</div>`;
            return;
        }
        let html = results.map((r, i) => `
            <div class="search-result" data-i="${i}">
                <div class="search-result-main">
                    <div class="search-result-word">${esc(r.w.w)} <span class="search-result-phon">${esc(r.w.p || '')}</span></div>
                    <div class="search-result-meaning">${esc(r.w.m || '')}</div>
                </div>
                <span class="search-result-bank">${esc(r.label)}</span>
            </div>`).join('');
        html += essayHtml;
        box.innerHTML = html;
        $$('.search-result:not(.essay-result)', box).forEach(el => el.addEventListener('click', () => {
            const r = results[+el.dataset.i];
            saveProgress();
            bank = r.bank;
            if (r.bank === 'daily') catFilter = r.w.cat;
            const list = activeList();
            index = list.indexOf(r.w);
            if (index < 0) index = 0;
            showStudy('search');
        }));
        $$('.essay-result', box).forEach(el => el.addEventListener('click', () => {
            if (window.EssayModule) window.EssayModule.openEssay(el.dataset.essay);
        }));
    }

    /* ---------- 本组复习 ---------- */
    function startReview() {
        const arr = getGroup();
        if (arr.length < GROUP_SIZE) { toast('本组单词不足 20 个，继续学习吧'); return; }
        reviewWords = arr.slice(-GROUP_SIZE);
        reviewHideMastered = false;
        const hide = $('#reviewHideMastered');
        if (hide) hide.checked = false;
        renderReview();
        $('#wordStudyView').style.display = 'none';
        $('#wordReviewView').style.display = 'block';
        mode = 'review';
    }

    function exitReview() {
        $('#wordReviewView').style.display = 'none';
        $('#wordStudyView').style.display = 'block';
        showStudy(studyFrom === 'essay' ? 'essay' : 'tab');
    }

    function renderReview() {
        const grid = $('#wordReviewGrid');
        const mastered = getMastered();
        let words = reviewWords;
        if (reviewHideMastered) words = words.filter(w => !mastered.includes(w.w));
        if (!words.length) {
            grid.innerHTML = `<div class="empty-state"><p>没有需要复习的单词啦</p><span>已掌握的都藏起来咯</span></div>`;
            return;
        }
        grid.innerHTML = words.map((w, i) => {
            const saved = isSaved(w.w);
            const isM = mastered.includes(w.w);
            return `
            <div class="review-card ${isM ? 'mastered' : ''}" data-i="${i}">
                <div class="review-card-head">
                    <div class="review-word">${esc(w.w)} <span class="review-phon">${esc(w.p || '')}</span></div>
                    <button class="review-master ${isM ? 'on' : ''}" data-master="${i}" aria-label="标记掌握">${isM ? '✓ 已掌握' : '标记掌握'}</button>
                </div>
                <div class="review-meaning">${esc(w.m || '')}</div>
                <div class="review-example">
                    <div class="review-ex-en" id="rExEn${i}">${esc(w.e || '点击「随机例句」获取')}</div>
                    <div class="review-ex-cn" id="rExCn${i}">${esc(w.et || '')}</div>
                </div>
                <div class="review-actions">
                    <button class="review-act" data-speak="${i}"><span class="material-symbols-outlined">volume_up</span>发音</button>
                    <button class="review-act" data-rex="${i}"><span class="material-symbols-outlined">shuffle</span>随机例句</button>
                    <button class="review-act ${saved ? 'saved' : ''}" data-save="${i}"><span class="material-symbols-outlined">${saved ? 'bookmark' : 'bookmark_border'}</span>${saved ? '已收藏' : '收藏'}</button>
                </div>
            </div>`;
        }).join('');

        $$('.review-card', grid).forEach(card => {
            const i = +card.dataset.i;
            const w = words[i];
            const speakBtn = card.querySelector('[data-speak]');
            const rexBtn = card.querySelector('[data-rex]');
            const saveBtn = card.querySelector('[data-save]');
            const masterBtn = card.querySelector('[data-master]');
            if (speakBtn) speakBtn.addEventListener('click', () => speak(w.w));
            if (rexBtn) rexBtn.addEventListener('click', () => {
                const ex = exampleFor(w.w);
                lastExample = ex.e;
                const en = $('#rExEn' + i), cn = $('#rExCn' + i);
                if (en) en.textContent = ex.e;
                if (cn) { cn.textContent = ex.et || ''; cn.style.display = ex.et ? '' : 'none'; }
            });
            if (saveBtn) saveBtn.addEventListener('click', () => {
                toggleSaveWord(w, () => renderReview());
            });
            if (masterBtn) masterBtn.addEventListener('click', () => {
                const m = window.Store.get('wordMastered', {}) || {};
                const key = bankKey();
                const arr = m[key] || [];
                if (arr.includes(w.w)) m[key] = arr.filter(x => x !== w.w);
                else { arr.push(w.w); m[key] = arr; }
                window.Store.set('wordMastered', m);
                renderReview();
            });
        });
    }

    /* ---------- 收藏 / 作文生词本写入 ---------- */
    function toggleSave() {
        const l = activeList();
        const w = l[index];
        if (!w) return;
        toggleSaveWord(w, () => renderStudy());
    }
    function toggleSaveWord(w, after) {
        if (isSaved(w.w)) {
            const lw = (w.w || '').toLowerCase();
            customWords = customWords.filter(c => (c.w || '').toLowerCase() !== lw);
            window.Store.set('customWords', customWords);
            toast('已取消收藏');
        } else {
            customWords.unshift({ w: w.w, p: w.p, m: w.m, e: w.e, et: w.et, t: w.t, created: todayKey() });
            window.Store.set('customWords', customWords);
            toast('已收藏到词汇本');
        }
        if (after) after();
    }

    // 供作文本「选中单词加入词汇本」调用：写入【作文生词本】（独立于我的词汇本）
    function addWord(w) {
        if (!w || !w.w) return false;
        const lw = (w.w || '').toLowerCase();
        if (essayWords.some(c => (c.w || '').toLowerCase() === lw)) return false;
        essayWords.unshift({ w: w.w, p: w.p || '', m: w.m || '', e: w.e || '', et: w.et || '', t: w.t || [], created: todayKey() });
        window.Store.set('essayWords', essayWords);
        if (mode === 'wordbook') renderWordbook();
        return true;
    }

    // 进入作文生词本学习视图（来自作文本工具条）
    function showEssayStudy() {
        saveProgress();
        bank = 'essay'; loadProgress();
        showStudy('essay');
    }

    // 全局搜索栏调用：切到单词页并进入搜索视图
    function focusSearch(q) {
        searchQuery = q || '';
        showSearch();
    }

    function init() {
        // 恢复上次基础词汇进度
        loadProgress();

        // 设置每日单词背景图，并按 12 小时片轮换
        applyWordBg();
        setInterval(applyWordBg, 60 * 60 * 1000);

        // 词库切换
        $$('#wordBankTabs .tab-chip').forEach(tab => tab.addEventListener('click', () => {
            $$('#wordBankTabs .tab-chip').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const b = tab.dataset.bank;
            saveProgress();
            if (b === 'custom') { bank = 'custom'; loadProgress(); showWordbook(); return; }
            if (b === void 0) return;
            if (b === 'essay') { if (window.EssayModule) window.EssayModule.show(); return; }
            if (b === 'stats') { showStats(); return; }
            bank = b; loadProgress(); showStudy('tab');
        }));

        // 基础词库分类切换
        $$('#wordCatTabs .word-cat-chip').forEach(chip => chip.addEventListener('click', () => {
            $$('#wordCatTabs .word-cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            saveProgress();
            catFilter = chip.dataset.cat;
            loadProgress();
            renderStudy();
        }));

        $('#wordBackBtn').addEventListener('click', () => {
            if (studyFrom === 'wordbook') showWordbook();
            else if (studyFrom === 'search') showSearch();
            else if (studyFrom === 'essay') { if (window.EssayModule) window.EssayModule.show(); }
            else showStudy('tab');
        });
        $('#prevWordBtn').addEventListener('click', () => {
            const l = activeList(); if (!l.length) return;
            index = (index - 1 + l.length) % l.length; renderStudy();
        });
        $('#nextWordBtn').addEventListener('click', () => {
            const l = activeList(); if (!l.length) return;
            index = (index + 1) % l.length; renderStudy();
        });
        $('#wordRandomExampleBtn').addEventListener('click', randomExample);
        $('#saveWordBtn').addEventListener('click', toggleSave);
        $('#wordSpeakBtn').addEventListener('click', () => { const l = activeList(); speak(l[index] && l[index].w); });
        $('#wordMiniSpeakBtn').addEventListener('click', () => { const l = activeList(); speak(l[index] && l[index].w); });
        $('#wordMoreBtn').addEventListener('click', () => {
            const l = activeList(); if (!l.length) return;
            index = Math.floor(Math.random() * l.length); renderStudy(); toast('随机一个');
        });
        $('#wordSearchToggleBtn').addEventListener('click', showSearch);
        $('#wordSearchBackBtn').addEventListener('click', () => showStudy(searchReturn));
        $('#wordSearchClear').addEventListener('click', () => {
            searchQuery = ''; $('#wordSearchInput').value = ''; runSearch('');
            $('#wordSearchInput').focus();
        });
        $('#wordSearchInput').addEventListener('input', (e) => runSearch(e.target.value));

        // 本组复习
        $('#wordReviewBtn').addEventListener('click', () => { if (!$('#wordReviewBtn').disabled) startReview(); });
        $('#reviewBackBtn').addEventListener('click', exitReview);
        $('#reviewHideMastered').addEventListener('change', (e) => { reviewHideMastered = e.target.checked; renderReview(); });

        // 词汇本录入
        $('#addCustomWordBtn').addEventListener('click', () => {
            const w = $('#cwWord').value.trim();
            const p = $('#cwPhonetic').value.trim();
            const m = $('#cwMeaning').value.trim();
            if (!w || !m) { toast('请填写单词和释义'); return; }
            customWords.unshift({ w, p, m, created: todayKey() });
            window.Store.set('customWords', customWords);
            $('#cwWord').value = ''; $('#cwPhonetic').value = ''; $('#cwMeaning').value = '';
            renderWordbook();
            toast('已添加到词汇本');
        });

        // 切回每日单词页时，确保退出复习态
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveProgress(); });

        // 初始：默认基础词汇 - 操作词
        startStudyClock();
        showStudy('tab');
    }

    // 供 app.js 切回每日单词页时调用，收起复习态
    function onShow() {
        if (mode === 'review') exitReview();
    }

    // 学习时长计时：仅在「每日单词」页面且标签页可见时，每秒累计 1 秒到当日学习时长
    let studyClock = null;
    function startStudyClock() {
        if (studyClock) return;
        studyClock = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            if (window.App && window.App.currentPage && window.App.currentPage() !== 'words') return;
            if (window.StatsModule && window.StatsModule.tickStudy) window.StatsModule.tickStudy();
        }, 1000);
    }

    window.WordsModule = { init, addWord, focusSearch, showEssayStudy, onShow };
})();
