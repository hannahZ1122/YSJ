const api = require('../../utils/api');

const STATUS_TEXTS_SURVEY = [
  '正在分析您的健康数据…',
  'AI 正在匹配最优配方…',
  '生成专属建议中…',
];

const STATUS_TEXTS_UPLOAD = [
  '正在解析报告内容…',
  'AI 识别健康指标中…',
  '匹配最优益生菌配方…',
];

const TIMEOUT_MS = 20000;

Page({
  data: {
    statusText: '正在处理中…',
    countdown: 10,
    isTimeout: false,
  },

  _type: 'survey',
  _timer: null,
  _countdownTimer: null,
  _textIndex: 0,

  onLoad(options) {
    this._type = options.type || 'survey';
    this._startLoading();
  },

  onUnload() {
    this._clearTimers();
  },

  _clearTimers() {
    clearTimeout(this._timer);
    clearInterval(this._countdownTimer);
    clearInterval(this._textTimer);
  },

  _startLoading() {
    const texts = this._type === 'upload' ? STATUS_TEXTS_UPLOAD : STATUS_TEXTS_SURVEY;
    this._textIndex = 0;

    this.setData({
      statusText: texts[0],
      isTimeout: false,
      countdown: Math.ceil(TIMEOUT_MS / 1000),
    });

    // 文案轮换
    this._textTimer = setInterval(() => {
      this._textIndex = (this._textIndex + 1) % texts.length;
      this.setData({ statusText: texts[this._textIndex] });
    }, 3000);

    // 倒计时
    let remaining = Math.ceil(TIMEOUT_MS / 1000);
    this._countdownTimer = setInterval(() => {
      remaining -= 1;
      this.setData({ countdown: Math.max(0, remaining) });
    }, 1000);

    // 超时处理
    this._timer = setTimeout(() => {
      this._clearTimers();
      this.setData({ isTimeout: true });
    }, TIMEOUT_MS);

    // 发起实际请求
    this._fetchData();
  },

  async _fetchData() {
    const app = getApp();

    try {
      let recommendRes;

      if (this._type === 'survey') {
        const answers = app.globalData.pendingAnswers;
        recommendRes = await api.recommend(answers);
      } else {
        const file = app.globalData.pendingFile;
        recommendRes = await api.analyzeReport(file.path, file.name);
      }

      if (recommendRes.code !== 200) throw new Error(recommendRes.msg);
      const product = recommendRes.data;

      // 并发获取 AI 解释
      let explanation = '';
      try {
        const explainRes = await api.explain(product, app.globalData.userSummary || '');
        if (explainRes.code === 200) explanation = explainRes.data.explanation;
      } catch (e) {
        console.warn('AI 解释获取失败:', e);
      }

      // 存入全局
      app.globalData.recommendResult = recommendRes;
      app.globalData.aiExplanation = explanation;

      this._clearTimers();

      // 跳转结果页
      wx.redirectTo({ url: '/pages/result/result' });

    } catch (err) {
      this._clearTimers();
      console.error('请求失败:', err);
      this.setData({ isTimeout: true });
    }
  },

  onRetry() {
    this._startLoading();
  },

  onBackHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
