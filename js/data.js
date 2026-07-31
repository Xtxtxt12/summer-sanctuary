/* ============================================================
   夏天 · 数据层  (DATA)
   ============================================================ */
window.DATA = (function () {

    /* ---------- 每日单词 · 日常基础对话 ---------- */
    const DAILY_WORDS = (typeof window !== 'undefined' && window.BASIC_WORDS_FULL) || [
        {w:'Hello',p:'/həˈloʊ/',m:'你好',e:'Hello, nice to meet you.',t:['问候']},
        {w:'Thanks',p:'/θæŋks/',m:'谢谢',e:'Thanks for your help!',t:['感谢']},
        {w:'Please',p:'/pliːz/',m:'请',e:'Please sit down.',t:['礼貌']},
        {w:'Sorry',p:'/ˈsɒri/',m:'对不起',e:'Sorry, I am late.',t:['道歉']},
        {w:'Good morning',p:'/ɡʊd ˈmɔːrnɪŋ/',m:'早上好',e:'Good morning, everyone.',t:['问候']},
        {w:'Good night',p:'/ɡʊd naɪt/',m:'晚安',e:'Good night, sleep well.',t:['问候']},
        {w:'How are you',p:'/haʊ ɑːr juː/',m:'你好吗',e:'How are you today?',t:['问候']},
        {w:'What\'s your name',p:'/wɒts jɔːr neɪm/',m:'你叫什么名字',e:'What\'s your name?',t:['介绍']},
        {w:'Where is',p:'/wer ɪz/',m:'……在哪里',e:'Where is the station?',t:['问路']},
        {w:'How much',p:'/haʊ mʌtʃ/',m:'多少钱',e:'How much is this?',t:['购物']},
        {w:'Can you help me',p:'/kæn juː help miː/',m:'你能帮我吗',e:'Can you help me, please?',t:['求助']},
        {w:'I don\'t understand',p:'/aɪ doʊnt ˌʌndərˈstænd/',m:'我不明白',e:'Sorry, I don\'t understand.',t:['沟通']},
        {w:'Excuse me',p:'/ɪkˈskjuːz miː/',m:'打扰一下',e:'Excuse me, is this seat taken?',t:['礼貌']},
        {w:'See you',p:'/siː juː/',m:'再见',e:'See you tomorrow!',t:['告别']},
        {w:'I like',p:'/aɪ laɪk/',m:'我喜欢',e:'I like this song.',t:['表达']},
        {w:'I want',p:'/aɪ wɑːnt/',m:'我想要',e:'I want a cup of coffee.',t:['表达']},
        {w:'What time',p:'/wʌt taɪm/',m:'几点',e:'What time is it now?',t:['时间']},
        {w:'Today',p:'/təˈdeɪ/',m:'今天',e:'Today is a good day.',t:['时间']},
        {w:'Tomorrow',p:'/təˈmɒroʊ/',m:'明天',e:'See you tomorrow.',t:['时间']},
        {w:'Food',p:'/fuːd/',m:'食物',e:'The food here is great.',t:['生活']},
        {w:'Water',p:'/ˈwɔːtər/',m:'水',e:'Can I have some water?',t:['生活']},
        {w:'Happy',p:'/ˈhæpi/',m:'开心的',e:'I am so happy today.',t:['情绪']},
        {w:'Tired',p:'/ˈtaɪərd/',m:'累的',e:'I feel a little tired.',t:['情绪']},
        {w:'Friend',p:'/frend/',m:'朋友',e:'She is my best friend.',t:['人际']},
        {w:'Family',p:'/ˈfæmɪli/',m:'家人',e:'I love my family.',t:['人际']},
        {w:'Work',p:'/wɜːrk/',m:'工作',e:'I go to work by bike.',t:['生活']},
        {w:'Study',p:'/ˈstʌdi/',m:'学习',e:'Study makes me happy.',t:['生活']},
        {w:'Weather',p:'/ˈweðər/',m:'天气',e:'The weather is nice today.',t:['生活']},
        {w:'Buy',p:'/baɪ/',m:'买',e:'I want to buy a book.',t:['购物']},
        {w:'Open',p:'/ˈoʊpən/',m:'打开',e:'Please open the window.',t:['动作']},
        {w:'Big',p:'/bɪɡ/',m:'大的',e:'This is a big apple.',t:['描述']},
        {w:'Small',p:'/smɔːl/',m:'小的',e:'I have a small cat.',t:['描述']},
        {w:'Hot',p:'/hɒt/',m:'热的',e:'The soup is very hot.',t:['描述']},
        {w:'Cold',p:'/koʊld/',m:'冷的',e:'It is cold outside.',t:['描述']},
        {w:'Good',p:'/ɡʊd/',m:'好的',e:'That is a good idea.',t:['描述']}
    ];

    /* ---------- 每日单词 · 大学四级词汇 ---------- */
    // 完整四级词库（6100 词）由 js/cet4_words.js 提供
    const CET4_WORDS = (typeof window !== 'undefined' && window.CET4_WORDS_FULL) || [
        {w:'Abandon',p:'/əˈbændən/',m:'v. 抛弃，放弃',e:'He abandoned his car in the snow.',t:['动词']},
        {w:'Absolute',p:'/ˈæbsəluːt/',m:'adj. 绝对的，完全的',e:'There is no absolute truth.',t:['形容词']},
        {w:'Academic',p:'/ˌækəˈdemɪk/',m:'adj. 学术的',e:'She has strong academic ability.',t:['形容词']},
        {w:'Accelerate',p:'/əkˈseləreɪt/',m:'v. 加速，加快',e:'The car accelerated quickly.',t:['动词']},
        {w:'Accomplish',p:'/əˈkʌmplɪʃ/',m:'v. 完成，实现',e:'We accomplished our goal.',t:['动词']},
        {w:'Accurate',p:'/ˈækjərət/',m:'adj. 准确的，精确的',e:'The data must be accurate.',t:['形容词']},
        {w:'Achieve',p:'/əˈtʃiːv/',m:'v. 达到，实现',e:'Hard work helps you achieve success.',t:['动词']},
        {w:'Acquire',p:'/əˈkwaɪər/',m:'v. 获得，习得',e:'Children acquire language fast.',t:['动词']},
        {w:'Adequate',p:'/ˈædɪkwət/',m:'adj. 足够的，适当的',e:'We have adequate food.',t:['形容词']},
        {w:'Adjust',p:'/əˈdʒʌst/',m:'v. 调整，适应',e:'It takes time to adjust to a new job.',t:['动词']},
        {w:'Admire',p:'/ədˈmaɪər/',m:'v. 钦佩，欣赏',e:'I admire her courage.',t:['动词']},
        {w:'Adopt',p:'/əˈdɒpt/',m:'v. 采用，收养',e:'They adopted a new method.',t:['动词']},
        {w:'Advance',p:'/ədˈvɑːns/',m:'v./n. 前进，进展',e:'Science continues to advance.',t:['动词']},
        {w:'Adverse',p:'/ˈædvɜːrs/',m:'adj. 不利的，相反的',e:'Adverse weather delayed the trip.',t:['形容词']},
        {w:'Advocate',p:'/ˈædvəkeɪt/',m:'v. 提倡 n. 拥护者',e:'He advocates healthy eating.',t:['动词']},
        {w:'Aggressive',p:'/əˈɡresɪv/',m:'adj. 好斗的，进取的',e:'An aggressive marketing plan.',t:['形容词']},
        {w:'Allocate',p:'/ˈæləkeɪt/',m:'v. 分配，拨出',e:'We allocated funds to the project.',t:['动词']},
        {w:'Ambiguous',p:'/æmˈbɪɡjuəs/',m:'adj. 模糊的，含糊的',e:'His answer was ambiguous.',t:['形容词']},
        {w:'Amplify',p:'/ˈæmplɪfaɪ/',m:'v. 放大，增强',e:'The speech amplified public concern.',t:['动词']},
        {w:'Analysis',p:'/əˈnæləsɪs/',m:'n. 分析，解析',e:'A careful analysis is needed.',t:['名词']},
        {w:'Ancient',p:'/ˈeɪnʃənt/',m:'adj. 古代的，古老的',e:'Ancient buildings attract tourists.',t:['形容词']},
        {w:'Announce',p:'/əˈnaʊns/',m:'v. 宣布，宣告',e:'They announced the winner.',t:['动词']},
        {w:'Anonymous',p:'/əˈnɒnɪməs/',m:'adj. 匿名的',e:'He sent an anonymous letter.',t:['形容词']},
        {w:'Appreciate',p:'/əˈpriːʃieɪt/',m:'v. 欣赏，感激',e:'I appreciate your help.',t:['动词']},
        {w:'Approximate',p:'/əˈprɒksɪmət/',m:'adj. 近似的 v. 接近',e:'The cost is approximate.',t:['形容词']},
        {w:'Arbitrary',p:'/ˈɑːrbɪtreri/',m:'adj. 任意的，武断的',e:'An arbitrary decision.',t:['形容词']},
        {w:'Argue',p:'/ˈɑːrɡjuː/',m:'v. 争论，主张',e:'They argue about the plan.',t:['动词']},
        {w:'Arise',p:'/əˈraɪz/',m:'v. 出现，升起',e:'Problems may arise anytime.',t:['动词']},
        {w:'Aspect',p:'/ˈæspekt/',m:'n. 方面，外观',e:'We should consider every aspect.',t:['名词']},
        {w:'Assert',p:'/əˈsɜːrt/',m:'v. 断言，坚持',e:'She asserted her opinion.',t:['动词']},
        {w:'Assess',p:'/əˈses/',m:'v. 评估，评定',e:'We assessed the risk.',t:['动词']},
        {w:'Assign',p:'/əˈsaɪn/',m:'v. 分配，指派',e:'The teacher assigned homework.',t:['动词']},
        {w:'Assume',p:'/əˈsuːm/',m:'v. 假定，承担',e:'Let us assume it is true.',t:['动词']},
        {w:'Attribute',p:'/əˈtrɪbjuːt/',m:'v. 归因于 n. 属性',e:'He attributed his success to luck.',t:['动词']},
        {w:'Authority',p:'/ɔːˈθɔːrəti/',m:'n. 权威，当局',e:'The authority approved the plan.',t:['名词']},
        {w:'Automatic',p:'/ˌɔːtəˈmætɪk/',m:'adj. 自动的',e:'The door is automatic.',t:['形容词']},
        {w:'Available',p:'/əˈveɪləbl/',m:'adj. 可获得的，有空的',e:'Tickets are available now.',t:['形容词']},
        {w:'Aware',p:'/əˈwer/',m:'adj. 意识到的',e:'Are you aware of the danger?',t:['形容词']},
        {w:'Benefit',p:'/ˈbenɪfɪt/',m:'n. 利益 v. 受益',e:'Exercise benefits your health.',t:['名词']},
        {w:'Capable',p:'/ˈkeɪpəbl/',m:'adj. 有能力的',e:'She is capable of the task.',t:['形容词']},
        {w:'Consequence',p:'/ˈkɒnsɪkwens/',m:'n. 结果，后果',e:'Face the consequence bravely.',t:['名词']},
        {w:'Consistent',p:'/kənˈsɪstənt/',m:'adj. 一致的，持续的',e:'Be consistent with your effort.',t:['形容词']},
        {w:'Demonstrate',p:'/ˈdemənstreɪt/',m:'v. 证明，演示',e:'He demonstrated the method.',t:['动词']},
        {w:'Efficient',p:'/ɪˈfɪʃnt/',m:'adj. 高效的',e:'An efficient working style.',t:['形容词']},
        {w:'Enhance',p:'/ɪnˈhæns/',m:'v. 提高，增强',e:'Music enhances the mood.',t:['动词']},
        {w:'Fundamental',p:'/ˌfʌndəˈmentl/',m:'adj. 基本的，根本的',e:'These are fundamental rules.',t:['形容词']},
        {w:'Guarantee',p:'/ˌɡærənˈtiː/',m:'v./n. 保证，担保',e:'We guarantee the quality.',t:['动词']},
        {w:'Illustrate',p:'/ˈɪləstreɪt/',m:'v. 说明，图解',e:'The chart illustrates the trend.',t:['动词']},
        {w:'Negotiate',p:'/nɪˈɡoʊʃieɪt/',m:'v. 谈判，协商',e:'They negotiated a deal.',t:['动词']},
        {w:'Obvious',p:'/ˈɒbviəs/',m:'adj. 明显的',e:'The answer is obvious.',t:['形容词']},
        {w:'Potential',p:'/pəˈtenʃl/',m:'adj. 潜在的 n. 潜力',e:'She has great potential.',t:['形容词']},
        {w:'Prioritize',p:'/praɪˈɔːrətaɪz/',m:'v. 优先处理',e:'We should prioritize tasks.',t:['动词']},
        {w:'Recognize',p:'/ˈrekəɡnaɪz/',m:'v. 认出，承认',e:'I recognize your voice.',t:['动词']},
        {w:'Sufficient',p:'/səˈfɪʃnt/',m:'adj. 足够的',e:'We have sufficient evidence.',t:['形容词']}
    ];

    /* ---------- 灵感扭蛋机 · 创作类 ---------- */
    const INSPIRE = {
        prompt:[
            '用"如果世界上只剩最后一条未读消息"为开头，写一段 30 秒短视频脚本。',
            '拍一个"反向测评"视频：拼命吐槽一个你其实很爱的东西。',
            '以第一人称视角拍"我的一天"，但你是你家里的一只猫。',
            '用一个物品的视角讲述它被遗弃的故事，时长 60 秒。',
            '写一段"如果你的人生是一部电影，现在到了第几幕"的独白。',
            '用 ASMR 的方式重新讲述你最喜欢的一部电影的剧情。',
            '设计一个"5 天学会一项技能"的挑战系列，每天记录一个突破瞬间。',
            '做一个"100 个陌生人的故事"系列，每期采访一个路人。',
            '拍摄"同一地点的四季变化"，用 4 个 15 秒视频拼接成 1 分钟。',
            '写一个关于"时间旅行的副作用"的短故事，改编成竖屏短剧。',
            '用"一个被退回的快递"为线索，写一封不会寄出的信，拍成念白视频。',
            '把"减肥失败"做成一部励志喜剧，结尾反转：你赢了心态。'
        ],
        story:[
            '凌晨三点，手机弹出一条来自"自己"的消息："别上那趟地铁。"',
            '她搬家时在墙缝里发现了一封写给自己的信，日期是十年后。',
            '"你确定要删除这个记忆吗？"系统再次确认。我犹豫了。',
            '他每天在同一家咖啡馆点同一杯咖啡，直到第 366 天，店员说："今天免费，因为你每天都来。"',
            '镜子里的我比我慢了 0.5 秒，今天，它比我快了。',
            '世界上最后一个会做梦的人醒来后发现，枕头边多了一张纸条。',
            '退休的邮递员收到一封信，收件人是三十年前的自己。',
            '"恭喜你，你是第 10000 位乘客。"电梯里的声音说。然后灯灭了。',
            '她发现手机相册里多了一张照片，拍摄者显示为"未来的你"。',
            '世界突然静音了，但只有他能听到一个声音在倒数。',
            '深夜的便利店，收银员递来一张纸条："你已连续加班 30 天，今晚关东煮免费。"',
            '一只流浪猫每天准时出现在她窗台，直到某天它叼来一张泛黄的旧照片。'
        ],
        keyword:[
            '关键词：雨天 · 旧书店 · 一封未寄出的信',
            '关键词：深夜厨房 · 剩饭 · 一个秘密',
            '关键词：电梯 · 陌生人 · 相同的目的地',
            '关键词：搬家 · 旧照片 · 突然响起的电话',
            '关键词：海边 · 孤独 · 一个捡到的瓶子',
            '关键词：凌晨 · 便利店 · 最后一个饭团',
            '关键词：童年 · 老房子 · 一把生锈的钥匙',
            '关键词：火车站 · 错过 · 下一次相遇',
            '关键词：镜子 · 平行世界 · 一个不同的选择',
            '关键词：落叶 · 咖啡 · 没说出口的告白',
            '关键词：旧手机 · 语音备忘录 · 三年前的自己',
            '关键词：末班地铁 · 陌生人的伞 · 一句谢谢'
        ],
        challenge:[
            '挑战：只用 3 个镜头讲述一个完整的故事，不许加字幕。',
            '挑战：拍一个"无声视频"，全程只有画面，靠视觉讲完故事。',
            '挑战：一镜到底拍完 60 秒，中间不能停，不能剪。',
            '挑战：用手机拍出一部"电影感"短片，只用自然光。',
            '挑战：拍摄一个反转视频，让观众在第 15 秒和第 45 秒各惊一次。',
            '挑战：30 天内每天发布一条 10 秒视频，主题只有一个词：光。',
            '挑战：用定格动画拍一道菜从生到熟的全过程。',
            '挑战：拍一部"竖屏默片"，全程黑白，只用配乐讲故事。',
            '挑战：一个人分饰 5 个角色，拍一场"圆桌讨论"。',
            '挑战：在超市里拍一部短片，全程不被工作人员发现（当然要征得同意）。',
            '挑战：用「第一人称 POV」记录一次失败，结尾必须正能量。',
            '挑战：把一条热搜新闻拍成 60 秒的「假如我是当事人」短剧。'
        ]
    };

    /* ---------- 灵感扭蛋机 · 食材 → 食物 ---------- */
    // 每道菜包含其所需食材集合；生成器按"你手头食材能覆盖的菜"排序推荐
    const DISHES = [
        {name:'番茄炒蛋', need:['鸡蛋','番茄'], cuisine:'家常', desc:'国民下饭菜，酸甜开胃，新手零失败。'},
        {name:'蛋炒饭', need:['鸡蛋','米饭'], cuisine:'主食', desc:'隔夜饭 + 鸡蛋，粒粒分明，撒葱花更香。'},
        {name:'葱花炒蛋', need:['鸡蛋','葱'], cuisine:'家常', desc:'简单快手，葱香浓郁。'},
        {name:'番茄鸡蛋汤', need:['番茄','鸡蛋'], cuisine:'汤品', desc:'暖胃开胃，酸甜清爽。'},
        {name:'青椒炒肉', need:['青椒','猪肉'], cuisine:'家常', desc:'咸香下饭，青椒微辣提味。'},
        {name:'青椒炒蛋', need:['青椒','鸡蛋'], cuisine:'家常', desc:'清爽不腻，颜色也好看。'},
        {name:'土豆丝', need:['土豆'], cuisine:'家常', desc:'酸辣或清炒都行，关键切细丝。'},
        {name:'土豆炖牛肉', need:['土豆','牛肉'], cuisine:'炖菜', desc:'软糯土豆吸饱牛肉汤汁，超满足。'},
        {name:'红烧肉', need:['猪肉','姜'], cuisine:'硬菜', desc:'冰糖炒色，肥而不腻，配米饭绝了。'},
        {name:'姜葱炒蟹', need:['蟹','姜','葱'], cuisine:'海鲜', desc:'鲜香入味，宴客有面子。'},
        {name:'清蒸鱼', need:['鱼','葱','姜'], cuisine:'海鲜', desc:'原汁原味，淋热油激香。'},
        {name:'蒜蓉虾', need:['虾','蒜'], cuisine:'海鲜', desc:'蒜香扑鼻，连壳都想嗦干净。'},
        {name:'白灼虾', need:['虾'], cuisine:'海鲜', desc:'最考验新鲜度，蘸料是灵魂。'},
        {name:'麻婆豆腐', need:['豆腐','辣椒','蒜'], cuisine:'川菜', desc:'麻辣鲜香，豆腐嫩滑。'},
        {name:'家常豆腐', need:['豆腐'], cuisine:'家常', desc:'煎到金黄，烧汁入味。'},
        {name:'凉拌黄瓜', need:['黄瓜','蒜'], cuisine:'凉菜', desc:'拍碎更入味，清爽解腻。'},
        {name:'黄瓜炒蛋', need:['黄瓜','鸡蛋'], cuisine:'家常', desc:'清淡爽口，夏天最爱。'},
        {name:'地三鲜', need:['土豆','青椒','茄子'], cuisine:'东北菜', desc:'三种蔬菜过油焖烧，浓油赤酱。'},
        {name:'鱼香茄子', need:['茄子','蒜'], cuisine:'川菜', desc:'酸甜微辣，没有鱼却有鱼香。'},
        {name:'烤茄子', need:['茄子','蒜'], cuisine:'烧烤', desc:'蒜蓉粉丝铺面，烤箱/炭火都行。'},
        {name:'香菇炒鸡', need:['香菇','鸡肉'], cuisine:'家常', desc:'菌香浓郁，鸡肉嫩滑。'},
        {name:'香菇青菜', need:['香菇','白菜'], cuisine:'素菜', desc:'清淡鲜美，十分钟搞定。'},
        {name:'胡萝卜炒鸡蛋', need:['胡萝卜','鸡蛋'], cuisine:'家常', desc:'营养搭配，颜色亮眼。'},
        {name:'洋葱炒牛肉', need:['洋葱','牛肉'], cuisine:'家常', desc:'洋葱回甜，牛肉嫩滑。'},
        {name:'洋葱圈', need:['洋葱'], cuisine:'小吃', desc:'裹面糊炸至金黄，外脆里嫩。'},
        {name:'奶油玉米浓汤', need:['玉米','牛奶'], cuisine:'西餐', desc:'丝滑香甜，暖心暖胃。'},
        {name:'水煮玉米', need:['玉米'], cuisine:'主食', desc:'最简单也最甜，带点盐水更香。'},
        {name:'芝士焗土豆', need:['土豆','芝士'], cuisine:'西餐', desc:'拉丝治愈，罪恶又幸福。'},
        {name:'芝士吐司', need:['芝士','面包'], cuisine:'早餐', desc:'早餐快手，煎到芝士融化。'},
        {name:'培根煎蛋三明治', need:['培根','鸡蛋','面包'], cuisine:'早餐', desc:'碳水+蛋白，顶饱一上午。'},
        {name:'香肠炒饭', need:['香肠','米饭','鸡蛋'], cuisine:'主食', desc:'香肠的油香渗进米饭。'},
        {name:'凉拌菠菜', need:['菠菜','蒜'], cuisine:'凉菜', desc:'焯水拌蒜，补铁又清爽。'},
        {name:'菠菜蛋花汤', need:['菠菜','鸡蛋'], cuisine:'汤品', desc:'清淡营养，五分钟出锅。'},
        {name:'蒜蓉西兰花', need:['西兰花','蒜'], cuisine:'素菜', desc:'焯水后快炒，保持脆绿。'},
        {name:'南瓜粥', need:['南瓜','米'], cuisine:'主食', desc:'绵密香甜，养胃首选。'},
        {name:'山药排骨汤', need:['山药','排骨'], cuisine:'汤品', desc:'清润滋补，适合换季。'},
        {name:'木耳炒山药', need:['木耳','山药'], cuisine:'素菜', desc:'爽脆搭配，低卡健康。'},
        {name:'辣炒蛤蜊', need:['蛤蜊','辣椒','蒜'], cuisine:'海鲜', desc:'鲜辣开胃，配啤酒一绝。'},
        {name:'苹果沙拉', need:['苹果','生菜'], cuisine:'轻食', desc:'清爽低卡，淋点柠檬汁。'},
        {name:'香蕉奶昔', need:['香蕉','牛奶'], cuisine:'饮品', desc:'香蕉 + 牛奶打碎，顺滑香甜。'},
        {name:'蜂蜜烤香蕉', need:['香蕉','蜂蜜'], cuisine:'甜点', desc:'烤到流心，淋蜂蜜更高级。'},
        {name:'哈密瓜火腿盅', need:['哈密瓜','培根'], cuisine:'创意', desc:'甜咸碰撞，开胃小食。'},
        {name:'豆腐脑', need:['豆腐'], cuisine:'早餐', desc:'嫩豆腐淋卤，咸甜任君选。'}
    ];

    /* ---------- 海上丝路 · 货物 ---------- */
    // cat: luxury 奢侈品 · fresh 生鲜 · material 物资 · food 食品 · tribute 贡品（用于逸闻文案主题）
    // vol: perish 生鲜时令(荔枝/甘蔗/白菜,波动最高,易暴涨暴跌)
    //      luxury 高端奢侈品(丝绸/玉器/马匹,易冲高也易大跌)
    //      goods  日用物资(生铁/兽皮/牛肉/青梅酒,气候/节日/战争大幅波动)
    //      meds   药品(金创药,中等偏高,战乱疫病大涨)
    //      mid    其他(大米/海鱼/茶叶/贡品)
    // 注：朝廷征集为「特殊事件」，随机作用任意展示货物、方向随机（见 inspire.js genNews）
    const GOODS = [
        {key:'sugarcane', name:'甘蔗', base:10, icon:'🎋', cat:'food', vol:'perish'},
        {key:'cabbage', name:'白菜', base:15, icon:'🥬', cat:'food', vol:'perish'},
        {key:'plumwine', name:'青梅酒', base:49, icon:'🍶', cat:'food', vol:'goods'},
        {key:'iron', name:'生铁', base:19, icon:'🧱', cat:'material', vol:'goods'},
        {key:'silk', name:'丝绸', base:73, icon:'🧣', cat:'luxury', vol:'luxury'},
        {key:'hide', name:'兽皮', base:46, icon:'🐅', cat:'material', vol:'goods'},
        {key:'lychee', name:'荔枝', base:60, icon:'🍒', cat:'fresh', vol:'perish'},
        {key:'medkit', name:'金创药', base:80, icon:'⚱️', cat:'material', vol:'meds'},
        {key:'jade', name:'玉器', base:386, icon:'💍', cat:'luxury', vol:'luxury'},
        {key:'beef', name:'牛肉', base:80, icon:'🥩', cat:'food', vol:'goods'},
        {key:'rice', name:'大米', base:5, icon:'🌾', cat:'food', vol:'mid', modes:['50']},
        {key:'tribute', name:'贡品', base:1000, icon:'👑', cat:'tribute', vol:'mid', modes:['50']},
        {key:'seafish', name:'海鱼', base:50, icon:'🐟', cat:'food', vol:'mid', modes:['50']},
        {key:'tea', name:'茶叶', base:200, icon:'🍵', cat:'food', vol:'mid', modes:['50']},
        {key:'horse', name:'马匹', base:510, icon:'🐴', cat:'luxury', vol:'luxury'}
    ];

    // 四海逸闻 · 单品专属事件库（按货物 key 组织，供需逻辑贴合海上丝路）
    // 每个货物含 up（涨价事件）/ down（跌价事件）两个事件数组；
    // 每个事件：txt 文案（{G}=货物名），major: true = 重大消息（天灾/战乱/通商禁令/新矿/禁奢/商路阻断/疫病/运输损耗等），触发 ±100%~±2000% 剧烈波动；false = 普通消息（±50%~±500%）。
    // 注：每条逸闻由 genNews 依据「本轮展示货物」动态生成，保证至少提及一件展示货物。
    // 朝廷征集为「特殊事件」，在 inspire.js 中按随机方向、随机幅度作用任意展示货物（不限贡品）。
    const EVENTS = {
        sugarcane: {
            up: [
                {txt:'岭南大旱、蔗糖减产，「{G}」供给骤紧，市价抬升。', major:true},
                {txt:'南洋商路风浪阻断，外来「{G}」断供，行家看涨。', major:true}
            ],
            down: [
                {txt:'「{G}」大熟，多艘糖货商船到港，供给丰沛，价随之下落。', major:true},
                {txt:'新式制糖作坊量产，「{G}」供给过剩，行市走低。', major:true}
            ]
        },
        cabbage: {
            up: [
                {txt:'寒冬暴雪，北方蔬菜绝收，「{G}」一菜难求，价节节高。', major:true},
                {txt:'内陆河道封冻，「{G}」运不进城，市集一菜难求。', major:true}
            ],
            down: [
                {txt:'江南风调雨顺，本地「{G}」大批量上市，价贱伤农。', major:true}
            ]
        },
        lychee: {
            up: [
                {txt:'岭南寒潮冻伤果树，「{G}」减产，到港价飙升。', major:true},
                {txt:'海路巨浪，「{G}」鲜果运输损耗过半，市集奇货可居。', major:true}
            ],
            down: [
                {txt:'「{G}」大年丰产，舟车络绎运抵北地，价随之下落。', major:true},
                {txt:'保鲜之术普及，大量「{G}」鲜果低价倾销，行市低迷。', major:true}
            ]
        },
        seafish: {
            up: [
                {txt:'近海休渔、台风频发，渔船无法出海，「{G}」到港锐减。', major:true},
                {txt:'海上风暴损毁大量渔船，「{G}」供给告急，价高者得。', major:true}
            ],
            down: [
                {txt:'渔汛到来，渔民捕捞量暴涨，港中「{G}」堆积如山。', major:true},
                {txt:'港口「{G}」堆积滞销，商贩争相抛货，价一落千丈。', major:true}
            ]
        },
        rice: {
            up: [
                {txt:'产地洪涝旱灾，「{G}」粮食减产，行家看涨。', major:true},
                {txt:'官府囤积粮草备战，「{G}」市面供给收紧。', major:true}
            ],
            down: [
                {txt:'全国丰收，粮仓充盈，「{G}」价贱，民皆足食。', major:true},
                {txt:'海外稻米低价流入港口，「{G}」供给丰沛，行市回落。', major:true}
            ]
        },
        beef: {
            up: [
                {txt:'牛群疫病，肉牛存栏锐减，「{G}」供给吃紧，价高者得。', major:true},
                {txt:'婚宴、祭祀之期将至，「{G}」需求激增，行市上扬。', major:false}
            ],
            down: [
                {txt:'北方牧场繁育兴旺，肉牛大批量出栏，「{G}」供给充裕。', major:true}
            ]
        },
        plumwine: {
            up: [
                {txt:'青梅歉收，酒坊原料短缺，「{G}」酿制不易，价随之上扬。', major:true},
                {txt:'商旅出行增多，酒水需求上涨，「{G}」销路大开。', major:false}
            ],
            down: [
                {txt:'青梅丰产，各家酒坊大量出酒，「{G}」供给丰沛，价趋平稳。', major:true},
                {txt:'官府临时下达禁酒令，「{G}」禁销，市价应声回落。', major:true}
            ]
        },
        iron: {
            up: [
                {txt:'边关备战，官府大肆收购铁矿，「{G}」价高者得。', major:true},
                {txt:'矿场塌方停产，「{G}」来源受阻，行市走高。', major:true}
            ],
            down: [
                {txt:'新大型铁矿开采，「{G}」产量暴增，价随之下落。', major:true},
                {txt:'朝廷暂停军备采买，「{G}」需求骤减，行市低迷。', major:true}
            ]
        },
        hide: {
            up: [
                {txt:'寒冬将至，百姓采买皮毛御寒，「{G}」需求骤增。', major:false},
                {txt:'北部边境禁止进山狩猎，「{G}」来源收窄，价节节高。', major:true}
            ],
            down: [
                {txt:'秋冬狩猎丰收，大批皮毛运抵港口，「{G}」供给充裕。', major:true},
                {txt:'气候暖冬，皮毛需求低迷，「{G}」少人问津，价趋回落。', major:false}
            ]
        },
        silk: {
            up: [
                {txt:'江南蚕桑受灾，蚕丝减产，「{G}」织造不易，价抬升。', major:true},
                {txt:'海外蕃商大批量收购「{G}」，利厚引行家囤货。', major:true}
            ],
            down: [
                {txt:'丝绸工坊遍地开花，「{G}」货品泛滥，价趋回落。', major:true},
                {txt:'海外藩国减少「{G}」进口，外销受阻，行市走低。', major:true}
            ]
        },
        medkit: {
            up: [
                {txt:'边境冲突频发、地方爆发械斗，「{G}」军需告急。', major:true},
                {txt:'城内疫病蔓延，伤药紧缺，「{G}」求购者众。', major:true}
            ],
            down: [
                {txt:'天下太平无战事，「{G}」需求转淡，价趋平稳。', major:false},
                {txt:'药材原料丰产，药铺大量制药低价售卖，「{G}」行市回落。', major:true}
            ]
        },
        tea: {
            up: [
                {txt:'茶山旱灾减产，「{G}」供给收紧，价随之抬升。', major:true},
                {txt:'西域、海外商人高价收购「{G}」，利厚引囤货。', major:true}
            ],
            down: [
                {txt:'各大茶山丰收，「{G}」积压，价贱伤农。', major:true},
                {txt:'海外停止「{G}」贸易采购，外销断绝，行市走低。', major:true}
            ]
        },
        jade: {
            up: [
                {txt:'西域玉石商路短暂开通，「{G}」流转顺畅，贵气更盛。', major:true},
                {txt:'达官贵人收藏「{G}」热潮兴起，一物难求。', major:false}
            ],
            down: [
                {txt:'西域发现大型玉石矿脉，「{G}」供给将丰，行家料价回落。', major:true},
                {txt:'朝廷下达禁奢令，禁止民间囤积珠宝，「{G}」门庭冷落。', major:true}
            ]
        },
        horse: {
            up: [
                {txt:'官府大批量采购战马，「{G}」军需吃紧，价高者得。', major:true},
                {txt:'关外草场干旱，马匹存栏骤减，「{G}」供给告急。', major:true}
            ],
            down: [
                {txt:'关外马场良种繁育丰收，「{G}」大批量出栏，价趋回落。', major:true},
                {txt:'边关战事平息，军马需求归零，「{G}」少人问津。', major:true}
            ]
        },
        tribute: {
            up: [
                {txt:'朝廷筹备祭祀大典、藩国朝拜，高价收罗珍稀「{G}」。', major:true},
                {txt:'海外珍稀「{G}」商船遇风暴沉没，供给断绝，价腾贵。', major:true}
            ],
            down: [
                {txt:'各地藩国大批量进贡，港口「{G}」堆积，价趋回落。', major:true},
                {txt:'皇室缩减庆典开支，停止采买珍稀「{G}」，行市走低。', major:true}
            ]
        }
    };

    /* ---------- 热点视频追寻 · 种子数据（结构化模拟） ---------- */
    // 说明：真实抓取需各平台开放 API + 鉴权（环境暂不支持），此处为结构化模拟数据，
    // 已具备完整「爆火要素拆解」字段，可无缝替换为真实接口返回。
    const VIDEO_FETCHED_DATE = '2026-07-31';
    const VIDEOS = {
        douyin:[
            {id:'dy20260731a',title:'40℃送最后一单，他在电梯里坐了整整五分钟',author:'城市观察日记',likes:'186.4w',dur:'02:18',thumb:'🛵',tags:['纪实','高温','共情'],
                analysis:{hook:'开场就是汗透的后背特写 +「40℃」温度计',structure:'跟拍出发→连续超时→最后一单→电梯独坐',bgm:'环境音为主，尾段进钢琴',rhythm:'前快后慢，结尾长镜头留白',comments:'热评：别催单了 / 破防了',topic:'高温下的劳动者'} },
            {id:'dy20260731b',title:'暑假带娃第31天，我在厨房笑出了眼泪',author:'亲子生存指南',likes:'134.7w',dur:'01:52',thumb:'🧒',tags:['亲子','暑假','搞笑'],
                analysis:{hook:'「第31天」倒计时数字制造集体共鸣',structure:'早中晚三段崩溃实录→反转温情收尾',bgm:'魔性循环BGM，卡点在崩溃瞬间',rhythm:'快剪，每段15秒一个爆点',comments:'热评：一模一样 / 开学倒计时',topic:'暑假带娃众生相'} },
            {id:'dy2',title:'把出租屋爆改成ins风，只花了800块',author:'租房改造王',likes:'96.3w',dur:'03:45',thumb:'🛋️',tags:['改造','省钱','家居'],
                analysis:{hook:'"800块"数字冲击 + 前后对比',structure:'痛点引入→材料清单→施工过程→成果展示',bgm:'Lo-fi 慵懒风 BGM',rhythm:'中速，重点处慢放特写',comments:'热评：求链接 / 房东看了想加租',topic:'低成本生活方式'} },
            {id:'dy3',title:'当兵哥哥突然回家，妈妈的表情我看哭了',author:'小家的日常',likes:'342.1w',dur:'01:12',thumb:'🎖️',tags:['亲情','反转','情感'],
                analysis:{hook:'第一帧就是妈妈错愕的脸',structure:'铺垫期待→门开瞬间→情绪爆发→旁白升华',bgm:'钢琴纯音乐《萱草花》',rhythm:'慢节奏，配特写与留白',comments:'热评：破防了 / 想家了',topic:'家庭情感共鸣'} },
            {id:'dy4',title:'3秒学会的Office隐藏技巧，打工人必看',author:'效率阿强',likes:'74.8w',dur:'00:48',thumb:'💡',tags:['干货','职场','教程'],
                analysis:{hook:'"3秒学会"降低学习门槛',structure:'问题→操作演示→效果对比',bgm:'无BGM，纯人声+按键音',rhythm:'极快，单镜头不超过2秒',comments:'热评：已收藏 / 明天就用',topic:'职场效率干货'} },
            {id:'dy5',title:'凌晨四点的菜市场，藏着这座城最真实的烟火',author:'城市漫游者',likes:'58.2w',dur:'04:20',thumb:'🌃',tags:['城市','治愈','记录'],
                analysis:{hook:'"凌晨四点"制造时间反差',structure:'空镜氛围→摊主采访→人文特写→总结',bgm:'环境音 + 轻音乐',rhythm:'舒缓，长镜头较多',comments:'热评：好治愈 / 这就是生活',topic:'城市人文记录'} },
            {id:'dy6',title:'和对象吵架后，我用这招瞬间和好',author:'恋爱急救室',likes:'151.9w',dur:'01:38',thumb:'💞',tags:['情感','恋爱','干货'],
                analysis:{hook:'"吵架后"戳中普遍痛点',structure:'情景演绎→错误示范→正确操作→结果',bgm:'甜系流行乐',rhythm:'中速，情景切换清晰',comments:'热评：已抄作业 / 太有用了',topic:'亲密关系经营'} },
            {id:'dy7',title:'被裁员后我做对这3个副业，月入反超工资',author:'副业研究所',likes:'112.4w',dur:'02:05',thumb:'💰',tags:['副业','搞钱','干货'],
                analysis:{hook:'"被裁员"戳中焦虑引发共鸣',structure:'困境引入→三个副业拆解→收入对比',bgm:'轻快卡点乐',rhythm:'快剪，数字处强调',comments:'热评：求详细 / 已收藏',topic:'普通人副业搞钱'} },
            {id:'dy8',title:'一条视频涨粉50万，我做对了什么',author:'涨粉方法论',likes:'203.7w',dur:'03:12',thumb:'📱',tags:['涨粉','运营','干货'],
                analysis:{hook:'"涨粉50万"结果前置',structure:'数据展示→方法论拆解→避坑提醒',bgm:'电子流行',rhythm:'中速，章节清晰',comments:'热评：太干了 / 抄走',topic:'账号涨粉运营'} },
            {id:'dy9',title:'95后夫妻辞职开咖啡馆，现实比想象残酷',author:'小店日记',likes:'87.9w',dur:'05:30',thumb:'☕',tags:['创业','咖啡','纪实'],
                analysis:{hook:'"辞职开咖啡馆"浪漫反差',structure:'开店期待→真实成本→血泪复盘',bgm:'轻音乐',rhythm:'中速，前后对比',comments:'热评：真实 / 劝退',topic:'小微创业纪实'} },
            {id:'dy10',title:'这个收纳神器让家里从混乱变有序',author:'种草生活',likes:'143.2w',dur:'01:45',thumb:'📦',tags:['好物','收纳','家居'],
                analysis:{hook:'"混乱变有序"结果对比',structure:'痛点展示→产品演示→前后对比',bgm:'轻快',rhythm:'快剪，特写为主',comments:'热评：下单了 / 求链接',topic:'家居好物种草'} },
            {id:'dy1',title:'95后辞职摆摊卖提拉米苏，月入3万的真实一天',author:'阿May的摆摊日记',likes:'128.6w',dur:'02:31',thumb:'🍰',tags:['创业','美食','逆袭'],
                analysis:{hook:'前3秒直接甩出"辞职+月入3万"反差钩子',structure:'摆摊Vlog + 成本账目拆解 + 收入揭晓',bgm:'轻快卡点流行乐《夏天的风》remix',rhythm:'快剪，每5秒一个镜头切换',comments:'热评：求摊位地址 / 这真的能赚钱吗',topic:'普通人的搞钱副业'} }
        ],
        kuaishou:[
            {id:'ks20260731a',title:'三伏天麦收后，大爷在老槐树下摆了一整桌',author:'乡野记事',likes:'214.5w',dur:'04:32',thumb:'🌳',tags:['乡村','三伏','烟火'],
                analysis:{hook:'蝉鸣+热浪空镜，一桌菜端上土墙桌',structure:'收工→洗手→上菜→全村人围坐',bgm:'唢呐改编的轻民乐',rhythm:'慢，长镜头记录整桌上齐',comments:'热评：这才是夏天 / 想回老家',topic:'农忙后的乡村宴席'} },
            {id:'ks20260731b',title:'冰库零下18度，路面40度，他一天穿越两个季节',author:'冷链师傅老周',likes:'167.3w',dur:'03:08',thumb:'🧊',tags:['纪实','打工人','反差'],
                analysis:{hook:'温度计从 -18 直切 +40 的极端反差',structure:'进库搬货→出库暴晒→午休自述→收车',bgm:'低频环境音+简单鼓点',rhythm:'冷热镜头交替剪辑，形成节奏冲击',comments:'热评：辛苦了 / 这活我干不了',topic:'冷链劳动者纪实'} },
            {id:'ks2',title:'夫妻俩带着娃自驾西藏，路上发生了这事',author:'在路上一家人',likes:'176.7w',dur:'06:30',thumb:'🚐',tags:['旅行','家庭','vlog'],
                analysis:{hook:'"发生了这事"制造悬念',structure:'出发→旅途趣事→突发事件→温情收尾',bgm:'公路民谣',rhythm:'中速，风景空镜穿插',comments:'热评：羡慕哭了 / 注意安全',topic:'家庭旅行纪实'} },
            {id:'ks3',title:'工地大哥午饭只有咸菜，看完鼻子一酸',author:'城市建设者',likes:'264.0w',dur:'02:08',thumb:'🏗️',tags:['纪实','感动','打工人'],
                analysis:{hook:'"只有咸菜"制造共情',structure:'特写饭菜→自述经历→旁白致敬',bgm:'二胡纯音乐',rhythm:'极慢，留白多',comments:'热评：不容易 / 致敬',topic:'劳动者纪实'} },
            {id:'ks4',title:'爷爷用毛笔写春联，一笔一划都是年味',author:'墨香世家',likes:'89.5w',dur:'03:15',thumb:'🖌️',tags:['传统文化','手艺','年味'],
                analysis:{hook:'"爷爷"唤起代际温情',structure:'铺纸→运笔→成联→祝福',bgm:'古筝轻音乐',rhythm:'舒缓，突出笔触细节',comments:'热评：这才是年味 / 想学',topic:'非遗手艺传承'} },
            {id:'ks5',title:'自家果园的苹果，咬一口甜到心里',author:'大山里的果子',likes:'112.3w',dur:'02:40',thumb:'🍎',tags:['助农','带货','原产地'],
                analysis:{hook:'"甜到心里"感官刺激',structure:'果园实景→现摘现吃→价格福利',bgm:'欢快乡村电子乐',rhythm:'明快，产品特写多',comments:'热评：下单了 / 求链接',topic:'原产地助农'} },
            {id:'ks6',title:'零下30度冬捕，一网下去全是惊喜',author:'东北老铁日常',likes:'198.1w',dur:'04:55',thumb:'🐟',tags:['地域','震撼','记录'],
                analysis:{hook:'"零下30度"极端环境',structure:'环境铺垫→破冰→收网→丰收',bgm:'激昂进行曲',rhythm:'紧张→释放的节奏起伏',comments:'热评：壮观 / 太冷了',topic:'地域特色纪实'} },
            {id:'ks7',title:'70岁大爷自学剪辑，视频比年轻人还潮',author:'银发创作者',likes:'156.8w',dur:'03:40',thumb:'🎬',tags:['银发','剪辑','励志'],
                analysis:{hook:'"70岁大爷"反差人设',structure:'作品展示→学习过程→成果惊艳',bgm:'潮流电子',rhythm:'快剪，卡点精准',comments:'热评：太酷了 / 我爷爷也要学',topic:'银发创作者励志'} },
            {id:'ks8',title:'山区孩子收到捐赠书包，笑容太治愈',author:'暖心公益',likes:'221.3w',dur:'02:55',thumb:'🎒',tags:['公益','山区','感动'],
                analysis:{hook:'"收到书包"瞬间抓拍',structure:'受赠场景→孩子反应→旁白升华',bgm:'钢琴轻音乐',rhythm:'慢节奏，留白多',comments:'热评：破防 / 想捐',topic:'暖心公益纪实'} },
            {id:'ks9',title:'一锅炖出整条街香味的东北大锅菜',author:'农家大厨',likes:'134.6w',dur:'04:10',thumb:'🍲',tags:['美食','东北','下饭'],
                analysis:{hook:'"整条街香味"感官刺激',structure:'食材准备→炖煮过程→出锅特写',bgm:'环境音+民乐',rhythm:'中速，诱人特写',comments:'热评：看饿了 / 求做法',topic:'乡村美食下饭'} },
            {id:'ks10',title:'养了三年的多肉终于爆盆了',author:'多肉控',likes:'98.2w',dur:'01:58',thumb:'🌵',tags:['多肉','园艺','治愈'],
                analysis:{hook:'"三年爆盆"时间沉淀',structure:'对比图→养护要点→爆盆展示',bgm:'治愈轻音乐',rhythm:'舒缓，特写为主',comments:'热评：好治愈 / 同款',topic:'园艺治愈日常'} },
            {id:'ks1',title:'农村大叔用废旧轮胎做出的沙发，全村都来要',author:'老王的乡村生活',likes:'203.4w',dur:'05:02',thumb:'🛞',tags:['手工','农村','创意'],
                analysis:{hook:'"废旧轮胎"废物利用反差',structure:'材料展示→一步步制作→成品惊艳',bgm:'乡土民谣',rhythm:'慢工出细活，过程完整',comments:'热评：手真巧 / 想学',topic:'乡村手作改造'} }
        ],
        bilibili:[
            {id:'b20260731a',title:'我做了个AI暑期档票房预测器，跑完数据我沉默了',author:'数据炼金术',likes:'67.9w',dur:'15:12',thumb:'🎬',tags:['AI','数据','电影'],field:'AI',
                analysis:{hook:'"跑完数据我沉默了"埋悬念+结果前置',structure:'数据采集→特征工程→模型训练→打脸复盘',bgm:'低音量电子背景乐',rhythm:'信息密度高，图表处停留放慢',comments:'热评：求数据集 / 模型开源吗',topic:'AI数据建模实战'} },
            {id:'b20260731b',title:'7月末电商复盘：这波"反季清仓"到底谁在赚钱',author:'商业观察猿',likes:'44.2w',dur:'13:40',thumb:'🏷️',tags:['电商','复盘','分析'],field:'电商',
                analysis:{hook:'"谁在赚钱"直指利益链疑问',structure:'现象罗列→库存逻辑→三类玩家拆解→普通人机会',bgm:'轻快说唱BGM',rhythm:'中速，图表与口播交替',comments:'热评：讲透了 / 求下期',topic:'电商库存与清仓逻辑'} },
            {id:'b2',title:'从0到1搭建一个AI Agent，手把手带你跑通（LangChain实战）',author:'代码不睡觉',likes:'64.7w',dur:'18:40',thumb:'⚙️',tags:['AI','编程','干货'],field:'AI',
                analysis:{hook:'"0到1"降低门槛的承诺',structure:'架构讲解→环境配置→代码逐行→运行演示',bgm:'无BGM，保留键盘音',rhythm:'信息密度高，章节清晰',comments:'热评：太硬核 / 收藏慢慢看',topic:'AI工程落地'} },
            {id:'b3',title:'2026电商趋势预测：普通人还能在哪赚钱？',author:'商业观察猿',likes:'52.9w',dur:'14:05',thumb:'📈',tags:['电商','商业','分析'],field:'电商',
                analysis:{hook:'"普通人赚钱"直击痛点',structure:'数据引入→三大趋势→机会拆解→风险提示',bgm:'轻快说唱BGM',rhythm:'中速，图表配合讲解',comments:'热评：分析到位 / 求细分',topic:'电商趋势解读'} },
            {id:'b4',title:'我把店铺详情页用AI重做，转化率翻了一倍',author:'电商老炮儿',likes:'41.3w',dur:'09:52',thumb:'🛒',tags:['电商','AI','实操'],field:'电商',
                analysis:{hook:'"翻倍"结果前置',structure:'原页面问题→AI改造思路→A/B对比→复盘',bgm:'无/轻量',rhythm:'对比处慢放强调',comments:'热评：求模板 / 同款工具',topic:'AI+电商转化'} },
            {id:'b5',title:'用AI写一个会"整活"的短视频脚本生成器',author:'提示词研究所',likes:'37.6w',dur:'12:18',thumb:'✨',tags:['AI','脚本','创意'],field:'AI',
                analysis:{hook:'"整活"网络梗拉近距离',structure:'灵感来源→prompt设计→效果演示→局限说明',bgm:'电子流行',rhythm:'轻松，演示为主',comments:'热评：拿来吧你 / 已三连',topic:'Prompt工程实践'} },
            {id:'b6',title:'直播带货话术拆解：为什么她一场能卖1000万',author:'带货研究所',likes:'46.1w',dur:'15:33',thumb:'🎙️',tags:['电商','直播','拆解'],field:'电商',
                analysis:{hook:'"1000万"数字冲击',structure:'话术片段→心理原理→结构拆解→可复用法',bgm:'无',rhythm:'按话术节点切分',comments:'热评：学到了 / 求更多',topic:'直播运营拆解'} },
            {id:'b7',title:'用3个月从月薪5k到15k，我的转行复盘',author:'职场进化论',likes:'59.8w',dur:'13:27',thumb:'🚀',tags:['职场','转行','成长'],field:'职场',
                analysis:{hook:'"5k到15k"数字反差',structure:'背景铺垫→学习方法→避坑指南→结果',bgm:'轻电子',rhythm:'中速，重点慢放',comments:'热评：受用了 / 求路径',topic:'职场成长复盘'} },
            {id:'b8',title:'把家改造成赛博朋克风，成本不到2k',author:'硬核改造',likes:'72.4w',dur:'16:50',thumb:'🌆',tags:['改造','DIY','科技'],field:'改造',
                analysis:{hook:'"2k赛博朋克"低成本冲击',structure:'灵感来源→材料清单→施工→灯效调试',bgm:'Synthwave',rhythm:'快剪，灯效处特写',comments:'热评：太帅了 / 求清单',topic:'硬核家居改造'} },
            {id:'b9',title:'一镜到底拍完城市夜景，背后太硬核',author:'影像玩家',likes:'48.1w',dur:'10:02',thumb:'🌃',tags:['摄影','运镜','教程'],field:'摄影',
                analysis:{hook:'"一镜到底"技术钩子',structure:'分镜规划→设备→实拍→后期',bgm:'无/环境音',rhythm:'按运镜节点切分',comments:'热评：膜拜 / 求参数',topic:'影像运镜教程'} },
            {id:'b10',title:'拆解爆款短视频的黄金3秒，全靠这5个套路',author:'内容工厂',likes:'55.6w',dur:'12:33',thumb:'🔥',tags:['短视频','拆解','运营'],field:'运营',
                analysis:{hook:'"黄金3秒"直击痛点',structure:'案例展示→5套路拆解→可复用模板',bgm:'轻快',rhythm:'按套路节点切分',comments:'热评：干货 / 已三连',topic:'短视频运营拆解'} },
            {id:'b1',title:'我用AI把老照片做成动画，奶奶看哭了（Stable Diffusion教程）',author:'AI炼丹师小李',likes:'88.2w',dur:'11:23',thumb:'🤖',tags:['AI','教程','情感'],field:'AI',
                analysis:{hook:'"奶奶看哭了"情感+AI技术结合',structure:'需求背景→工具介绍→分步操作→成果展示',bgm:'无/轻量电子乐',rhythm:'中速，关键步骤慢放+字幕',comments:'热评：求工作流 / 参数能发吗',topic:'AI图像应用实操'} }
        ]
    };

    return { DAILY_WORDS, CET4_WORDS, INSPIRE, DISHES, GOODS, EVENTS, VIDEOS, VIDEO_FETCHED_DATE };
})();
