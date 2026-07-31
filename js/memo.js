/* ============================================================
   夏天 · 备忘录 & AI 助手模块
   ============================================================ */
(function () {
    const { $, $$, esc, toast, fmtDate } = window.U;

    /* ====================== 备忘录 ====================== */
    const TAG_LABEL = { general: '普通', idea: '创意', todo: '待办', important: '重要' };
    const TAG_DOT = { general: 'bg-primary', idea: 'bg-secondary-container', todo: 'bg-primary', important: 'bg-error' };
    const TAG_BG = { general: 'memo-card--general', idea: 'memo-card--idea', todo: 'memo-card--todo', important: 'memo-card--important' };

    let memos = window.Store.get('memos', []);
    let memoTag = 'idea';
    let memoFilter = 'all';
    let editingId = null;
    let pendingImage = null;

    /* ---------- 待办清单语法 ---------- */
    const TODO_RE = /^- \[([ xX])\] (.*)$/;

    function parseContent(content) {
        if (!content) return [];
        return content.split('\n').map(line => {
            const m = line.match(TODO_RE);
            if (m) return { type: 'todo', done: m[1].toLowerCase() === 'x', text: m[2] };
            return { type: 'text', text: line };
        });
    }

    function serializeContent(parts) {
        return parts.map(p => p.type === 'todo' ? `- [${p.done ? 'x' : ' '}] ${p.text}` : p.text).join('\n');
    }

    function toggleTodo(m, idx) {
        const parts = parseContent(m.content);
        let todoIdx = -1;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].type === 'todo') {
                todoIdx++;
                if (todoIdx === idx) { parts[i].done = !parts[i].done; break; }
            }
        }
        m.content = serializeContent(parts);
        m.updated = Date.now();
        window.Store.set('memos', memos);
        renderMemos();
    }

    /* ---------- 渲染 ---------- */
    function renderMemos() {
        const list = $('#memoList');
        let arr = memos.slice();
        if (memoFilter !== 'all') arr = arr.filter(m => m.tag === memoFilter);
        if (!arr.length) {
            list.innerHTML = `<div class="memo-empty"><div class="memo-empty-icon">🗒️</div><p>没有匹配的便签</p><span>点击右下角 + 记录你的想法</span></div>`;
            return;
        }
        list.innerHTML = arr.map(m => renderMemoCard(m)).join('');

        // 待办交互
        $$('.memo-todo-check', list).forEach(label => {
            label.addEventListener('click', e => {
                e.stopPropagation();
                const id = label.dataset.id;
                const idx = parseInt(label.dataset.idx, 10);
                const m = memos.find(x => x.id === id);
                if (m) toggleTodo(m, idx);
            });
        });

        // 编辑
        $$('[data-edit]', list).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            openEditor(btn.dataset.edit);
        }));

        // 删除
        $$('[data-del]', list).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            memos = memos.filter(m => m.id !== btn.dataset.del);
            window.Store.set('memos', memos);
            renderMemos();
            toast('已删除');
        }));

        // 卡片点击编辑
        $$('.memo-card', list).forEach(card => card.addEventListener('click', () => openEditor(card.dataset.id)));
    }

    function renderMemoCard(m) {
        const parts = parseContent(m.content);
        const hasImage = !!m.image;
        const todos = parts.filter(p => p.type === 'todo');
        const texts = parts.filter(p => p.type === 'text' && p.text.trim()).map(p => p.text);
        const body = [];

        if (hasImage) {
            body.push(`<div class="memo-card-image" style="background-image:url('${esc(m.image)}')"></div>`);
        }

        if (m.title && m.title !== '无标题') {
            body.push(`<h3 class="memo-card-title">${esc(m.title)}</h3>`);
        }

        if (todos.length) {
            body.push(`<div class="memo-todos">${todos.map((t, i) => `
                <label class="memo-todo-check ${t.done ? 'checked' : ''}" data-id="${m.id}" data-idx="${i}">
                    <span class="memo-todo-box"><span class="material-symbols-outlined">check</span></span>
                    <span class="memo-todo-text">${esc(t.text)}</span>
                </label>`).join('')}</div>`);
        }

        if (texts.length) {
            body.push(`<p class="memo-card-text">${esc(texts.join('\n'))}</p>`);
        }

        return `
            <article class="memo-card ${TAG_BG[m.tag] || ''}" data-id="${m.id}">
                <div class="memo-card-tag"><span class="memo-dot ${TAG_DOT[m.tag] || 'bg-primary'}"></span><span>${TAG_LABEL[m.tag] || '普通'}</span></div>
                ${body.join('')}
                <div class="memo-card-footer">
                    <span class="memo-card-date">${fmtDate(m.updated || m.date)}</span>
                    <div class="memo-card-actions" onclick="event.stopPropagation()">
                        <button class="memo-card-action" data-edit="${m.id}" aria-label="编辑"><span class="material-symbols-outlined">edit</span></button>
                        <button class="memo-card-action" data-del="${m.id}" aria-label="删除"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </div>
            </article>`;
    }

    /* ---------- 分类 ---------- */
    function setMemoTag(tag) {
        memoTag = tag;
        $$('#memoTagSelect .memo-tag-chip').forEach(c => c.classList.toggle('active', c.dataset.tag === tag));
    }

    /* ---------- 图片处理 ---------- */
    function resizeImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, maxWidth / img.width);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function updateImagePreview() {
        const box = $('#memoImagePreview');
        if (!pendingImage) { box.innerHTML = ''; box.style.display = 'none'; return; }
        box.innerHTML = `
            <img src="${pendingImage}" alt="预览">
            <button type="button" class="memo-image-remove" aria-label="删除图片"><span class="material-symbols-outlined">close</span></button>`;
        box.style.display = 'block';
        box.querySelector('.memo-image-remove').addEventListener('click', () => { pendingImage = null; updateImagePreview(); });
    }

    /* ---------- 编辑器 ---------- */
    function openEditor(id) {
        editingId = id || null;
        $('#memoModalTitle').textContent = id ? '编辑便签' : '新建便签';
        $('#memoSaveBtn').textContent = id ? '保存' : '添加';

        if (id) {
            const m = memos.find(x => x.id === id);
            if (!m) return;
            $('#memoTitleInput').value = m.title === '无标题' ? '' : m.title;
            $('#memoContentInput').value = m.content;
            setMemoTag(m.tag);
            pendingImage = m.image || null;
        } else {
            $('#memoTitleInput').value = '';
            $('#memoContentInput').value = '';
            setMemoTag(memoFilter === 'all' ? 'idea' : memoFilter);
            pendingImage = null;
        }
        updateImagePreview();
        $('#memoModal').style.display = 'flex';
        $('#memoTitleInput').focus();
    }

    function closeEditor() {
        $('#memoModal').style.display = 'none';
        editingId = null;
        pendingImage = null;
        $('#memoTitleInput').value = '';
        $('#memoContentInput').value = '';
        updateImagePreview();
    }

    function saveMemo() {
        const title = $('#memoTitleInput').value.trim();
        const content = $('#memoContentInput').value.trim();
        if (!title && !content && !pendingImage) { toast('请输入内容或添加图片'); return; }

        if (editingId) {
            const m = memos.find(x => x.id === editingId);
            if (m) {
                m.title = title || '无标题';
                m.content = content;
                m.tag = memoTag;
                m.image = pendingImage || undefined;
                m.updated = Date.now();
            }
            toast('已保存');
        } else {
            memos.unshift({
                id: 'm' + Date.now(),
                title: title || '无标题',
                content,
                tag: memoTag,
                image: pendingImage || undefined,
                done: false,
                date: Date.now(),
                updated: Date.now()
            });
            toast('已添加');
        }
        window.Store.set('memos', memos);
        closeEditor();
        renderMemos();
    }

    function initMemo() {
        // 分类筛选
        $$('#memoFilters .memo-filter').forEach(f => f.addEventListener('click', () => {
            $$('#memoFilters .memo-filter').forEach(x => x.classList.remove('active'));
            f.classList.add('active');
            memoFilter = f.dataset.filter;
            renderMemos();
        }));

        // 标签选择
        $$('#memoTagSelect .memo-tag-chip').forEach(c => c.addEventListener('click', () => setMemoTag(c.dataset.tag)));

        // FAB
        $('#memoFab').addEventListener('click', () => openEditor());

        // 模态框
        $('#memoModalClose').addEventListener('click', closeEditor);
        $('#memoModalBackdrop').addEventListener('click', closeEditor);
        $('#memoSaveBtn').addEventListener('click', saveMemo);

        // 图片上传
        $('#memoImageInput').addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                pendingImage = await resizeImage(file);
                updateImagePreview();
            } catch (err) {
                toast('图片处理失败');
            }
            e.target.value = '';
        });

        // 添加待办行
        $('#memoTodoLineBtn').addEventListener('click', () => {
            const ta = $('#memoContentInput');
            const before = ta.value;
            const after = before ? before.replace(/\n$/, '') + '\n- [ ] ' : '- [ ] ';
            ta.value = after;
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        });

        renderMemos();
    }

    /* ====================== AI 助手 ====================== */
    let aiConfig = window.Store.get('aiConfig', { endpoint: '', key: '', model: '' });
    let aiHistory = window.Store.get('aiHistory', []);

    function renderChat() {
        const box = $('#aiChat');
        if (!aiHistory.length) {
            box.innerHTML = `<div class="empty-state" style="padding:30px 10px;"><div class="empty-icon">🤖</div><p>我是夏天的 AI 助手</p><span>可以提问、写文案、翻译、头脑风暴、梳理思路</span></div>`;
            return;
        }
        box.innerHTML = aiHistory.map(m => {
            if (m.role === 'user') return `<div class="ai-msg user">${esc(m.content)}</div>`;
            return `<div class="ai-msg bot">${esc(m.content)}<div class="ai-msg-actions"><button class="ai-save-memo" data-text="${encodeURIComponent(m.content)}">保存到备忘录</button></div></div>`;
        }).join('');
        $$('.ai-save-memo', box).forEach(b => b.addEventListener('click', () => {
            const text = decodeURIComponent(b.dataset.text);
            memos.unshift({ id: 'm' + Date.now(), title: 'AI：' + text.slice(0, 16), content: text, tag: 'idea', done: false, date: Date.now(), updated: Date.now() });
            window.Store.set('memos', memos);
            renderMemos();
            toast('已保存到备忘录');
        }));
        box.scrollTop = box.scrollHeight;
    }

    // 演示应答（无 API 时）
    function demoReply(userText) {
        const t = userText.toLowerCase();
        if (t.includes('脚本') || t.includes('大纲')) {
            return '【短视频脚本大纲】\n1. 开头钩子（0-3s）：用一个反差或悬念抓住注意力\n2. 痛点引入（3-15s）：点出观众共鸣的问题\n3. 解决方案（15-40s）：你的方法/产品\n4. 高潮演示（40-55s）：效果对比或反转\n5. 结尾行动（55-60s）：引导点赞/关注/评论\n\n需要我针对某个具体选题展开吗？';
        }
        if (t.includes('翻译') || t.includes('英文') || t.includes('英语')) {
            return '好的，请把需要翻译的内容发给我，我会保持口语化、自然地道的中文/英文表达。也可以告诉我目标平台（抖音口语 / B站解说 / 商务），我会调整语气。';
        }
        if (t.includes('头脑风暴') || t.includes('选题')) {
            return '给你 3 个选题方向：\n① 「反常识科普」：用 30 秒推翻一个常见误解\n② 「沉浸式记录」：普通人一天的真实切片\n③ 「旧物新用」：把闲置物品玩出花\n每个方向都能延伸成系列，你想先深挖哪个？';
        }
        if (t.includes('思路') || t.includes('整理') || t.includes('梳理')) {
            return '我们可以按这个结构梳理：\n• 目标：这条内容要达成什么？（涨粉/带货/人设）\n• 受众：谁会看？他们关心什么？\n• 钩子：前 3 秒凭什么留住人？\n• 价值：看完能带走什么？\n把你的初步想法丢给我，我帮你填进这个框架。';
        }
        return '收到～我是夏天工作台的 AI 助手（当前为演示模式）。配置 API 后我能进行真实多轮对话、写文案、翻译与头脑风暴。你可以：\n• 点下方快捷按钮试试\n• 或在「⚙️ API 设置」里填入 OpenAI 兼容的接口后获得真实回复';
    }

    async function sendAI() {
        const input = $('#aiInput');
        const text = input.value.trim();
        if (!text) return;
        aiHistory.push({ role: 'user', content: text });
        input.value = '';
        input.style.height = 'auto';
        renderChat();

        const thinking = document.createElement('div');
        thinking.className = 'ai-msg bot';
        thinking.textContent = '思考中…';
        $('#aiChat').appendChild(thinking);
        $('#aiChat').scrollTop = $('#aiChat').scrollHeight;

        let reply;
        if (aiConfig && aiConfig.endpoint && aiConfig.key) {
            try {
                const messages = aiHistory
                    .filter(m => m.role === 'user' || m.role === 'assistant')
                    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
                const resp = await fetch(aiConfig.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.key },
                    body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages })
                });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const data = await resp.json();
                reply = data.choices?.[0]?.message?.content || data.reply || data.output || '（空回复）';
            } catch (e) {
                reply = '⚠️ 调用失败：' + e.message + '\n请检查 API 地址、Key 与模型名是否正确，或网络是否可达。';
            }
        } else {
            await new Promise(r => setTimeout(r, 500));
            reply = demoReply(text);
        }

        thinking.remove();
        aiHistory.push({ role: 'assistant', content: reply });
        window.Store.set('aiHistory', aiHistory);
        renderChat();
    }

    function initAI() {
        // 设置面板
        const toggle = $('#aiSettingsToggle');
        toggle.addEventListener('click', () => {
            const body = $('#aiSettingsBody');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        $('#aiEndpoint').value = aiConfig.endpoint || '';
        $('#aiKey').value = aiConfig.key || '';
        $('#aiModel').value = aiConfig.model || '';
        updateAIStatus();
        $('#aiSaveSettings').addEventListener('click', () => {
            aiConfig = {
                endpoint: $('#aiEndpoint').value.trim(),
                key: $('#aiKey').value.trim(),
                model: $('#aiModel').value.trim()
            };
            window.Store.set('aiConfig', aiConfig);
            updateAIStatus();
            toast('已保存 API 设置');
        });

        // 发送
        $('#aiSendBtn').addEventListener('click', sendAI);
        $('#aiInput').addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
        });
        $('#aiInput').addEventListener('input', e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });
        $$('.quick-chip').forEach(c => c.addEventListener('click', () => {
            $('#aiInput').value = c.dataset.q;
            sendAI();
        }));

        renderChat();
    }

    function updateAIStatus() {
        const ok = aiConfig && aiConfig.endpoint && aiConfig.key;
        $('#aiSettingsStatus').textContent = ok ? '已配置 · 真实模式' : '未配置 · 演示模式';
    }

    /* ====================== 子标签切换 ====================== */
    function init() {
        $$('#memoTabs .tab-chip').forEach(tab => tab.addEventListener('click', () => {
            $$('#memoTabs .tab-chip').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sub = tab.dataset.sub;
            $('#notesView').style.display = sub === 'notes' ? 'block' : 'none';
            $('#aiView').style.display = sub === 'ai' ? 'block' : 'none';
        }));
        initMemo();
        initAI();
    }

    window.MemoModule = { init };
})();
