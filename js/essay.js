/* ============================================================
   夏天 · 每日单词模块 · 作文本子功能
   归属个人词汇本体系：作文 CRUD / 分类管理 / 联动词汇本
   ============================================================ */
(function () {
    const { $, $$, esc, toast, fmtDate, fmtDateShort } = window.U;
    const DATA = window.DATA;
    const Store = window.Store;

    const DEFAULT_CATS = [
        { id: 'c1', name: '四级作文' },
        { id: 'c2', name: '书信' },
        { id: 'c3', name: '议论文' },
        { id: 'c4', name: '日常随笔' },
        { id: 'c5', name: '考场范文' }
    ];

    let essays = Store.get('essays', []);
    let cats = Store.get('essayCats', DEFAULT_CATS);
    let filterCat = 'all';
    let searchKw = '';
    let editingId = null;     // null = 新建
    let viewingId = null;
    let selCats = [];         // 编辑/移动时临时选中的分类

    /* ---------- 字典抓取（联动词汇本） ---------- */
    function findInDict(word) {
        const lw = (word || '').toLowerCase();
        for (const src of [DATA.DAILY_WORDS, DATA.CET4_WORDS]) {
            if (!src || !src.length) continue;
            const hit = src.find(w => (w.w || '').toLowerCase() === lw);
            if (hit) return { w: hit.w, p: hit.p || '', m: hit.m || '', e: hit.e || '', et: hit.et || '' };
        }
        return null;
    }

    function catNamesOf(ids) {
        return (ids || []).map(cid => {
            const c = cats.find(x => x.id === cid);
            return c ? c.name : '';
        }).filter(Boolean);
    }

    /* ---------- 列表渲染 ---------- */
    function render() {
        renderCatFilter();
        const list = $('#essayList');
        let arr = essays.slice().sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
        if (filterCat !== 'all') arr = arr.filter(e => (e.cats || []).includes(filterCat));
        if (searchKw) {
            const k = searchKw.toLowerCase();
            arr = arr.filter(e => ((e.title || '') + ' ' + (e.content || '') + ' ' + (e.translation || '') + ' ' + (e.notes || '')).toLowerCase().includes(k));
        }
        if (!arr.length) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>${essays.length ? '没有匹配的作文' : '作文本还是空的'}</p><span>${essays.length ? '试试调整搜索或分类' : '点右上角「＋ 新建作文」开始第一篇'}</span></div>`;
            return;
        }
        list.innerHTML = arr.map(e => {
            const names = catNamesOf(e.cats);
            const preview = (e.content || '').replace(/\s+/g, ' ').slice(0, 90);
            const tprev = (e.translation || '').replace(/\s+/g, ' ').slice(0, 50);
            return `<div class="essay-card ${e.fav ? 'fav' : ''}" data-id="${e.id}">
                <div class="essay-card-head">
                    <div class="essay-card-title">${esc(e.title || '未命名作文')}</div>
                    <button class="essay-card-fav ${e.fav ? 'on' : ''}" data-fav="${e.id}" aria-label="收藏">${e.fav ? '★' : '☆'}</button>
                </div>
                <div class="essay-card-preview">${esc(preview)}${preview.length >= 90 ? '…' : ''}</div>
                ${tprev ? `<div class="essay-card-trans">${esc(tprev)}…</div>` : ''}
                <div class="essay-card-foot">
                    <div class="essay-card-cats">${names.length ? names.map(n => `<span class="essay-tag">${esc(n)}</span>`).join('') : '<span class="essay-tag muted">未分类</span>'}</div>
                    <span class="essay-card-date">${fmtDateShort(e.updated || e.created || Date.now())}</span>
                </div>
            </div>`;
        }).join('');
        $$('.essay-card', list).forEach(card => card.addEventListener('click', () => openView(card.dataset.id)));
        $$('[data-fav]', list).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleFav(b.dataset.fav); }));
    }

    function renderCatFilter() {
        const box = $('#essayCatFilter');
        const chips = [`<button class="essay-cat-chip ${filterCat === 'all' ? 'active' : ''}" data-cat="all">全部</button>`]
            .concat(cats.map(c => `<button class="essay-cat-chip ${filterCat === c.id ? 'active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`));
        box.innerHTML = chips.join('');
        $$('.essay-cat-chip', box).forEach(ch => ch.addEventListener('click', () => { filterCat = ch.dataset.cat; render(); }));
    }

    /* ---------- 编辑弹窗 ---------- */
    function renderCatPick(sel) {
        const box = $(sel);
        if (!cats.length) { box.innerHTML = `<span class="essay-tag muted">暂无分类，可在「分类管理」中创建</span>`; return; }
        box.innerHTML = cats.map(c => `<button class="essay-cat-toggle ${selCats.includes(c.id) ? 'on' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('');
        $$('.essay-cat-toggle', box).forEach(b => b.addEventListener('click', () => {
            const cid = b.dataset.cat;
            if (selCats.includes(cid)) selCats = selCats.filter(x => x !== cid);
            else selCats.push(cid);
            b.classList.toggle('on');
        }));
    }

    function openEdit(id) {
        editingId = id || null;
        if (id) {
            const e = essays.find(x => x.id === id); if (!e) return;
            $('#essayEditTitle').textContent = '编辑作文';
            $('#essayFTitle').value = e.title || '';
            $('#essayFContent').value = e.content || '';
            $('#essayFTrans').value = e.translation || '';
            $('#essayFNotes').value = e.notes || '';
            selCats = (e.cats || []).slice();
        } else {
            $('#essayEditTitle').textContent = '新建作文';
            $('#essayFTitle') && ($('#essayFTitle').value = '');
            $('#essayFTitle').value = '';
            $('#essayFContent').value = '';
            $('#essayFTrans').value = '';
            $('#essayFNotes').value = '';
            selCats = [];
        }
        renderCatPick('#essayCatPick');
        $('#essayEditModal').style.display = 'flex';
        setTimeout(() => $('#essayFContent').focus(), 50);
    }

    function saveEdit() {
        const content = $('#essayFContent').value.trim();
        if (!content) { toast('请输入英文全文'); return; }
        const title = $('#essayFTitle').value.trim() || (content.split(/\s+/).slice(0, 8).join(' ') || '未命名作文');
        const translation = $('#essayFTrans').value.trim();
        const notes = $('#essayFNotes').value.trim();
        if (editingId) {
            const e = essays.find(x => x.id === editingId);
            if (e) { e.title = title; e.content = content; e.translation = translation; e.notes = notes; e.cats = selCats.slice(); e.updated = Date.now(); }
            toast('已保存修改');
        } else {
            essays.unshift({ id: 'e' + Date.now(), title, content, translation, notes, cats: selCats.slice(), fav: false, created: Date.now(), updated: Date.now() });
            toast('已保存到作文本');
        }
        Store.set('essays', essays);
        $('#essayEditModal').style.display = 'none';
        render();
    }

    /* ---------- 查看弹窗 ---------- */
    function openView(id) {
        const e = essays.find(x => x.id === id); if (!e) return;
        viewingId = id;
        $('#essayViewTitle').textContent = e.title || '未命名作文';
        const names = catNamesOf(e.cats);
        $('#essayViewBody').innerHTML = `
            <div class="essay-view-cats">${names.length ? names.map(n => `<span class="essay-view-cat">${esc(n)}</span>`).join('') : '<span class="essay-view-cat muted">未分类</span>'}</div>
            <label class="field-label">英文全文</label>
            <div class="essay-view-en" id="essayViewEn">${esc(e.content || '')}</div>
            ${e.translation ? `<label class="field-label">中文翻译</label><div class="essay-view-cn">${esc(e.translation)}</div>` : ''}
            ${e.notes ? `<label class="field-label">写作笔记</label><div class="essay-view-notes">${esc(e.notes)}</div>` : ''}
            <p class="essay-view-hint">💡 在英文正文中选中单词，可一键加入「我的词汇本」</p>`;
        $('#essayFavBtn').textContent = e.fav ? '★ 已收藏' : '☆ 收藏';
        $('#essayFavBtn').classList.toggle('active', !!e.fav);
        $('#essayViewModal').style.display = 'flex';
    }

    /* ---------- 选中单词 → 加入词汇本 ---------- */
    function onSelect() {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) { hideSelBtn(); return; }
            const text = sel.toString().trim();
            if (!text) { hideSelBtn(); return; }
            const en = $('#essayViewEn');
            let node = sel.anchorNode;
            while (node && node !== document.body) {
                if (node === en) break;
                node = node.parentNode;
            }
            if (!en || node !== en) { hideSelBtn(); return; }
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            const btn = $('#essaySelAdd');
            btn.style.display = 'block';
            btn.style.top = (rect.bottom + 8) + 'px';
            btn.style.left = Math.max(8, rect.left) + 'px';
        }, 10);
    }
    function hideSelBtn() { const b = $('#essaySelAdd'); if (b) b.style.display = 'none'; }

    function linkSelection() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const text = sel.toString();
        const words = (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).map(w => w.toLowerCase());
        const uniq = [...new Set(words)];
        if (!uniq.length) { toast('请选中英文单词'); return; }
        let added = 0, skipped = 0;
        for (const w of uniq) {
            const found = findInDict(w);
            const ok = window.WordsModule && window.WordsModule.addWord ? window.WordsModule.addWord(found ? found : { w }) : false;
            if (ok) added++; else skipped++;
        }
        sel.removeAllRanges();
        hideSelBtn();
        toast(added ? `已加入词汇本 ${added} 个生词${skipped ? `，${skipped} 个已存在` : ''}` : '词汇本已存在这些词');
    }

    /* ---------- 分类管理 ---------- */
    function openCatManage() { renderCatManage(); $('#essayCatModal').style.display = 'flex'; }
    function renderCatManage() {
        const box = $('#essayCatManageList');
        if (!cats.length) { box.innerHTML = `<div class="empty-state"><div class="empty-icon">🏷️</div><p>还没有分类</p><span>在上方输入名称添加</span></div>`; return; }
        box.innerHTML = cats.map((c, i) => `<div class="essay-cat-row" data-id="${c.id}">
            <span class="essay-cat-order">${i + 1}</span>
            <input type="text" class="essay-cat-rename" data-id="${c.id}" value="${esc(c.name)}" maxlength="20">
            <button class="icon-btn" data-up="${c.id}" aria-label="上移">↑</button>
            <button class="icon-btn" data-down="${c.id}" aria-label="下移">↓</button>
            <button class="icon-btn danger" data-del="${c.id}" aria-label="删除">🗑</button>
        </div>`).join('');
        $$('.essay-cat-rename', box).forEach(inp => inp.addEventListener('change', () => {
            const c = cats.find(x => x.id === inp.dataset.id);
            if (c) { c.name = inp.value.trim() || c.name; Store.set('essayCats', cats); renderCatFilter(); }
        }));
        $$('[data-up]', box).forEach(b => b.addEventListener('click', () => moveCat(b.dataset.up, -1)));
        $$('[data-down]', box).forEach(b => b.addEventListener('click', () => moveCat(b.dataset.down, 1)));
        $$('[data-del]', box).forEach(b => b.addEventListener('click', () => delCat(b.dataset.del)));
    }
    function addCat() {
        const inp = $('#essayNewCatName'); const name = inp.value.trim();
        if (!name) { toast('请输入分类名称'); return; }
        cats.push({ id: 'c' + Date.now(), name });
        Store.set('essayCats', cats);
        inp.value = ''; renderCatManage(); renderCatFilter();
        toast('已添加分类');
    }
    function moveCat(id, dir) {
        const i = cats.findIndex(x => x.id === id); if (i < 0) return;
        const j = i + dir; if (j < 0 || j >= cats.length) return;
        const t = cats[i]; cats[i] = cats[j]; cats[j] = t;
        Store.set('essayCats', cats); renderCatManage(); renderCatFilter();
    }
    function delCat(id) {
        cats = cats.filter(c => c.id !== id);
        essays.forEach(e => { if (e.cats) e.cats = e.cats.filter(c => c !== id); });
        Store.set('essayCats', cats); Store.set('essays', essays);
        renderCatManage(); renderCatFilter(); render();
        toast('已删除分类（作文保留）');
    }

    /* ---------- 移动分类（单篇） ---------- */
    function openMove(id) {
        viewingId = id;
        const e = essays.find(x => x.id === id);
        selCats = (e && e.cats ? e.cats : []).slice();
        renderCatPick('#essayMoveCats');
        $('#essayMoveModal').style.display = 'flex';
    }
    function saveMove() {
        const e = essays.find(x => x.id === viewingId);
        if (e) { e.cats = selCats.slice(); e.updated = Date.now(); Store.set('essays', essays); }
        $('#essayMoveModal').style.display = 'none';
        render();
        toast('已更新分类');
    }

    /* ---------- 收藏 / 删除 ---------- */
    function toggleFav(id) {
        const e = essays.find(x => x.id === id); if (!e) return;
        e.fav = !e.fav; e.updated = Date.now();
        Store.set('essays', essays); render();
        if ($('#essayViewModal').style.display !== 'none' && viewingId === id) {
            $('#essayFavBtn').textContent = e.fav ? '★ 已收藏' : '☆ 收藏';
            $('#essayFavBtn').classList.toggle('active', !!e.fav);
        }
        toast(e.fav ? '已收藏' : '已取消收藏');
    }
    function delEssay(id) {
        essays = essays.filter(e => e.id !== id);
        Store.set('essays', essays);
        $('#essayViewModal').style.display = 'none';
        render();
        toast('已删除');
    }

    /* ---------- 供全局搜索调用 ---------- */
    function search(q) {
        const query = (q || '').toLowerCase();
        if (!query) return [];
        return essays.filter(e => ((e.title || '') + ' ' + (e.content || '') + ' ' + (e.translation || '') + ' ' + (e.notes || '')).toLowerCase().includes(query))
            .slice(0, 20)
            .map(e => ({ id: e.id, title: e.title || '未命名作文', snippet: (e.content || '').replace(/\s+/g, ' ').slice(0, 60) }));
    }
    function openEssay(id) {
        const tab = $$('#wordBankTabs .tab-chip').find(t => t.dataset.bank === 'essay');
        if (tab) { $$('#wordBankTabs .tab-chip').forEach(t => t.classList.remove('active')); tab.classList.add('active'); }
        $('#wordStudyView').style.display = 'none';
        $('#wordSearchView').style.display = 'none';
        $('#wordbookListView').style.display = 'none';
        $('#wordReviewView').style.display = 'none';
        const sv = $('#statsView'); if (sv) sv.style.display = 'none';
        $('#essayView').style.display = 'block';
        render();
        openView(id);
    }

    function show() {
        $('#wordStudyView').style.display = 'none';
        $('#wordSearchView').style.display = 'none';
        $('#wordbookListView').style.display = 'none';
        $('#wordReviewView').style.display = 'none';
        const sv = $('#statsView'); if (sv) sv.style.display = 'none';
        $('#essayView').style.display = 'block';
        render();
    }

    /* ---------- 初始化 ---------- */
    function init() {
        $('#essayNewBtn').addEventListener('click', () => openEdit(null));
        $('#essayCatManageBtn').addEventListener('click', openCatManage);
        $('#essayWordbookBtn').addEventListener('click', () => { if (window.WordsModule && window.WordsModule.showEssayStudy) window.WordsModule.showEssayStudy(); });
        $('#essaySearch').addEventListener('input', e => { searchKw = e.target.value.trim(); render(); });

        $('#essayEditClose').addEventListener('click', () => $('#essayEditModal').style.display = 'none');
        $('#essayEditCancel').addEventListener('click', () => $('#essayEditModal').style.display = 'none');
        $('#essaySaveBtn').addEventListener('click', saveEdit);

        $('#essayViewClose').addEventListener('click', () => { $('#essayViewModal').style.display = 'none'; hideSelBtn(); });
        $('#essayEditFromView').addEventListener('click', () => { $('#essayViewModal').style.display = 'none'; openEdit(viewingId); });
        $('#essayMoveCatBtn').addEventListener('click', () => openMove(viewingId));
        $('#essayFavBtn').addEventListener('click', () => toggleFav(viewingId));
        $('#essayDelBtn').addEventListener('click', () => delEssay(viewingId));

        $('#essayCatClose').addEventListener('click', () => $('#essayCatModal').style.display = 'none');
        $('#essayAddCatBtn').addEventListener('click', addCat);
        $('#essayNewCatName').addEventListener('keydown', e => { if (e.key === 'Enter') addCat(); });

        $('#essayMoveClose').addEventListener('click', () => $('#essayMoveModal').style.display = 'none');
        $('#essayMoveSave').addEventListener('click', saveMove);

        // 选中英文单词 → 浮动「加入词汇本」
        const body = $('#essayViewBody');
        body.addEventListener('mouseup', onSelect);
        body.addEventListener('touchend', onSelect);
        $('#essaySelAdd').addEventListener('click', linkSelection);
        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) hideSelBtn();
        });
    }

    window.EssayModule = { init, show, search, openEssay };
})();
