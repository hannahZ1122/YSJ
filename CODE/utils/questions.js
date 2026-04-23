/**
 * 益生菌精准营养测评问卷 v2.0
 *
 * 字段说明：
 *   type: "single" | "multi" | "number_input"
 *   showForGender: "all" | "male" | "female"  （缺省视为 "all"）
 *   min / max: 多选题的最少/最多选择数
 *   options[].scores: 该选项贡献的产品得分
 */

module.exports = [
  // ─── 基础信息 ───────────────────────────────────────────────
  {
    id: 'q1_goal',
    type: 'multi',
    min: 1,
    max: 3,
    showForGender: 'all',
    title: '您当前最希望改善的健康诉求是？',
    hint: '可选 1~3 项',
    options: [
      { text: '🍃 肠道消化 / 排便习惯',    scores: { P1: 50 } },
      { text: '⚡ 体态管理 / 减脂控糖',    scores: { P3: 50 } },
      { text: '🧠 专注力 / 脑力效率',      scores: { P4: 50 } },
      { text: '🌙 情绪压力 / 睡眠质量',    scores: { P5: 50 } },
      { text: '✨ 抗衰老 / 皮肤焕活',      scores: { P2: 50 } },
      { text: '🛡️ 免疫力 / 过敏体质',     scores: { P6: 50 } },
      { text: '🌿 长寿 / 长期机能维护',    scores: { P7: 50 } },
      { text: '💪 男性活力',     scores: { P9: 50 } },
      { text: '🌸 女性私处健康', scores: { P10: 50 } },
    ],
  },
  {
    id: 'q2_gender',
    type: 'single',
    showForGender: 'all',
    title: '您的性别',
    options: [
      { text: '男', scores: { P9: 5 } },
      { text: '女', scores: { P10: 5 } },
      { text: '不便透露', scores: {} },
    ],
  },
  {
    id: 'q3_age',
    type: 'single',
    showForGender: 'all',
    title: '您的年龄段',
    options: [
      { text: '18 ~ 30 岁', scores: { P3: 5, P1: 3 } },
      { text: '31 ~ 45 岁', scores: { P2: 8, P3: 3 } },
      { text: '46 ~ 55 岁', scores: { P7: 8, P2: 8 } },
      { text: '55 岁以上',  scores: { P7: 20, P2: 5 } },
    ],
  },
  {
    id: 'q4_body',
    type: 'number_input',
    showForGender: 'all',
    title: '请输入您的身高和体重',
    hint: '用于计算 BMI，评估代谢健康状态',
    fields: [
      { key: 'height', label: '身高', unit: 'cm', placeholder: '如 168', min: 100, max: 250 },
      { key: 'weight', label: '体重', unit: 'kg', placeholder: '如 62',  min: 30,  max: 200 },
    ],
  },

  // ─── 肠道 & 饮食 ────────────────────────────────────────────
  {
    id: 'q5_bowel_freq',
    type: 'single',
    showForGender: 'all',
    title: '您的排便频率通常是？',
    options: [
      { text: '每天 1 次，非常规律',        scores: { P7: 3 } },
      { text: '1~2 天 1 次，基本规律',      scores: { P1: 3 } },
      { text: '2~3 天才 1 次',              scores: { P1: 12 } },
      { text: '一周少于 2 次（严重便秘）', scores: { P1: 20 } },
      { text: '每天多次且不成形（腹泻）',  scores: { P1: 8, P6: 12 } },
    ],
  },
  {
    id: 'q6_bowel_feel',
    type: 'single',
    showForGender: 'all',
    title: '排便时的主要感受？',
    options: [
      { text: '顺畅轻松，毫无压力',          scores: { P7: 3 } },
      { text: '费力，大便干燥',              scores: { P1: 15 } },
      { text: '排不尽感 / 粘马桶',          scores: { P1: 10, P3: 5 } },
      { text: '腹痛急迫 / 稀软不成形',      scores: { P6: 15 } },
    ],
  },
  {
    id: 'q7_bloating',
    type: 'single',
    showForGender: 'all',
    title: '餐后是否经常感到腹胀或排气过多？',
    options: [
      { text: '经常，气味较重',     scores: { P1: 15 } },
      { text: '偶尔，视食物而定',  scores: { P1: 5 } },
      { text: '基本没有',           scores: { P7: 2 } },
    ],
  },
  {
    id: 'q8_diet',
    type: 'multi',
    min: 1,
    max: 2,
    showForGender: 'all',
    title: '您的日常饮食风格？（可选 1~2 项）',
    options: [
      { text: '清淡均衡，常自己做饭',        scores: { P7: 5 } },
      { text: '重油重辣 / 重口味',            scores: { P1: 10, P3: 5 } },
      { text: '高糖 / 奶茶甜点控',           scores: { P3: 15 } },
      { text: '高蛋白 / 肉食为主',           scores: { P1: 10 } },
      { text: '外卖为主，蔬菜摄入很少',     scores: { P1: 15, P3: 8 } },
      { text: '素食 / 全谷物为主',           scores: { P7: 8 } },
    ],
  },
  {
    id: 'q9_exercise',
    type: 'single',
    showForGender: 'all',
    title: '您的运动习惯是？',
    options: [
      { text: '规律运动（每周 3 次以上）',   scores: { P3: 5, P9: 5, P7: 3 } },
      { text: '偶尔活动（每周 1~2 次）',    scores: { P3: 3 } },
      { text: '长期久坐，几乎不运动',        scores: { P3: 15, P1: 8, P9: 8 } },
    ],
  },
  {
    id: 'q10_alcohol',
    type: 'single',
    showForGender: 'all',
    title: '您的饮酒习惯是？',
    options: [
      { text: '滴酒不沾',            scores: { P6: 3 } },
      { text: '偶尔小酌（每月 1~3 次）', scores: { P1: 3 } },
      { text: '每周饮酒 1~3 次',     scores: { P1: 8, P3: 5 } },
      { text: '频繁饮酒（几乎每天）', scores: { P1: 12, P9: 10, P3: 8 } },
    ],
  },

  // ─── 睡眠 & 情绪 & 脑力 ─────────────────────────────────────
  {
    id: 'q11_sleep_time',
    type: 'single',
    showForGender: 'all',
    title: '您通常几点入睡？',
    options: [
      { text: '22:00 之前',               scores: { P7: 8 } },
      { text: '22:00 ~ 23:30',            scores: { P5: 5 } },
      { text: '23:30 ~ 01:00',            scores: { P5: 12, P2: 8 } },
      { text: '01:00 之后（资深夜猫）',  scores: { P5: 18, P2: 12, P6: 5 } },
    ],
  },
  {
    id: 'q12_sleep_quality',
    type: 'single',
    showForGender: 'all',
    title: '您的睡眠质量如何？',
    options: [
      { text: '一觉到天亮，精神饱满',      scores: { P7: 5 } },
      { text: '易惊醒或梦多',              scores: { P5: 15 } },
      { text: '入睡困难，翻来覆去',        scores: { P5: 18 } },
      { text: '醒后依然感到疲惫',          scores: { P4: 10, P5: 8 } },
    ],
  },
  {
    id: 'q13_stress',
    type: 'single',
    showForGender: 'all',
    title: '您感知到的日常压力水平？',
    options: [
      { text: '较小，生活比较轻松',         scores: { P7: 3 } },
      { text: '中等，工作或学业繁忙',       scores: { P5: 10, P4: 5 } },
      { text: '较大，经常感到焦虑或烦躁',  scores: { P5: 18, P4: 10 } },
      { text: '极大，长期处于高压状态',    scores: { P5: 22, P4: 12, P2: 5 } },
    ],
  },
  {
    id: 'q14_focus',
    type: 'single',
    showForGender: 'all',
    title: '在需要专注工作 / 学习时，您通常能持续多久？',
    options: [
      { text: '2 小时以上，专注力很好', scores: { P7: 3 } },
      { text: '1 小时左右',             scores: { P4: 5 } },
      { text: '半小时左右就容易分神',   scores: { P4: 12 } },
      { text: '很难静下心，脑子经常断片', scores: { P4: 20 } },
    ],
  },

  // ─── 免疫 & 皮肤 & 衰老 ─────────────────────────────────────
  {
    id: 'q15_immune',
    type: 'single',
    showForGender: 'all',
    title: '近一年，您感冒或呼吸道感染的频率？',
    options: [
      { text: '0~1 次，抵抗力不错',    scores: { P7: 5 } },
      { text: '2~3 次',                scores: { P6: 10 } },
      { text: '4 次以上，容易反复感冒', scores: { P6: 20 } },
    ],
  },
  {
    id: 'q16_allergy',
    type: 'single',
    showForGender: 'all',
    title: '您是否有过敏性鼻炎、皮肤敏感或其他过敏问题？',
    options: [
      { text: '长期受困扰',            scores: { P6: 20 } },
      { text: '偶尔季节性发作',        scores: { P6: 10 } },
      { text: '没有过敏史',            scores: { P7: 2 } },
    ],
  },
  {
    id: 'q17_skin',
    type: 'single',
    showForGender: 'all',
    title: '您的皮肤状态与同龄人相比？',
    options: [
      { text: '更年轻细腻，状态很好',  scores: { P7: 5 } },
      { text: '差不多，无明显问题',    scores: { P2: 3 } },
      { text: '暗沉 / 干燥 / 弹性下降', scores: { P2: 15, P7: 5 } },
      { text: '明显皱纹或松弛（明显显老）', scores: { P2: 22, P7: 10 } },
    ],
  },

  // ─── 综合症状 ────────────────────────────────────────────────
  {
    id: 'q18_energy',
    type: 'single',
    showForGender: 'all',
    title: '您的日常体力与精力状态？',
    options: [
      { text: '精力充沛，状态良好',        scores: { P7: 3 } },
      { text: '下午容易犯困，提不起劲',    scores: { P4: 8, P3: 5 } },
      { text: '经常感到疲惫，睡多少都不够', scores: { P4: 12, P5: 8 } },
      { text: '体力透支明显，影响日常生活', scores: { P9: 15, P4: 10, P5: 10 } },
    ],
  },
  {
    id: 'q19_mouth',
    type: 'single',
    showForGender: 'all',
    title: '您是否有口苦、口臭或晨起口腔异味？',
    options: [
      { text: '经常有，比较困扰', scores: { P1: 15, P3: 5 } },
      { text: '偶尔',             scores: { P1: 5 } },
      { text: '基本没有',         scores: { P7: 2 } },
    ],
  },
  {
    id: 'q20_antibiotic',
    type: 'single',
    showForGender: 'all',
    title: '近三个月内是否服用过抗生素（阿莫西林、头孢等）？',
    options: [
      { text: '是，近期服用过',   scores: { P1: 20, P6: 8 } },
      { text: '半年前服用过',     scores: { P1: 8 } },
      { text: '基本不服用',       scores: { P7: 2 } },
    ],
  },

  // ─── 性别专属 ────────────────────────────────────────────────
  {
    id: 'q21_male_vitality',
    type: 'single',
    showForGender: 'male',
    title: '（男士专属）近期是否感到精力不足、体力明显下降？',
    options: [
      { text: '频繁，体力透支感明显', scores: { P9: 22 } },
      { text: '偶尔，工作量大时',    scores: { P9: 12 } },
      { text: '精力旺盛，不存在这个问题', scores: { P9: 0 } },
    ],
  },
  {
    id: 'q22_female_private',
    type: 'single',
    showForGender: 'female',
    title: '（女士专属）私处是否有瘙痒、异味等反复不适？',
    options: [
      { text: '是，反复发作，困扰较大', scores: { P10: 22 } },
      { text: '偶尔不适',              scores: { P10: 12 } },
      { text: '从未有过',              scores: { P10: 0 } },
    ],
  },

  // ─── 期望 ────────────────────────────────────────────────────
  {
    id: 'q23_expectation',
    type: 'single',
    showForGender: 'all',
    title: '您对健康调理的期待是？',
    options: [
      { text: '快速见效，1 个月内改善',   scores: { P1: 5 } },
      { text: '3 个月深度调理，彻底改善', scores: { P3: 5, P7: 5 } },
      { text: '长期维护，作为健康习惯',   scores: { P7: 15 } },
    ],
  },
];
