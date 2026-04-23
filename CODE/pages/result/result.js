const USAGE_TIPS = [
  { icon: '⏰', label: '服用时机', value: '餐后30分钟，随温水送服' },
  { icon: '📅', label: '建议周期', value: '连续服用4~8周，效果更稳定' },
  { icon: '🌡️', label: '储存方式', value: '阴凉干燥处密封保存，避免高温直晒' },
];

const RADAR_DIMS = ['能量', '平衡', '纤维', '消化', '活力', '滋养', '焕彩', '专注', '平静'];

Page({
  data: {
    product: {},
    targetItems: [],
    aiExplanation: '',
    usageTips: USAGE_TIPS,
  },

  onLoad() {
    const app = getApp();
    let result = app.globalData.recommendResult;

    if (!result || !result.data) {
      // ── DEV MOCK：开发调试用，正式上线前删除此段 ──────────────
      result = {
        code: 200,
        data: {
          id: 'P9',
          name: '男性活力配方（代谢+泌尿型）',
          tag: '男性活力',
          description: '支持男性生殖代谢健康，调节前列腺微环境，恢复充沛体力与精力，专为现代男性健康需求设计。',
          target: '精力透支、久坐、关注前列腺健康与雄性活力的男性人群',
          strains: ['植物乳杆菌 LP-115', '嗜酸乳杆菌 La-5', '鼠李糖乳杆菌 GG'],
          prebiotics: ['低聚果糖（FOS）'],
          additionalIngredients: ['锌', '硒', '南瓜籽提取物'],
          cfuCount: '200亿CFU/粒',
          highlights: ['恢复体力', '支持生殖健康', '前列腺护理'],
          matchReasons: ['评估显示您存在体力透支或久坐相关的代谢问题', '本配方专为男性设计，支持前列腺健康与体力恢复'],
          lifeTips: [
            { icon: '💪', text: '定期进行力量训练，维持肌肉量与基础代谢率' },
            { icon: '🚫', text: '减少久坐时间，每小时起身活动5分钟' },
            { icon: '🍷', text: '控制饮酒频率，保护肝脏与前列腺健康' },
          ],
          dimensionScores: { 能量: 90, 平衡: 70, 纤维: 78, 消化: 65, 活力: 95, 滋养: 75, 焕彩: 60, 专注: 65, 平静: 60 },
        },
      };
      app.globalData.recommendResult = result;
      app.globalData.aiExplanation = '根据您的评估结果，您存在明显的体力透支与精力下降迹象，久坐与饮食习惯也影响了代谢效率。男性活力配方中的植物乳杆菌LP-115经研究证实可支持男性代谢健康，配合锌与硒的协同作用，从内调节活力根基。建议坚持服用8周，同时适当增加日常活动量。';
      // ── DEV MOCK 结束 ────────────────────────────────────────
    }

    const product = result.data;
    const explanation = app.globalData.aiExplanation || '';

    const targetItems = (product.target || '')
      .split(/[、，,。；;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    this.setData({ product, targetItems, aiExplanation: explanation, usageTips: USAGE_TIPS });
  },

  onReady() {
    // canvas 在 onReady 时才真正挂载完毕
    this._drawRadarChart();
  },

  // ── 雷达图绘制 ──────────────────────────────────────────────
  _drawRadarChart() {
    const { product } = this.data;
    if (!product || !product.dimensionScores) return;

    const values = RADAR_DIMS.map(d => (product.dimensionScores[d] || 0) / 100);

    wx.createSelectorQuery()
      .in(this)
      .select('#radarChart')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res || !res[0] || !res[0].node) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const W = res[0].width;
        const H = res[0].height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const cx = W / 2;
        const cy = H / 2 + 4;
        const R = Math.min(W, H) / 2 - 42;
        const n = RADAR_DIMS.length;
        const step = (Math.PI * 2) / n;
        const start = -Math.PI / 2;

        const pt = (i, r) => ({
          x: cx + r * Math.cos(start + i * step),
          y: cy + r * Math.sin(start + i * step),
        });

        // ── 背景网格 ──
        for (let lv = 1; lv <= 5; lv++) {
          const r = R * lv / 5;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const p = pt(i, r);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.strokeStyle = 'rgba(59,130,246,0.15)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          if (lv === 5) {
            ctx.fillStyle = 'rgba(59,130,246,0.03)';
            ctx.fill();
          }
        }

        // ── 轴线 ──
        for (let i = 0; i < n; i++) {
          const p = pt(i, R);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = 'rgba(59,130,246,0.18)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // ── 数据填充 ──
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const p = pt(i, R * values[i]);
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.18)';
        ctx.fill();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // ── 数据点 ──
        for (let i = 0; i < n; i++) {
          const p = pt(i, R * values[i]);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // ── 标签（维度名 + 数值）──
        for (let i = 0; i < n; i++) {
          const lp = pt(i, R + 28);
          const score = Math.round(values[i] * 100);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#555';
          ctx.font = '11px sans-serif';
          ctx.fillText(RADAR_DIMS[i], lp.x, lp.y - 8);
          ctx.fillStyle = '#3B82F6';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(score, lp.x, lp.y + 8);
        }
      });
  },

  onViewProduct() {
    wx.showToast({ title: '产品详情即将上线', icon: 'none', duration: 2000 });
  },

  onRestart() {
    const app = getApp();
    app.globalData.recommendResult = null;
    app.globalData.aiExplanation = null;
    app.globalData.pendingAnswers = null;
    app.globalData.pendingFile = null;
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
