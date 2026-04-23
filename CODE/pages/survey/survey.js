const api = require('../../utils/api');
const ALL_QUESTIONS = require('../../utils/questions.js');

Page({
  data: {
    currentIndex: 0,        // 在可见题目列表中的索引
    total: 0,               // 当前可见题目总数（动态，会随性别更新）
    currentQ: null,
    selectedMap: {},        // { 0: true } 控制选中样式
    selectedCount: 0,
    progressPct: 0,
    isLast: false,

    // number_input 专用
    numberInputValues: {},  // { height: '168', weight: '62' }
    numberInputValid: false,
  },

  // ── JS 侧私有状态 ──────────────────────────────────────────
  _visibleQuestions: [],    // 过滤后的题目列表（随性别动态更新）
  _selectedIndices: [],
  _answerMap: {},           // { questionId: { selectedIndices, scores, ... } }
  _gender: 'unknown',       // 'male' | 'female' | 'unknown'

  // ── 生命周期 ──────────────────────────────────────────────
  onLoad() {
    // 初始时不知道性别，展示所有非性别专属题目
    this._rebuildVisibleQuestions();
    this._renderQuestion(0);
  },

  // ── 核心：重建可见题目列表 ────────────────────────────────
  _rebuildVisibleQuestions() {
    const gender = this._gender;
    this._visibleQuestions = ALL_QUESTIONS.filter(q => {
      // Q1 目标选项里含性别专属选项，由 wxml 层过滤显示；题目本身对所有人展示
      const qGender = q.showForGender || 'all';
      if (qGender === 'male')   return gender === 'male';
      if (qGender === 'female') return gender === 'female';
      return true; // 'all' 或未指定
    });
    this.setData({ total: this._visibleQuestions.length });
  },

  // ── 渲染指定索引的题目 ───────────────────────────────────
  _renderQuestion(index) {
    const q = this._visibleQuestions[index];
    if (!q) return;

    const savedAnswer = this._answerMap[q.id];

    if (q.type === 'number_input') {
      const savedValues = (savedAnswer && savedAnswer.inputValues) || {};
      this.setData({
        currentIndex: index,
        currentQ: q,
        selectedMap: {},
        selectedCount: 0,
        progressPct: Math.round((index / this._visibleQuestions.length) * 100),
        isLast: index === this._visibleQuestions.length - 1,
        numberInputValues: savedValues,
        numberInputValid: this._checkNumberInputValid(q, savedValues),
      });
      return;
    }

    // single / multi
    const savedIndices = (savedAnswer && savedAnswer.selectedIndices) || [];
    const selectedMap = {};
    savedIndices.forEach(i => { selectedMap[i] = true; });
    this._selectedIndices = [...savedIndices];

    // 对于 Q1，过滤掉不该展示的性别专属选项
    const filteredOptions = this._filterOptionsForGender(q);

    this.setData({
      currentIndex: index,
      currentQ: Object.assign({}, q, { options: filteredOptions }),
      selectedMap,
      selectedCount: savedIndices.length,
      progressPct: Math.round((index / this._visibleQuestions.length) * 100),
      isLast: index === this._visibleQuestions.length - 1,
      numberInputValues: {},
      numberInputValid: false,
    });
  },

  // 选项按性别过滤（Q1 对所有人展示全部选项，无需过滤）
  _filterOptionsForGender(q) {
    return q.options;
  },

  // ── 选项点击（single / multi）───────────────────────────
  onOptionTap(e) {
    const idx = e.currentTarget.dataset.index;
    const { currentQ, selectedMap } = this.data;
    const newMap = Object.assign({}, selectedMap);

    if (currentQ.type === 'single') {
      Object.keys(newMap).forEach(k => { newMap[k] = false; });
      newMap[idx] = true;
      this._selectedIndices = [idx];
      this.setData({ selectedMap: newMap, selectedCount: 1 });
    } else {
      // multi
      if (newMap[idx]) {
        newMap[idx] = false;
        this._selectedIndices = this._selectedIndices.filter(i => i !== idx);
      } else {
        if (this._selectedIndices.length >= currentQ.max) {
          wx.showToast({ title: `最多选 ${currentQ.max} 项`, icon: 'none' });
          return;
        }
        newMap[idx] = true;
        this._selectedIndices.push(idx);
      }
      this.setData({ selectedMap: newMap, selectedCount: this._selectedIndices.length });
    }
  },

  // ── number_input 输入处理 ──────────────────────────────
  onNumberInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const { currentQ } = this.data;

    const newValues = Object.assign({}, this.data.numberInputValues, { [field]: value });
    const valid = this._checkNumberInputValid(currentQ, newValues);
    this.setData({ numberInputValues: newValues, numberInputValid: valid });
  },

  _checkNumberInputValid(q, values) {
    if (!q || !q.fields) return false;
    return q.fields.every(f => {
      const v = parseFloat(values[f.key]);
      return !isNaN(v) && v >= f.min && v <= f.max;
    });
  },

  // ── 「继续」按钮 ─────────────────────────────────────────
  onNext() {
    const { currentQ, numberInputValues } = this.data;

    if (currentQ.type === 'number_input') {
      if (!this.data.numberInputValid) {
        wx.showToast({ title: '请正确填写身高和体重', icon: 'none' });
        return;
      }
      this._saveNumberInputAndAdvance(currentQ, numberInputValues);
      return;
    }

    if (this._selectedIndices.length === 0) return;
    if (currentQ.type === 'multi' && this._selectedIndices.length < currentQ.min) {
      wx.showToast({ title: `请至少选 ${currentQ.min} 项`, icon: 'none' });
      return;
    }
    this._saveAndAdvance();
  },

  // ── 上一题 ───────────────────────────────────────────────
  onPrev() {
    const { currentIndex } = this.data;
    if (currentIndex === 0) return;
    this._renderQuestion(currentIndex - 1);
  },

  // ── 保存并前进（选项类题目）─────────────────────────────
  _saveAndAdvance() {
    const { currentIndex, currentQ } = this.data;
    const selectedIndices = [...this._selectedIndices];
    const options = currentQ.options; // 已经是过滤后的

    // 合并得分
    const mergedScores = {};
    selectedIndices.forEach(idx => {
      const option = options[idx];
      if (option && option.scores) {
        for (let pid in option.scores) {
          mergedScores[pid] = (mergedScores[pid] || 0) + option.scores[pid];
        }
      }
    });

    this._answerMap[currentQ.id] = { selectedIndices, scores: mergedScores };

    // 特殊处理：Q2 性别确定后，重建可见题目列表
    if (currentQ.id === 'q2_gender') {
      const selectedOpt = currentQ.options[selectedIndices[0]];
      if (selectedOpt) {
        if (selectedOpt.text === '男') this._gender = 'male';
        else if (selectedOpt.text === '女') this._gender = 'female';
        else this._gender = 'unknown';
      }
      this._rebuildVisibleQuestions();
      // 重新找到 q2_gender 在新列表里的索引
      const newIdx = this._visibleQuestions.findIndex(q => q.id === 'q2_gender');
      const nextIdx = (newIdx >= 0 ? newIdx : currentIndex) + 1;
      if (nextIdx < this._visibleQuestions.length) {
        this._renderQuestion(nextIdx);
      } else {
        this._submit();
      }
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < this._visibleQuestions.length) {
      this._renderQuestion(nextIndex);
    } else {
      this._submit();
    }
  },

  // ── 保存并前进（number_input 题目）──────────────────────
  _saveNumberInputAndAdvance(q, values) {
    const { currentIndex } = this.data;

    const h = parseFloat(values.height);
    const w = parseFloat(values.weight);
    const bmiRaw = w / ((h / 100) * (h / 100));
    const bmi = Math.round(bmiRaw * 10) / 10;

    let scores = {};
    if (bmi < 18.5)      scores = { P1: 10 };
    else if (bmi < 24.0) scores = { P7: 3 };
    else if (bmi < 28.0) scores = { P3: 12 };
    else                 scores = { P3: 22 };

    this._answerMap[q.id] = { inputValues: values, bmi, scores };

    const nextIndex = currentIndex + 1;
    if (nextIndex < this._visibleQuestions.length) {
      this._renderQuestion(nextIndex);
    } else {
      this._submit();
    }
  },

  // ── 提交 ─────────────────────────────────────────────────
  _submit() {
    // 将 answerMap 转换为 answers 数组（仅含 scores 字段）
    const answers = this._visibleQuestions
      .map(q => this._answerMap[q.id])
      .filter(a => a && a.scores)
      .map(a => ({ scores: a.scores }));

    const app = getApp();
    app.globalData.fromPath = 'survey';
    app.globalData.userSummary = this._buildUserSummary();
    app.globalData.pendingAnswers = answers;
    wx.redirectTo({ url: '/pages/loading/loading?type=survey' });
  },

  // ── 构建用户摘要（供 AI 解读使用）───────────────────────
  _buildUserSummary() {
    const genderAns = this._answerMap['q2_gender'];
    const ageAns    = this._answerMap['q3_age'];
    const goalAns   = this._answerMap['q1_goal'];
    const bodyAns   = this._answerMap['q4_body'];

    const genderQ   = ALL_QUESTIONS.find(q => q.id === 'q2_gender');
    const ageQ      = ALL_QUESTIONS.find(q => q.id === 'q3_age');
    const goalQ     = ALL_QUESTIONS.find(q => q.id === 'q1_goal');

    const genderText = (genderAns && genderQ)
      ? (genderQ.options[genderAns.selectedIndices[0]] || {}).text || ''
      : '';
    const ageText = (ageAns && ageQ)
      ? (ageQ.options[ageAns.selectedIndices[0]] || {}).text || ''
      : '';
    const goalTexts = (goalAns && goalQ)
      ? goalAns.selectedIndices.map(i => (goalQ.options[i] || {}).text || '').filter(Boolean).join('、')
      : '';
    const bmiText = bodyAns ? `BMI ${bodyAns.bmi}` : '';

    return `性别：${genderText}，年龄：${ageText}，${bmiText}，主要诉求：${goalTexts}`;
  },
});
