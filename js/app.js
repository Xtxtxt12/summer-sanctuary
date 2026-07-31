(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const Store = window.Store || {
        get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    };

    const PAGE_TITLE = { words: '每日单词', inspire: '灵感游戏', video: '热点视频', memo: '备忘录', settings: '设置中心' };
    let currentPage = 'words';

    function setTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        Store.set('summer_theme', dark ? 'dark' : 'light');
        const icon = $('#themeIcon');
        if (icon) icon.textContent = dark ? 'dark_mode' : 'light_mode';
        const meta = $('#themeColor');
        if (meta) meta.content = dark ? '#111217' : '#fcf9f8';
    }

    function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    }

    function applySavedTheme() {
        const saved = Store.get('summer_theme', '');
        if (saved === 'dark' || saved === 'light') { setTheme(saved === 'dark'); return; }
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
    }

    function switchPage(page) {
        if (!page || !$('#page-' + page)) page = 'words';
        currentPage = page;
        $$('.page').forEach(p => p.classList.remove('active'));
        const target = $('#page-' + page);
        if (target) target.classList.add('active');
        $$('.st-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        // 顶部栏仅在「每日单词」模块显示
        const app = $('#app');
        if (app) app.classList.toggle('hide-topbar', page !== 'words');
        if (app) app.classList.toggle('inspire-full', page === 'inspire');
        // 离开灵感游戏或任何切换时，清掉可能因全屏扭蛋残留的 capsule-full，避免状态污染
        if (app) app.classList.remove('capsule-full');
        if (page === 'words' && window.WordsModule && window.WordsModule.onShow) window.WordsModule.onShow();
        document.title = (PAGE_TITLE[page] || '夏天') + ' · 创作工作台';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function init() {
        applySavedTheme();

        // 底部导航
        $$('.st-nav-item').forEach(btn => {
            btn.addEventListener('click', () => switchPage(btn.dataset.page));
        });

        // 设置入口
        $('#settingsBtn').addEventListener('click', () => switchPage('settings'));

        // 主题切换
        $('#themeToggle').addEventListener('click', toggleTheme);

        // 全局搜索：切换到每日单词并触发搜索
        const globalSearch = $('#globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const q = globalSearch.value.trim();
                    switchPage('words');
                    if (window.WordsModule && window.WordsModule.focusSearch) window.WordsModule.focusSearch(q);
                    globalSearch.value = '';
                }
            });
        }

        // 初始化各模块
        if (window.WordsModule) window.WordsModule.init();
        if (window.EssayModule) window.EssayModule.init();
        if (window.StatsModule) window.StatsModule.init();
        if (window.InspireModule) window.InspireModule.init();
        if (window.VideoModule) window.VideoModule.init();
        if (window.MemoModule) window.MemoModule.init();
        if (window.SettingsModule) window.SettingsModule.init();
    }

    window.App = { switchPage, setTheme, toggleTheme, currentPage: () => currentPage };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
