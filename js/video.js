/* ============================================================
   夏天 · 热点视频追寻模块（Trending Signals）
   - 搜索：模糊匹配当前平台的「短视频」与「创作者用户」，双分区展示
   - 热门推荐「换一批」：随机刷新、不重复往期、热度层级轮换
   - 点击任意视频条目加载到上方播放区并同步更新爆点拆解/脚本流程
   - 每日日期种子自动轮换当日爆款
   - 视频链接解析：粘贴分享链接 → 识别平台 → 加载播放区并生成 6 项深度拆解报告
   ============================================================ */
(function () {
    const { $, $$, esc, toast } = window.U;
    const DATA = window.DATA;

    const PLATFORM_NAME = { douyin: '抖音', kuaishou: '快手', bilibili: 'B站', xiaohongshu: '小红书' };
    const PF_ICON = { douyin: '🎵', kuaishou: '⚡', bilibili: '📺', xiaohongshu: '📕' };
    const PLATFORM_SEARCH = {
        douyin: 'https://www.douyin.com/search/',
        kuaishou: 'https://www.kuaishou.com/search/video?searchKey=',
        bilibili: 'https://search.bilibili.com/all?keyword=',
        xiaohongshu: 'https://www.xiaohongshu.com/search_result?keyword='
    };
    const HEAT_LABEL = { 1: '潜力上升', 2: '高热', 3: '爆款' };
    const EMOTIONS = ['好奇心缺口', '情感共鸣', '反转惊喜', '实用价值', '身份认同', '猎奇心理', '紧迫感', '治愈感'];
    const RADAR_LABELS = [
        { key: 'hook', label: '开头钩子' },
        { key: 'pacing', label: '节奏把控' },
        { key: 'visual', label: '视觉呈现' },
        { key: 'audio', label: '音效氛围' },
        { key: 'value', label: '信息价值' },
        { key: 'retention', label: '留存预期' }
    ];

    // 候选池（含扩充的当日爆款样本）
    const XIAOHONGSHU = [
        { id: 'xhs20260731a', title: '三伏天不脱妆公式｜出门2小时脸还在', author: '夏日妆容研究所', likes: '78.9w', dur: '01:32', thumb: '', tags: ['妆容', '夏日', '控油'], analysis: { hook: '"脸还在"口语化痛点，一句话说清结果', structure: '暴晒实测→控油三步→2小时后对比', bgm: '清爽轻电子', rhythm: '中速，对比画面定格强调', comments: '热评：定妆喷雾链接 / 油皮有救了', topic: '夏日控油妆容' } },
        { id: 'xhs20260731b', title: '7月最后一天｜把上半年没做完的事列了个清单', author: '月末复盘girl', likes: '55.4w', dur: '02:08', thumb: '', tags: ['复盘', '自律', '月末'], analysis: { hook: '"最后一天"制造时间紧迫感', structure: '摊开手帐→逐条复盘→下半年三个小目标', bgm: '治愈钢琴', rhythm: '舒缓，手写特写为主', comments: '热评：破防了 / 抄作业', topic: '月末复盘仪式感' } },
        { id: 'xhs1', title: '沉浸式护肤｜睡前10分钟养成水光肌', author: '护肤小白', likes: '86.5w', dur: '01:28', thumb: '', tags: ['护肤', 'routine', '治愈'], analysis: { hook: '"水光肌"结果前置', structure: '洁面→精华→面霜，ASMR 氛围', bgm: '轻柔白噪音', rhythm: '慢节奏，特写为主', comments: '热评：求产品清单 / 太治愈了', topic: '护肤日常' } },
        { id: 'xhs2', title: '租房好物｜50元改造丑衣柜', author: '租房改造日记', likes: '52.3w', dur: '02:15', thumb: '', tags: ['租房', '改造', '好物'], analysis: { hook: '"50元"低价冲击', structure: '改造前→材料→过程→对比', bgm: '轻快流行乐', rhythm: '中速，前后对比强调', comments: '热评：链接拿来 / 房东看了想涨租', topic: '低成本改造' } },
        { id: 'xhs3', title: '减脂便当｜打工人一周备餐', author: '健康便当酱', likes: '71.8w', dur: '03:02', thumb: '', tags: ['减脂', '备餐', '便当'], analysis: { hook: '"一周备餐"实用承诺', structure: '食材准备→分装→成品展示', bgm: '轻快电子乐', rhythm: '明快，步骤清晰', comments: '热评：明天就开始 / 求饭盒链接', topic: '健康生活方式' } },
        { id: 'xhs4', title: 'Fuji 相机直出参数｜阴天也通透', author: '摄影阿泽', likes: '34.6w', dur: '01:45', thumb: '', tags: ['摄影', '相机', '教程'], analysis: { hook: '"直出参数"解决痛点', structure: '样片→参数→场景对比', bgm: '无/轻音乐', rhythm: '中速，对比慢放', comments: '热评：参数码了 / 同款相机', topic: '摄影技巧' } },
        { id: 'xhs5', title: '面试穿搭｜小个子高级感', author: '职场穿搭豆', likes: '45.2w', dur: '01:20', thumb: '', tags: ['穿搭', '职场', '小个子'], analysis: { hook: '"小个子"精准人群', structure: '场景需求→三套搭配→上身效果', bgm: '轻快节奏', rhythm: '快剪，展示为主', comments: '热评：第三套链接 / 太实用了', topic: '职场穿搭' } },
        { id: 'xhs6', title: '周末徒步｜上海周边小众路线', author: '周末出逃计划', likes: '62.1w', dur: '02:48', thumb: '', tags: ['徒步', '周末', '户外'], analysis: { hook: '"小众路线"制造稀缺', structure: '路线介绍→风景空镜→攻略Tips', bgm: '治愈民谣', rhythm: '舒缓，风景为主', comments: '热评：下周就去 / 求导航', topic: '户外生活方式' } },
        { id: 'xhs7', title: '通勤穿搭｜小个子显高公式', author: '穿搭研究僧', likes: '39.4w', dur: '01:10', thumb: '', tags: ['穿搭', '通勤', '小个子'], analysis: { hook: '"小个子显高"精准人群', structure: '痛点→三套搭配→上身对比', bgm: '轻快节奏', rhythm: '快剪，展示为主', comments: '热评：第三套链接 / 太实用', topic: '通勤穿搭' } },
        { id: 'xhs8', title: '租房神器｜10件提升幸福感好物', author: '好物挖掘机', likes: '57.1w', dur: '02:05', thumb: '', tags: ['好物', '租房', '幸福感'], analysis: { hook: '"10件好物"清单体', structure: '场景引入→逐件展示→使用效果', bgm: '轻快', rhythm: '中速，特写多', comments: '热评：全买了 / 求链接', topic: '租房好物' } },
        { id: 'xhs9', title: '早起自律｜6点起床的晨间仪式', author: '自律小猫', likes: '43.8w', dur: '01:35', thumb: '', tags: ['自律', '早起', '习惯'], analysis: { hook: '"6点起床"行动召唤', structure: '起床→晨间流程→状态变化', bgm: '治愈白噪音', rhythm: '舒缓，氛围为主', comments: '热评：明天就试 / 太治愈', topic: '自律习惯' } },
        { id: 'xhs10', title: '低成本旅行｜周末City Walk路线', author: '城市漫游猫', likes: '61.2w', dur: '02:30', thumb: '', tags: ['旅行', '城市', '周末'], analysis: { hook: '"低成本旅行"降低门槛', structure: '路线总览→打卡点→美食推荐', bgm: '治愈民谣', rhythm: '中速，风景空镜', comments: '热评：周末就去 / 求地图', topic: '城市微旅行' } }
    ];
    if (!DATA.VIDEOS.xiaohongshu) DATA.VIDEOS.xiaohongshu = XIAOHONGSHU;

    // 每个平台首条视频的精细化爆点拆解
    const FEATURED = {
        dy1: { emotion: '好奇心缺口', tagline: '前3秒直接甩出"辞职+月入3万"反差钩子', radar: { hook: 9.5, pacing: 8.0, visual: 7.5, audio: 9.0, value: 6.0, retention: 7.0 }, script: [ { time: '0:00-0:03', title: '反差开场', desc: '"辞职摆摊"与"月入3万"形成强烈反差，立刻抓住注意力' }, { time: '0:03-0:45', title: '成本拆解', desc: '展示原料、摊位、出摊过程，建立真实感' }, { time: '0:45-2:31', title: '收入揭晓', desc: '算账环节给出具体数字，满足观众对"搞钱"的好奇' } ] },
        ks1: { emotion: '实用价值', tagline: '"废旧轮胎"废物利用，成品让全村惊叹', radar: { hook: 8.5, pacing: 7.0, visual: 8.5, audio: 7.0, value: 8.0, retention: 7.5 }, script: [ { time: '0:00-0:05', title: '冲突开场', desc: '废旧轮胎与精美沙发的反差' }, { time: '0:05-2:00', title: '制作过程', desc: '一步步展示切割、编织、上色' }, { time: '2:00-5:02', title: '成品展示', desc: '全村围观，价值感升华' } ] },
        b1: { emotion: '情感共鸣', tagline: '"奶奶看哭了"把 AI 技术与亲情结合', radar: { hook: 9.0, pacing: 7.5, visual: 8.5, audio: 8.0, value: 8.5, retention: 8.0 }, script: [ { time: '0:00-0:10', title: '情感钩子', desc: '老照片+奶奶反应，建立情感连接' }, { time: '0:10-3:00', title: '工具演示', desc: 'Stable Diffusion 参数与操作步骤' }, { time: '3:00-11:23', title: '成果升华', desc: '动画成品与亲人反馈' } ] },
        xhs1: { emotion: '治愈感', tagline: '"水光肌"结果前置，睡前仪式拉满', radar: { hook: 8.0, pacing: 7.0, visual: 8.5, audio: 9.0, value: 7.0, retention: 7.0 }, script: [ { time: '0:00-0:03', title: '结果前置', desc: '素颜水光肌特写，制造向往' }, { time: '0:03-0:50', title: '护肤流程', desc: '洁面、精华、面霜逐步展示' }, { time: '0:50-1:28', title: '沉浸收尾', desc: '白噪音+入睡氛围，强化治愈' } ] }
    };

    // 各平台创作者用户（供搜索「匹配创作者」分区展示）
    const USERS = {
        douyin: [
            { id: 'u_dy1', name: '摆摊老王', handle: '@baitan_wang', avatar: '🔥', followers: '892.3w', bio: '辞职摆摊月入3万的烟火气博主', tags: ['摆摊', '创业', '美食'] },
            { id: 'u_dy2', name: '山野食记', handle: '@shanye_food', avatar: '🍢', followers: '654.1w', bio: '用最土的方法做最野的味', tags: ['美食', '乡村', '纪实'] },
            { id: 'u_dy3', name: '都市夜归人', handle: '@night_ranger', avatar: '🌃', followers: '321.7w', bio: '记录城市深夜的每一种活法', tags: ['城市', 'vlog', '情感'] },
            { id: 'u_dy4', name: '健身狂魔阿强', handle: '@fit_qiang', avatar: '💪', followers: '543.2w', bio: '每天一个在家练爆的动作', tags: ['健身', '减脂', '教程'] },
            { id: 'u_dy5', name: '厨房研究所', handle: '@kitchen_lab', avatar: '🍳', followers: '776.5w', bio: '把家常菜做出餐厅感', tags: ['美食', '教程', '测评'] },
            { id: 'u_dy6', name: '恋爱急救室', handle: '@love_er', avatar: '💗', followers: '433.9w', bio: '专治各种情感疑难杂症', tags: ['情感', '恋爱', '干货'] }
        ],
        kuaishou: [
            { id: 'u_ks1', name: '东北老铁日常', handle: '@dongbei_lt', avatar: '❄️', followers: '1203.4w', bio: '记录东北人的快乐生活', tags: ['乡村', '搞笑', '地域'] },
            { id: 'u_ks2', name: '山货阿妹', handle: '@shanhuo_mei', avatar: '🏔️', followers: '689.2w', bio: '深山好物带货第一人', tags: ['带货', '山货', '乡村'] },
            { id: 'u_ks3', name: '老手艺传人', handle: '@craft_master', avatar: '🛠️', followers: '412.8w', bio: '守住一门快要失传的手艺', tags: ['手艺', '非遗', '纪实'] },
            { id: 'u_ks4', name: '乡村大席', handle: '@country_banquet', avatar: '🍲', followers: '980.1w', bio: '一桌流水席招待全村', tags: ['美食', '乡村', '团圆'] },
            { id: 'u_ks5', name: '快手助农小哥', handle: '@zhunong', avatar: '🌾', followers: '356.4w', bio: '帮老乡把农产品卖出去', tags: ['助农', '带货', '公益'] }
        ],
        bilibili: [
            { id: 'u_b1', name: '硬核科普君', handle: '@hardcore_kepu', avatar: '🧠', followers: '567.3w', bio: '用动画把复杂知识讲明白', tags: ['科普', '动画', '知识'] },
            { id: 'u_b2', name: '老照片修复师', handle: '@photo_fix', avatar: '📷', followers: '689.1w', bio: '让泛黄的记忆重新鲜活', tags: ['技术', '情怀', '教程'] },
            { id: 'u_b3', name: '数码评测室', handle: '@digital_test', avatar: '📱', followers: '812.4w', bio: '不恰烂钱的真实评测', tags: ['数码', '评测', '硬件'] },
            { id: 'u_b4', name: '游戏考古队', handle: '@game_arche', avatar: '🎮', followers: '443.7w', bio: '挖掘被遗忘的经典游戏', tags: ['游戏', '怀旧', '解说'] },
            { id: 'u_b5', name: '带货研究所', handle: '@live_sell', avatar: '🛒', followers: '298.6w', bio: '拆解每一场千万级直播', tags: ['电商', '直播', '分析'] }
        ],
        xiaohongshu: [
            { id: 'u_xhs1', name: '护肤小白', handle: '@skincare_bai', avatar: '💧', followers: '245.8w', bio: '敏感肌也能养出水光肌', tags: ['护肤', '成分', '干货'] },
            { id: 'u_xhs2', name: '租房改造日记', handle: '@rent_makeover', avatar: '🏠', followers: '198.3w', bio: '租来的房子也要好好住', tags: ['家居', '改造', '租房'] },
            { id: 'u_xhs3', name: '健康便当酱', handle: '@healthy_bento', avatar: '🥗', followers: '312.6w', bio: '打工人带饭不重样', tags: ['减脂', '便当', '健康'] },
            { id: 'u_xhs4', name: '摄影阿泽', handle: '@photo_aze', avatar: '📸', followers: '176.4w', bio: '手机也能拍出电影感', tags: ['摄影', '教程', '氛围'] },
            { id: 'u_xhs5', name: '职场穿搭豆', handle: '@office_wear', avatar: '👗', followers: '221.9w', bio: '小个子的显高穿搭公式', tags: ['穿搭', '职场', '显高'] },
            { id: 'u_xhs6', name: '周末出逃计划', handle: '@weekend_escape', avatar: '🥾', followers: '287.5w', bio: '周末就往山里钻', tags: ['户外', '徒步', '旅行'] }
        ]
    };

    // 链接解析：平台识别 / 标题 / 作者 / 报告 模板池
    const PARSE_TITLES = {
        douyin: ['3天涨粉10万，我靠的就是这个选题公式', '普通人也能拍的爆款vlog，0成本起号', '一条视频带火整个县城，文旅局都来点赞', '千万别再用老方法做账号了，这套才有效'],
        kuaishou: ['农村大集上的隐藏美食，老铁都排队', '旧物改造第二弹，这次更绝了', '赶集vlog｜10块钱在农村能买到啥', '东北冬天这顿饭，看完直接饿了'],
        bilibili: ['耗时30天，我用AI还原了奶奶的青春', '硬核拆解：百万播放视频的底层逻辑', '万字长文讲不透，这条视频讲透', '我把这个冷门技术做成了爆款'],
        xiaohongshu: ['素人博主的第一条爆款，复盘全过程', '小众宝藏地｜周末就能去', '平价好物分享｜学生党狂喜', '普通女孩的逆袭穿搭公式']
    };
    const PARSE_AUTHORS = {
        douyin: ['搞钱小课堂', '深夜创作者', '爆款研究所'],
        kuaishou: ['乡土食记', '老铁严选', '赶集阿婆'],
        bilibili: ['硬核拆解菌', '老照片修复师', '百万拆解官'],
        xiaohongshu: ['素人成长记', '宝藏生活家', '平价测评喵']
    };
    const HOOK_EXCERPTS = {
        '好奇缺口': '“你绝对想不到，这一步直接决定了播放量”',
        '冲突前置': '“别再这样拍了，90%的人都做错了”',
        '痛点直击': '“每天加班到半夜，还是存不下钱？”',
        '反差对比': '“同样是素人，为什么她3天就爆了”',
        '福利钩子': '“评论区送同款模板，手慢无”'
    };
    const REUSABLE_POOL = [
        '「痛点提问+反例警示+正确示范+结果对比」四段式，可套用到任何技能教学类选题',
        '前3秒抛出反差数字钩子，中段用逐帧拆解建立专业感，结尾用福利引导互动',
        '以「普通人逆袭」人设切入降低距离感，再用干货建立信任，最后用福利促转化',
        '用「你是不是也…」句式制造代入，再给一个低门槛可复制的方法论收尾'
    ];
    const WEAKNESS_POOL = [
        '中段节奏偏慢，建议把核心方法前置到前10秒；评论区互动引导可以更明确',
        '封面与标题不够统一，建议强化记忆点；BGM 与情绪峰值未完全对齐',
        '结尾行动召唤偏弱，可增加「评论区扣1领模板」式强引导以提升转化',
        '开头钩子虽强，但中段信息密度不足，建议补充一个具象化案例撑住停留'
    ];
    const COMMENT_POOL = [
        '求模板/链接，已经码住', '博主太懂普通人了', '看了三遍还是没学会',
        '这波操作我直接抄作业', '求更新下一期', '原来还能这么玩',
        '已转发给闺蜜', '看完立刻去试了', '这剪辑也太丝滑了', '蹲一个详细教程'
    ];
    const TRANSCRIPT_POOL = [
        '大家好，今天跟大家分享一个我最近发现的选题公式……其实核心就三步，第一是找准用户的真实痛点，第二是用一个反差的开头把人留住，第三才是给方法，接下来我一步一步演示给你看。',
        '很多人问我为什么视频能火，其实没什么秘密，就是开头那三秒决定了命运，接下来我会拆给你看，从选题到结构再到发布时间，每一步都讲清楚。',
        '这条视频我想复盘一下，从0到100万播放到底做对了什么，第一是选题切中情绪，第二是结构清晰有节奏，第三是发布时间踩对了节点。'
    ];

    let platform = 'douyin';
    let saved = window.Store.get('savedVideos', []);
    let currentFeaturedId = null;   // 当前加载到播放区的视频 id
    let currentFeatured = null;     // 当前播放区视频对象（供复制）
    let query = '';                 // 搜索关键词
    let shuffleSeed = null;         // null=按日期种子；否则随机种子（换一批）
    let refreshOverride = null;     // 换一批后的有序列表（覆盖常规列表）
    let shownIds = new Set();       // 已推送过的视频 id（避免「换一批」重复）
    let parsedHistory = [];         // 解析记录（持久化到 Store，解析导航栏内展示）

    function loadHistory() {
        try {
            const raw = window.Store.get('videoParseHistory');
            if (Array.isArray(raw)) parsedHistory = raw;
        } catch (e) { /* ignore */ }
    }
    function saveHistory() {
        try { window.Store.set('videoParseHistory', parsedHistory.slice(0, 30)); } catch (e) { /* ignore */ }
    }
    let isParsing = false;          // 正在解析
    let parseCooldown = { url: '', ts: 0 }; // 单条视频 30s 冷却

    function isSaved(id) { return saved.includes(id); }

    function hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) >>> 0;
        return h;
    }
    function pick(arr, seed) { return arr[seed % arr.length]; }

    function makeUrl(v, p) { return PLATFORM_SEARCH[p] + encodeURIComponent(v.title); }

    // 热度层级：根据点赞数划分 1=潜力 2=高热 3=爆款
    function heatTier(v) {
        const n = parseFloat((v.likes || '').replace(/[w万]/g, '')) || 0;
        return n >= 70 ? 3 : n >= 40 ? 2 : 1;
    }

    // 每日日期种子：当天稳定，隔天自动变化 → 实现“当日爆款”轮换
    function daySeed() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }
    function seededShuffle(arr, seed) {
        let s = (seed >>> 0) || 1;
        const rand = () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }

    function getList() {
        let list;
        if (platform === 'saved') {
            list = [];
            Object.keys(DATA.VIDEOS).forEach(p => {
                DATA.VIDEOS[p].forEach(v => { if (isSaved(v.id)) list.push(enrich(v, p)); });
            });
        } else {
            list = (DATA.VIDEOS[platform] || []).map(v => enrich(v, platform));
        }
        return list;
    }

    function orderList(list) {
        const seed = shuffleSeed != null ? shuffleSeed : daySeed();
        return seededShuffle(list, seed);
    }

    function enrich(v, p) {
        const h = hash(v.id);
        const feat = FEATURED[v.id] || {};
        const a = v.analysis || {};
        const likesStr = (v.likes || '0').replace(/[w万]/g, '');
        const likesNum = parseFloat(likesStr) || 10;
        const unit = /[w万]/.test(v.likes || '') ? 'w' : '';
        const multiplier = 2.5 + (h % 4) / 2;
        const views = v.views || (likesNum * multiplier).toFixed(1) + unit;
        const shares = v.shares || Math.max(1, (likesNum / (3 + h % 5))).toFixed(1) + unit;
        const defaultScript = [
            { time: '0:00-0:03', title: '黄金钩子', desc: a.hook || '前3秒抓住注意力' },
            { time: '0:03-0:30', title: '内容展开', desc: a.structure || '核心内容呈现' },
            { time: '0:30+', title: '节奏与氛围', desc: ((a.rhythm || '') + (a.bgm ? ' · BGM：' + a.bgm : '')) || '稳定输出，强化记忆点' }
        ];
        const defaultRadar = {
            hook: 5 + (h % 6), pacing: 5 + ((h * 2) % 6), visual: 5 + ((h * 3) % 6),
            audio: 5 + ((h * 4) % 6), value: 5 + ((h * 5) % 6), retention: 5 + ((h * 6) % 6)
        };
        Object.keys(defaultRadar).forEach(k => { defaultRadar[k] = Math.min(10, Math.round(defaultRadar[k] * 10) / 10); });
        return {
            ...v, _p: p, platformName: PLATFORM_NAME[p],
            views: views, shares: shares,
            url: v.url || makeUrl(v, p),
            thumbnail: v.thumbnail || `https://picsum.photos/seed/${v.id}/400/300`,
            emotion: feat.emotion || v.emotion || pick(EMOTIONS, h),
            tagline: feat.tagline || v.tagline || a.hook || v.title,
            script: feat.script || v.script || defaultScript,
            radar: feat.radar || v.radar || defaultRadar
        };
    }

    /* ---------- 链接解析相关 ---------- */
    function detectPlatform(url) {
        const u = (url || '').toLowerCase();
        if (u.includes('douyin.com') || u.includes('v.douyin')) return 'douyin';
        if (u.includes('kuaishou.com') || u.includes('v.kuaishou')) return 'kuaishou';
        if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili';
        if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return 'xiaohongshu';
        return null;
    }

    function defaultRadarFor(h) {
        const mk = k => Math.min(10, Math.round((6 + ((h * k) % 4)) * 10) / 10);
        return { hook: mk(1), pacing: mk(2), visual: mk(3), audio: mk(4), value: mk(5), retention: mk(6) };
    }

    function buildReport(url, p) {
        const h = hash(url);
        const hookTypes = ['好奇缺口', '冲突前置', '痛点直击', '反差对比', '福利钩子'];
        const hookType = pick(hookTypes, h);
        const hookExcerpt = HOOK_EXCERPTS[hookType];
        const emotion = pick(EMOTIONS.concat(['焦虑缓解', '身份归属', '怀旧情结', '爽感满足']), h * 3);
        const script = [
            { phase: '开头', title: '黄金3秒钩子', desc: hookExcerpt + ' 迅速制造悬念，留住划走的手指' },
            { phase: '中段', title: '价值交付', desc: '用具体案例 + 可操作方法层层递进，边演示边讲解，维持观看时长' },
            { phase: '结尾', title: '行动召唤', desc: '引导点赞收藏 + 评论区互动，并预告下期，提升完播与关注转化' }
        ];
        const comments = [];
        let ch = h;
        while (comments.length < 3) {
            const c = pick(COMMENT_POOL, ch);
            if (!comments.includes(c)) comments.push(c);
            ch = (ch * 7 + 13) >>> 0;
        }
        const reusable = pick(REUSABLE_POOL, h * 5);
        const weaknesses = pick(WEAKNESS_POOL, h * 11);
        return { hookType, hookExcerpt, emotion, script, comments, reusable, weaknesses };
    }

    function buildParsedVideo(url) {
        const p = detectPlatform(url);
        const h = hash(url);
        const idMatch = url.match(/(?:video\/|v=|share\/|note\/|aweme_id=|note_id=)([A-Za-z0-9_-]{6,})|(?:id[=_])?(\d{6,})/);
        const rawId = idMatch ? (idMatch[1] || idMatch[2] || '') : '';
        const id = 'parse_' + (rawId || (h % 1000000));
        const title = pick(PARSE_TITLES[p], h);
        const author = pick(PARSE_AUTHORS[p], h * 2);
        const likesN = 50 + (h % 900);          // 5.0w ~ 95.0w
        const likes = (likesN / 10).toFixed(1) + 'w';
        const views = ((likesN * 3) / 10).toFixed(1) + 'w';
        const shares = Math.max(0.1, (likesN / 50) / 10).toFixed(1) + 'w';
        const comments = (1 + (h % 50)) + 'w';
        const mm = 1 + (h % 4), ss = 10 + (h % 49);
        const dur = '0' + mm + ':' + String(ss).padStart(2, '0');
        const daysAgo = h % 20;
        const d = new Date(); d.setDate(d.getDate() - daysAgo);
        const publishTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const thumbnail = '';   // 离线工具无法获取真实封面，改用平台占位图，避免显示成“其他视频”
        const report = buildReport(url, p);
        const transcript = pick(TRANSCRIPT_POOL, h * 4);
        return {
            id, title, author, likes, views, shares, comments, dur, publishTime,
            url: url, _p: p, _parsed: true, _parseUrl: url,
            thumbnail, emotion: report.emotion, tagline: report.hookExcerpt,
            script: report.script, radar: defaultRadarFor(h),
            report, transcript, parsedAt: Date.now()
        };
    }

    function parseLink() {
        const input = $('#videoLinkInput');
        const url = (input && input.value || '').trim();
        if (!url) { toast('请先粘贴视频分享链接'); return; }
        const p = detectPlatform(url);
        if (!p) { toast('链接解析失败，请检查链接是否有效或换一条视频试试'); return; }

        // 单条视频 30 秒冷却，防止重复点击
        const now = Date.now();
        if (parseCooldown.url === url && now - parseCooldown.ts < 30000) {
            toast('该视频解析过于频繁，请 30 秒后再试');
            return;
        }
        parseCooldown = { url, ts: now };

        const btn = $('#videoParseBtn');
        if (btn) { btn.disabled = true; btn.querySelector('.material-symbols-outlined').textContent = 'hourglass_empty'; }
        isParsing = true;
        currentFeaturedId = '__parsing__';
        currentFeatured = { _parsing: true, url };
        // 解析期间清空搜索，并切换到对应平台标签，保证解析历史能呈现在对应推荐列表
        query = '';
        const si = $('#videoSearch'); if (si) si.value = '';
        const cl = $('#videoSearchClear'); if (cl) cl.style.display = 'none';
        const intervalId = setInterval(() => {
            if (btn) {
                const t = btn.querySelector('.material-symbols-outlined');
                if (t) t.textContent = (t.textContent === 'auto_awesome') ? 'hourglass_empty' : 'auto_awesome';
            }
        }, 700);
        render();
        const feed0 = $('#videoFeed'); if (feed0) feed0.scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            clearInterval(intervalId);
            const v = buildParsedVideo(url);
            parsedHistory = parsedHistory.filter(x => x.url !== url); // 同链接去重
            parsedHistory.unshift(v);
            saveHistory();
            currentFeatured = v;
            currentFeaturedId = v.id;
            isParsing = false;
            if (btn) {
                btn.disabled = false;
                const t = btn.querySelector('.material-symbols-outlined');
                if (t) t.textContent = 'auto_awesome';
            }
            // 解析完成后进入「解析」导航栏，展示自动播放 + 精选爆点拆解
            $$('#videoPlatformTabs .tv-chip').forEach(t => t.classList.toggle('active', t.dataset.platform === 'parse'));
            platform = 'parse';
            render();
            const f2 = $('#videoFeed'); if (f2) f2.scrollIntoView({ behavior: 'smooth', block: 'start' });
            toast('视频解析完成，已生成爆点拆解');
        }, 4200);
    }

    /* ---------- 渲染辅助 ---------- */
    function radarSVG(radar) {
        const center = { x: 60, y: 60 };
        const radius = 46;
        const count = RADAR_LABELS.length;
        const angleOffset = -Math.PI / 2;
        const values = RADAR_LABELS.map(({ key }) => radar[key] || 0);
        const max = 10;
        const points = values.map((val, i) => {
            const angle = angleOffset + (Math.PI * 2 * i) / count;
            const r = (val / max) * radius;
            return `${center.x + r * Math.cos(angle)},${center.y + r * Math.sin(angle)}`;
        }).join(' ');
        const gridPolygons = [0.3, 0.6, 1].map(level => {
            const pts = RADAR_LABELS.map((_, i) => {
                const angle = angleOffset + (Math.PI * 2 * i) / count;
                const r = level * radius;
                return `${center.x + r * Math.cos(angle)},${center.y + r * Math.sin(angle)}`;
            }).join(' ');
            return `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>`;
        }).join('');
        const vertexDots = values.map((val, i) => {
            const angle = angleOffset + (Math.PI * 2 * i) / count;
            const r = (val / max) * radius;
            return `<circle cx="${center.x + r * Math.cos(angle)}" cy="${center.y + r * Math.sin(angle)}" r="2.5" fill="var(--st-primary)"/>`;
        }).join('');
        const labelEls = RADAR_LABELS.map(({ key, label }, i) => {
            const angle = angleOffset + (Math.PI * 2 * i) / count;
            const r = radius + 12;
            const x = center.x + r * Math.cos(angle);
            const y = center.y + r * Math.sin(angle);
            const val = radar[key];
            return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="tv-radar-label">${label} (${val})</text>`;
        }).join('');
        return `
            <svg viewBox="0 0 120 120" class="tv-radar-svg">
                ${gridPolygons}
                <polygon points="${points}" fill="rgba(0,88,188,0.12)" stroke="var(--st-primary)" stroke-width="1.5"/>
                ${vertexDots}
                ${labelEls}
            </svg>`;
    }

    function reportSectionHTML(v) {
        if (!v.report) return '';
        const r = v.report;
        return `
            <div class="tv-report">
                <div class="tv-report-head">
                    <span class="material-symbols-outlined">auto_awesome</span>深度拆解报告 <span class="tv-burst-note">离线示例</span>
                    <button class="tv-copy-btn" data-copy-report="1">复制报告</button>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">① 开场钩子类型</div>
                    <div class="tv-report-value"><span class="tv-hook-tag">${esc(r.hookType)}</span>${esc(r.hookExcerpt)}</div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">② 核心情绪卖点</div>
                    <div class="tv-report-value">${esc(r.emotion)}</div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">③ 脚本结构拆解</div>
                    <div class="tv-report-script">
                        ${r.script.map(s => `
                            <div class="tv-report-script-row">
                                <div class="tv-report-phase">${esc(s.phase)}</div>
                                <div class="tv-report-phase-body"><b>${esc(s.title)}</b><span>${esc(s.desc)}</span></div>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">④ 高频评论关注点 <span class="tv-report-sub">TOP 3</span></div>
                    <div class="tv-report-value">
                        ${r.comments.map((c, i) => `<div class="tv-comment-row"><span class="tv-comment-num">${i + 1}</span>${esc(c)}</div>`).join('')}
                    </div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">⑤ 可复用套路</div>
                    <div class="tv-report-value">${esc(r.reusable)}</div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">⑥ 可优化短板</div>
                    <div class="tv-report-value">${esc(r.weaknesses)}</div>
                </div>
                <div class="tv-report-item">
                    <div class="tv-report-label">口播逐字稿（已转写）</div>
                    <div class="tv-transcript">${esc(v.transcript || '（无字幕，已通过语音转文字生成）')}</div>
                </div>
            </div>`;
    }

    function featuredCard(v, isTop) {
        const badge = isTop
            ? `<div class="tv-rank"><span class="material-symbols-outlined">local_fire_department</span>#1 热门</div>`
            : `<div class="tv-rank tv-rank--playing"><span class="material-symbols-outlined">play_arrow</span>正在播放</div>`;
        const scriptRows = v.script.map((s, i) => `
            <div class="tv-script-item">
                <div class="tv-script-dot ${i === 0 ? 'active' : ''}"></div>
                <div class="tv-script-body">
                    <div class="tv-script-time">${esc(s.time || (s.phase || ''))} | ${esc(s.title)}</div>
                    <div class="tv-script-desc">${esc(s.desc)}</div>
                </div>
            </div>
        `).join('');
        const metaLine = v._parsed
            ? `<span>@${esc(v.author)}</span><span class="dot"></span><span>${v.views} 播放</span><span class="dot"></span><span>${esc(v.publishTime)} 发布</span>`
            : `<span>@${esc(v.author)}</span><span class="dot"></span><span>${v.views} 播放</span>`;
        const thumbBg = v.thumbnail ? `background-image:url('${esc(v.thumbnail)}')` : `background:linear-gradient(135deg,var(--st-primary),#ff9a76)`;
        const thumbPh = v.thumbnail ? '' : `<span class="tv-thumb-ph">${PF_ICON[v._p] || '🎬'}</span>`;
        const thumbHtml = `
            <div class="tv-featured-thumb" style="${thumbBg}">
                ${thumbPh}
                <div class="tv-featured-gradient"></div>
                ${v._parsed ? `<div class="tv-rank tv-rank--parse"><span class="material-symbols-outlined">auto_awesome</span>已解析</div>` : badge}
                <div class="tv-featured-info">
                    <div class="tv-featured-title">${esc(v.title)}${v._parsed ? ' <span class="tv-example-tag">示例</span>' : ''}</div>
                    <div class="tv-featured-meta">${metaLine}</div>
                </div>
                <button class="tv-play-btn" aria-label="播放"><span class="material-symbols-outlined">play_arrow</span></button>
            </div>`;

        let analysisHtml;
        if (v._parsed) {
            analysisHtml = reportSectionHTML(v);
        } else {
            analysisHtml = `
            <div class="tv-deconstruction">
                <div class="tv-decon-head">
                    <h3><span class="material-symbols-outlined">psychology</span>爆点拆解</h3>
                    <button class="tv-copy-btn" data-copy="${v.id}">复制脚本结构</button>
                </div>
                <div class="tv-decon-grid">
                    <div class="tv-radar">${radarSVG(v.radar)}</div>
                    <div class="tv-decon-right">
                        <div class="tv-decon-box">
                            <div class="tv-decon-label">黄金钩子</div>
                            <div class="tv-decon-text">${esc(v.tagline)}</div>
                        </div>
                        <div class="tv-decon-box">
                            <div class="tv-decon-label">情绪触发</div>
                            <div class="tv-decon-text"><span class="tv-emotion-dot"></span>${esc(v.emotion)}</div>
                        </div>
                    </div>
                </div>
                <div class="tv-script">
                    <div class="tv-script-title">脚本流程</div>
                    <div class="tv-script-flow">${scriptRows}</div>
                </div>
            </div>`;
        }
        return `
            <div class="tv-featured ${v._parsed ? 'tv-featured--parsed' : ''}" data-url="${esc(v.url)}">
                ${thumbHtml}
                ${analysisHtml}
            </div>`;
    }

    function pipelineCard(v, selected) {
        const savedFlag = isSaved(v.id);
        const tier = heatTier(v);
        const parsedBadge = v._parsed ? `<div class="tv-parsed-badge">已解析</div>` : '';
        const thumbBg = v.thumbnail ? `background-image:url('${esc(v.thumbnail)}')` : `background:linear-gradient(135deg,var(--st-primary),#ff9a76)`;
        const thumbPh = v.thumbnail ? '' : `<span class="tv-thumb-ph">${PF_ICON[v._p] || '🎬'}</span>`;
        return `
            <div class="tv-pipeline-card ${selected ? 'selected' : ''}" data-id="${v.id}" data-url="${esc(v.url)}">
                <div class="tv-pipeline-thumb" style="${thumbBg}">
                    ${thumbPh}
                    <div class="tv-pipeline-dur">${esc(v.dur)}</div>
                    <div class="tv-heat-badge tv-heat-${tier}">${HEAT_LABEL[tier]}</div>
                    ${parsedBadge}
                </div>
                <div class="tv-pipeline-body">
                    <div class="tv-pipeline-card-title">${esc(v.title)}</div>
                    <div class="tv-pipeline-author">@${esc(v.author)}${v._parsed ? ' · 已解析' : ''}</div>
                    <div class="tv-pipeline-stats">
                        <span><span class="material-symbols-outlined">favorite</span>${v.likes}</span>
                        <span><span class="material-symbols-outlined">share</span>${v.shares}</span>
                        ${v._parsed ? `<span><span class="material-symbols-outlined">chat_bubble</span>${v.comments}</span>` : ''}
                    </div>
                </div>
                <button class="tv-save-btn ${savedFlag ? 'saved' : ''}" data-save="${v.id}" aria-label="收藏">
                    <span class="material-symbols-outlined">${savedFlag ? 'bookmark' : 'bookmark_border'}</span>
                </button>
            </div>`;
    }

    function userCard(u) {
        const url = (PLATFORM_SEARCH[platform] || '') + encodeURIComponent(u.handle);
        return `
            <div class="tv-user-card" data-url="${esc(url)}">
                <div class="tv-user-avatar">${esc(u.avatar)}</div>
                <div class="tv-user-main">
                    <div class="tv-user-name">${esc(u.name)} <span class="tv-user-handle">${esc(u.handle)}</span></div>
                    <div class="tv-user-bio">${esc(u.bio)}</div>
                    <div class="tv-user-tags">${(u.tags || []).map(t => `<span class="tv-user-tag">${esc(t)}</span>`).join('')}</div>
                </div>
                <div class="tv-user-followers">
                    <div class="tv-user-follow-num">${esc(u.followers)}</div>
                    <div class="tv-user-follow-label">粉丝</div>
                </div>
            </div>`;
    }

    function bindFeed(feed) {
        // 播放区点击 → 跳转观看
        const feat = $('#tvFeatured', feed);
        if (feat) feat.addEventListener('click', e => {
            if (e.target.closest('[data-copy]') || e.target.closest('[data-copy-report]')) return;
            const url = feat.dataset.url;
            if (url && url !== '#') window.open(url, '_blank');
        });

        // 热门条目点击 → 加载到播放区并同步更新爆点拆解/脚本流程
        $$('.tv-pipeline-card', feed).forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('[data-save]')) return;
                selectVideo(card.dataset.id);
            });
        });

        // 换一批
        const rb = $('#videoRefreshBtn', feed);
        if (rb) rb.addEventListener('click', e => { e.stopPropagation(); refreshBatch(); });

        // 收藏
        $$('[data-save]', feed).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = btn.dataset.save;
            if (isSaved(id)) { saved = saved.filter(x => x !== id); toast('已取消收藏'); }
            else { saved.unshift(id); toast('已收藏'); }
            window.Store.set('savedVideos', saved);
            render();
        }));

        // 复制脚本结构
        $$('[data-copy]', feed).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            if (!currentFeatured) return;
            const v = currentFeatured;
            const text = `${v.title}\n黄金钩子：${v.tagline}\n脚本流程：\n${v.script.map(s => `${s.time} | ${s.title}：${s.desc}`).join('\n')}`;
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('脚本结构已复制')).catch(() => toast('复制失败'));
            else toast('当前环境不支持复制');
        }));

        // 复制深度拆解报告
        $$('[data-copy-report]', feed).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            if (!currentFeatured || !currentFeatured.report) return;
            const v = currentFeatured, r = v.report;
            const text = `【深度拆解报告】\n标题：${v.title}\n① 开场钩子类型：${r.hookType} — ${r.hookExcerpt}\n② 核心情绪卖点：${r.emotion}\n③ 脚本结构：\n${r.script.map(s => '· ' + s.phase + '｜' + s.title + '：' + s.desc).join('\n')}\n④ 高频评论关注点(TOP3)：\n${r.comments.map((c, i) => (i + 1) + '. ' + c).join('\n')}\n⑤ 可复用套路：${r.reusable}\n⑥ 可优化短板：${r.weaknesses}`;
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('报告已复制')).catch(() => toast('复制失败'));
            else toast('当前环境不支持复制');
        }));
    }

    function bindSearch(feed) {
        $$('.tv-pipeline-card', feed).forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('[data-save]')) return;
                selectVideo(card.dataset.id);
            });
        });
        $$('.tv-user-card', feed).forEach(card => card.addEventListener('click', () => {
            const url = card.dataset.url;
            if (url) window.open(url, '_blank');
        }));
        $$('[data-save]', feed).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = btn.dataset.save;
            if (isSaved(id)) { saved = saved.filter(x => x !== id); toast('已取消收藏'); }
            else { saved.unshift(id); toast('已收藏'); }
            window.Store.set('savedVideos', saved);
            render();
        }));
    }

    function renderSearch(feed) {
        const q = query.toLowerCase();
        const videos = (DATA.VIDEOS[platform] || []).map(v => enrich(v, platform))
            .filter(v => (v.title + ' ' + v.author).toLowerCase().includes(q));
        const users = (USERS[platform] || []).filter(u =>
            (u.name + ' ' + u.handle + ' ' + u.bio + ' ' + (u.tags || []).join(' ')).toLowerCase().includes(q));
        currentFeaturedId = null;
        currentFeatured = null;
        feed.innerHTML = `
            <div class="tv-search-results">
                <div class="tv-result-zone">
                    <h2 class="tv-section-title">匹配视频 <span class="tv-count">${videos.length}</span></h2>
                    ${videos.length ? videos.map(v => pipelineCard(v, false)).join('') : `<div class="empty-state"><p>没有匹配的视频</p><span>换个关键词试试</span></div>`}
                </div>
                <div class="tv-result-zone">
                    <h2 class="tv-section-title">匹配创作者 <span class="tv-count">${users.length}</span></h2>
                    ${users.length ? users.map(userCard).join('') : `<div class="empty-state"><p>没有匹配的创作者</p><span>试试作者名或账号</span></div>`}
                </div>
            </div>`;
        bindSearch(feed);
    }

    function renderFeed(feed) {
        // 解析中：播放区展示加载动画
        if (currentFeatured && currentFeatured._parsing) {
            feed.innerHTML = `
                <div class="tv-parsing">
                    <div class="tv-spinner"></div>
                    <p class="tv-parsing-title">正在解析视频…</p>
                    <span class="tv-parsing-sub">识别平台 · 提取字幕/语音转写 · 抓取热门评论 · AI 拆解爆点（约 5–15 秒）</span>
                </div>`;
            return;
        }

        let base;
        if (refreshOverride) base = refreshOverride.slice();
        else base = orderList(getList());
        if (!base.length) {
            const msg = platform === 'saved' ? '还没有收藏的视频' : '暂无热点数据';
            feed.innerHTML = `<div class="empty-state"><div class="empty-icon">🔥</div><p>${msg}</p><span>${platform === 'saved' ? '在视频卡片上点书签收藏' : '稍后再来看看'}</span></div>`;
            return;
        }
        let featuredItem, rest;
        if (currentFeaturedId) {
            const idx = base.findIndex(v => v.id === currentFeaturedId);
            if (idx >= 0) { featuredItem = base[idx]; rest = base.filter((_, i) => i !== idx); }
            else { currentFeaturedId = null; featuredItem = base[0]; rest = base.slice(1); }
        } else {
            featuredItem = base[0];
            rest = base.slice(1);
        }
        // 解析视频（不在常规列表内）置为播放区
        if (currentFeatured && currentFeatured._parsed && currentFeatured.id === currentFeaturedId) {
            featuredItem = currentFeatured;
            rest = rest.filter(v => v.id !== currentFeatured.id);
        }
        currentFeatured = featuredItem;
        const isRank1 = currentFeaturedId == null;
        const sectionTitle = platform === 'saved' ? '我的收藏' : '热门推荐';
        const refreshBtn = (platform !== 'saved')
            ? `<button class="tv-refresh-btn" id="videoRefreshBtn"><span class="material-symbols-outlined">autorenew</span>换一批</button>`
            : '';
        // 解析历史置顶「热门推荐」（当前平台），标注「已解析」
        const parsedTop = parsedHistory.filter(p => p._p === platform && p.id !== (currentFeatured && currentFeatured.id));
        rest = parsedTop.concat(rest);
        feed.innerHTML = `
            <div id="tvFeatured">${featuredCard(featuredItem, isRank1)}</div>
            <div class="tv-pipeline">
                <div class="tv-pipeline-head">
                    <h2 class="tv-section-title">${sectionTitle}</h2>
                    ${refreshBtn}
                </div>
                ${rest.length ? rest.map(v => pipelineCard(v, v.id === currentFeaturedId)).join('') : `<div class="empty-state"><p>没有更多视频了</p></div>`}
            </div>`;
        bindFeed(feed);
    }

    /* ---------- 解析导航栏 ---------- */
    function parsePlayerHTML(v) {
        const meta = v._parsed
            ? `@${esc(v.author)} · ${v.views} 播放 · ${esc(v.publishTime)} 发布`
            : `@${esc(v.author)} · ${v.views} 播放`;
        const linkShort = v.url.length > 60 ? v.url.slice(0, 58) + '…' : v.url;
        const posterBg = v.thumbnail ? `background-image:url('${esc(v.thumbnail)}')` : `background:linear-gradient(135deg,var(--st-primary),#ff9a76)`;
        const posterPh = v.thumbnail ? '' : `<span class="tv-thumb-ph tv-thumb-ph--big">${PF_ICON[v._p] || '🎬'}</span>`;
        return `
            <div class="tv-player" data-url="${esc(v.url)}">
                ${v._parsed ? `<div class="tv-rank tv-rank--parse"><span class="material-symbols-outlined">auto_awesome</span>已解析</div>` : ''}
                <div class="tv-player-poster" style="${posterBg}">
                    ${posterPh}
                    <div class="tv-player-overlay">
                        <div class="tv-player-badge"><span class="tv-eq"><i></i><i></i><i></i><i></i></span>自动播放中</div>
                    </div>
                    <div class="tv-player-info">
                        <div class="tv-player-title">${esc(v.title)} <span class="tv-example-tag">示例</span></div>
                        <div class="tv-player-meta">${meta}</div>
                        <div class="tv-player-source">解析链接：${esc(linkShort)}</div>
                    </div>
                    <div class="tv-player-progress"><span></span></div>
                </div>
            </div>`;
    }

    function curatedBurstHTML(v) {
        const r = v.report;
        if (!r) return '';
        const scriptPicks = (v.script || []).slice(0, 3).map((s, i) => `
            <div class="tv-burst-beat">
                <span class="tv-burst-num">${i + 1}</span>
                <div class="tv-burst-beat-body"><b>${esc(s.title)}</b><span>${esc(s.desc)}</span></div>
            </div>`).join('');
        const commentPicks = (r.comments || []).map((c, i) => `
            <div class="tv-comment-row"><span class="tv-comment-num">${i + 1}</span>${esc(c)}</div>`).join('');
        return `
            <div class="tv-burst">
                <div class="tv-burst-head">
                    <h3><span class="material-symbols-outlined">auto_awesome</span>精选爆点拆解</h3>
                    <span class="tv-burst-note">离线示例</span>
                    <button class="tv-copy-btn" data-copy-report="1">复制报告</button>
                </div>
                <div class="tv-burst-grid">
                    <div class="tv-burst-card tv-burst-hook">
                        <div class="tv-burst-label">① 黄金钩子</div>
                        <div class="tv-burst-value"><span class="tv-hook-tag">${esc(r.hookType)}</span>${esc(r.hookExcerpt)}</div>
                    </div>
                    <div class="tv-burst-card">
                        <div class="tv-burst-label">② 情绪引爆点</div>
                        <div class="tv-burst-value"><span class="tv-emotion-dot"></span>${esc(r.emotion)}</div>
                    </div>
                    <div class="tv-burst-card tv-burst-reuse">
                        <div class="tv-burst-label">③ 可复用爆款套路</div>
                        <div class="tv-burst-value">${esc(r.reusable)}</div>
                    </div>
                </div>
                <div class="tv-burst-comments">
                    <div class="tv-burst-label">④ 高光评论 TOP ${r.comments ? r.comments.length : 0}</div>
                    ${commentPicks || '<div class="tv-burst-value">暂无评论数据</div>'}
                </div>
                <div class="tv-burst-script">
                    <div class="tv-burst-label">⑤ 关键脚本节点</div>
                    <div class="tv-burst-beats">${scriptPicks}</div>
                </div>
            </div>`;
    }

    function parseRecordHTML(v) {
        const pName = PLATFORM_NAME[v._p] || '未知平台';
        const when = v.parsedAt ? new Date(v.parsedAt) : null;
        const timeStr = when ? `${when.getMonth() + 1}月${when.getDate()}日 ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}` : '';
        const linkShort = v.url.length > 42 ? v.url.slice(0, 40) + '…' : v.url;
        const thumbBg = v.thumbnail ? `background-image:url('${esc(v.thumbnail)}')` : `background:linear-gradient(135deg,var(--st-primary),#ff9a76)`;
        const thumbPh = v.thumbnail ? '' : `<span class="tv-thumb-ph">${PF_ICON[v._p] || '🎬'}</span>`;
        return `
            <div class="tv-parse-record" data-url="${esc(v.url)}">
                <div class="tv-parse-record-thumb" style="${thumbBg}">${thumbPh}</div>
                <div class="tv-parse-record-body">
                    <div class="tv-parse-record-title">${esc(v.title)} <span class="tv-example-tag">示例</span></div>
                    <div class="tv-parse-record-meta">
                        <span class="tv-parse-record-pf">${esc(pName)}</span>
                        <span class="dot"></span>
                        <span>@${esc(v.author)}</span>
                        ${timeStr ? `<span class="dot"></span><span>${timeStr}</span>` : ''}
                    </div>
                    <div class="tv-parse-record-url">${esc(linkShort)}</div>
                </div>
                <div class="tv-parse-record-right">
                    <span class="material-symbols-outlined tv-parse-record-arrow">chevron_right</span>
                    <button class="tv-parse-record-del" data-del-url="${esc(v.url)}" aria-label="删除该记录"><span class="material-symbols-outlined">delete_outline</span></button>
                </div>
            </div>`;
    }

    function deleteParseRecord(url) {
        parsedHistory = parsedHistory.filter(x => x.url !== url);
        saveHistory();
        if (currentFeatured && currentFeatured._parsed && currentFeatured.url === url) {
            currentFeatured = null;
            currentFeaturedId = null;
        }
        render();
        toast('已删除该解析记录');
    }

    function clearParseHistory() {
        if (!parsedHistory.length) return;
        parsedHistory = [];
        saveHistory();
        currentFeatured = null;
        currentFeaturedId = null;
        render();
        toast('已清空全部解析记录');
    }

    function openParsedRecord(url) {
        const rec = parsedHistory.find(x => x.url === url);
        if (!rec) { toast('记录已失效，请重新解析'); return; }
        currentFeatured = rec;
        currentFeaturedId = rec.id;
        render();
        const el = document.getElementById('tvFeatured');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderParseTab(feed) {
        // 解析中
        if (currentFeatured && currentFeatured._parsing) {
            feed.innerHTML = `
                <div class="tv-parsing">
                    <div class="tv-spinner"></div>
                    <p class="tv-parsing-title">正在解析视频…</p>
                    <span class="tv-parsing-sub">识别平台 · 提取字幕/语音转写 · 抓取热门评论 · AI 拆解爆点（约 5–15 秒）</span>
                </div>`;
            return;
        }
        // 已打开某条解析结果：自动播放 + 精选爆点拆解
        if (currentFeatured && currentFeatured._parsed) {
            feed.innerHTML = `
                <button class="tv-back-btn" id="parseBackBtn"><span class="material-symbols-outlined">arrow_back</span>返回解析记录</button>
                ${parsePlayerHTML(currentFeatured)}
                ${curatedBurstHTML(currentFeatured)}`;
            const back = $('#parseBackBtn', feed);
            if (back) back.addEventListener('click', () => { currentFeatured = null; currentFeaturedId = null; render(); });
            const player = $('.tv-player', feed);
            if (player) player.addEventListener('click', () => {
                const u = player.dataset.url;
                if (u && u !== '#') window.open(u, '_blank');
            });
            const copyBtn = $('[data-copy-report]', feed);
            if (copyBtn) copyBtn.addEventListener('click', e => {
                e.stopPropagation();
                const v = currentFeatured, r = v.report;
                const text = `【深度拆解报告】\n标题：${v.title}\n① 开场钩子类型：${r.hookType} — ${r.hookExcerpt}\n② 核心情绪卖点：${r.emotion}\n③ 脚本结构：\n${r.script.map(s => '· ' + s.phase + '｜' + s.title + '：' + s.desc).join('\n')}\n④ 高频评论关注点(TOP3)：\n${r.comments.map((c, i) => (i + 1) + '. ' + c).join('\n')}\n⑤ 可复用套路：${r.reusable}\n⑥ 可优化短板：${r.weaknesses}`;
                if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('报告已复制')).catch(() => toast('复制失败'));
                else toast('当前环境不支持复制');
            });
            return;
        }
        // 默认：解析输入 + 解析记录
        const hist = parsedHistory.slice(0, 30);
        feed.innerHTML = `
            <div class="tv-parse-panel">
                <div class="tv-link-parse">
                    <span class="material-symbols-outlined">link</span>
                    <input type="text" id="videoLinkInput" placeholder="粘贴短视频分享链接，一键拆解爆点" maxlength="400" autocomplete="off">
                    <button class="tv-parse-btn" id="videoParseBtn"><span class="material-symbols-outlined">auto_awesome</span>解析</button>
                </div>
                <p class="tv-parse-hint">支持 抖音 / 快手 / B站 / 小红书 分享链接，自动识别平台并生成爆点拆解</p>
                <h2 class="tv-section-title">解析记录 <span class="tv-count">${hist.length}</span>${hist.length ? `<button class="tv-clear-btn" id="parseClearBtn"><span class="material-symbols-outlined">delete_sweep</span>清空</button>` : ''}</h2>
                ${hist.length
                    ? `<div class="tv-parse-history">${hist.map(parseRecordHTML).join('')}</div>`
                    : `<div class="empty-state"><div class="empty-icon">📭</div><p>还没有解析记录</p><span>粘贴一条链接开始拆解吧</span></div>`}
            </div>`;
        const linkInput = $('#videoLinkInput', feed);
        const parseBtn = $('#videoParseBtn', feed);
        if (parseBtn) parseBtn.addEventListener('click', parseLink);
        if (linkInput) linkInput.addEventListener('keydown', e => { if (e.key === 'Enter') parseLink(); });
        $$('.tv-parse-record', feed).forEach(card => card.addEventListener('click', e => {
            if (e.target.closest('.tv-parse-record-del')) return;
            openParsedRecord(card.dataset.url);
        }));
        $$('.tv-parse-record-del', feed).forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteParseRecord(btn.dataset.delUrl);
        }));
        const clearBtn = $('#parseClearBtn', feed);
        if (clearBtn) clearBtn.addEventListener('click', clearParseHistory);
    }

    function render() {
        const feed = $('#videoFeed');
        if (platform === 'parse') { renderParseTab(feed); return; }
        if (query && platform !== 'saved') { renderSearch(feed); return; }
        renderFeed(feed);
    }

    function selectVideo(id) {
        currentFeaturedId = id;
        currentFeatured = null;
        shuffleSeed = null;
        refreshOverride = null;
        query = '';
        const si = $('#videoSearch');
        if (si) si.value = '';
        const cl = $('#videoSearchClear');
        if (cl) { /* noop */ }
        if ($('#videoSearchClear')) $('#videoSearchClear').style.display = 'none';
        render();
        const el = document.getElementById('tvFeatured');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function refreshBatch() {
        shuffleSeed = Math.floor(Math.random() * 1e9);
        currentFeaturedId = null;
        currentFeatured = null;
        const pool = (DATA.VIDEOS[platform] || []).map(v => enrich(v, platform));
        let cand = pool.filter(v => !shownIds.has(v.id));
        if (cand.length < 6) { shownIds = new Set(); cand = pool.slice(); }
        const byTier = { 1: [], 2: [], 3: [] };
        cand.forEach(v => byTier[heatTier(v)].push(v));
        const tiers = [1, 2, 3].sort(() => Math.random() - 0.5);
        tiers.forEach(t => { byTier[t] = seededShuffle(byTier[t], shuffleSeed + t); });
        const maxLen = Math.max(byTier[1].length, byTier[2].length, byTier[3].length);
        const ordered = [];
        for (let i = 0; i < maxLen; i++) tiers.forEach(t => { if (byTier[t][i]) ordered.push(byTier[t][i]); });
        ordered.forEach(v => shownIds.add(v.id));
        refreshOverride = ordered;
        render();
        toast('已为你换一批新热门');
    }

    function switchPlatform(p) {
        platform = p;
        currentFeaturedId = null;
        currentFeatured = null;
        shuffleSeed = null;
        refreshOverride = null;
        shownIds = new Set();
        query = '';
        const si = $('#videoSearch');
        if (si) si.value = '';
        const cl = $('#videoSearchClear');
        if (cl) cl.style.display = 'none';
        render();
    }

    function init() {
        $$('#videoPlatformTabs .tv-chip').forEach(tab => tab.addEventListener('click', () => {
            $$('#videoPlatformTabs .tv-chip').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            switchPlatform(tab.dataset.platform);
        }));

        $('#videoFilterBtn').addEventListener('click', () => toast('筛选功能开发中'));

        const searchInput = $('#videoSearch');
        const clearBtn = $('#videoSearchClear');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                query = searchInput.value.trim();
                if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';
                currentFeaturedId = null;
                currentFeatured = null;
                render();
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                query = '';
                searchInput.value = '';
                clearBtn.style.display = 'none';
                currentFeaturedId = null;
                currentFeatured = null;
                render();
            });
        }

        // 链接解析入口
        const linkInput = $('#videoLinkInput');
        const parseBtn = $('#videoParseBtn');
        if (parseBtn) parseBtn.addEventListener('click', parseLink);
        if (linkInput) {
            linkInput.addEventListener('keydown', e => { if (e.key === 'Enter') parseLink(); });
        }

        loadHistory();
        render();
    }

    window.VideoModule = { init };
})();
