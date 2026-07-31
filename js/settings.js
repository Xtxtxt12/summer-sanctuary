(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const Store = window.Store;

    function updateThemePreview() {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        const dayLayer = $('#themeDayLayer');
        const nightLayer = $('#themeNightLayer');
        if (dayLayer) dayLayer.classList.toggle('active', !dark);
        if (nightLayer) nightLayer.classList.toggle('active', dark);
    }

    function exportData() {
        const keys = ['summer_custom_words', 'summer_essays', 'summer_essay_cats', 'summer_memos', 'summer_ai_settings', 'summer_silk_ranks', 'summer_inspire_saved', 'summer_theme', 'summer_visit_log'];
        const data = {};
        for (const k of keys) { try { data[k] = Store.get(k.replace('summer_', '').replace(/_/g, ''), undefined); } catch {} }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'summer-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click(); URL.revokeObjectURL(url);
        if (window.U && window.U.toast) window.U.toast('数据已导出');
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                const keyMap = {
                    customWords: 'summer_custom_words',
                    essays: 'summer_essays',
                    essayCats: 'summer_essay_cats',
                    memos: 'summer_memos',
                    aiSettings: 'summer_ai_settings',
                    silkRanks: 'summer_silk_ranks',
                    inspireSaved: 'summer_inspire_saved',
                    theme: 'summer_theme',
                    visitLog: 'summer_visit_log'
                };
                for (const [k, storeKey] of Object.entries(keyMap)) {
                    if (data[k] !== undefined) localStorage.setItem(storeKey, JSON.stringify(data[k]));
                }
                if (window.U && window.U.toast) window.U.toast('数据已恢复，刷新后生效');
            } catch (e) {
                if (window.U && window.U.toast) window.U.toast('恢复失败：文件格式错误');
            }
        };
        reader.readAsText(file);
    }

    function resetData() {
        if (!confirm('确定要清空所有本地数据吗？此操作不可恢复。')) return;
        const keep = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('summer_') && !keep.includes(k)) localStorage.removeItem(k);
        }
        if (window.U && window.U.toast) window.U.toast('数据已清空，刷新后生效');
    }

    function init() {
        const themeCard = $('#settingsThemeCard');
        if (themeCard) {
            updateThemePreview();
            themeCard.addEventListener('click', () => {
                if (window.App && window.App.toggleTheme) window.App.toggleTheme();
                updateThemePreview();
            });
        }

        $('#settingsApiBtn').addEventListener('click', () => {
            if (window.App && window.App.switchPage) window.App.switchPage('memo');
            const aiTab = document.querySelector('#memoTabs [data-sub="ai"]');
            if (aiTab) aiTab.click();
        });

        $('#settingsDataBtn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); };
            const actions = confirm('点击「确定」导出数据；「取消」继续选择备份文件导入或清空。\n（导入会覆盖当前数据）');
            if (actions) exportData();
            else {
                const choice = prompt('输入 import 选择备份文件导入，或输入 reset 清空所有数据：', 'import');
                if (choice === 'import') input.click();
                else if (choice === 'reset') resetData();
            }
        });

        // listen to theme changes from other toggles
        const observer = new MutationObserver(updateThemePreview);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    window.SettingsModule = { init, updateThemePreview };
})();
