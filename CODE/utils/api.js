// 统一 API 调用层
// 开发时关闭微信小程序的域名校验（开发者工具 → 详情 → 不校验合法域名）

const BASE_URL = 'http://124.221.80.235:3000';

/**
 * 通用请求封装
 */
function request(method, path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      timeout: 15000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.msg || `HTTP ${res.statusCode}`));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

/**
 * A路径：提交问卷答案，获取推荐
 * @param {Array} answers - [{scores: {P1: 15, ...}}, ...]
 */
function recommend(answers) {
  return request('POST', '/api/recommend', { answers });
}

/**
 * 获取 AI 解释文案
 * @param {Object} product - 推荐产品对象
 * @param {string} userSummary - 用户情况简述
 */
function explain(product, userSummary) {
  return request('POST', '/api/explain', { product, userSummary });
}

/**
 * B路径：上传报告文件，获取推荐
 * @param {string} filePath - wx.chooseMedia 返回的临时文件路径
 * @param {string} fileName - 文件名
 */
function analyzeReport(filePath, fileName) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}/api/analyze-report`,
      filePath,
      name: 'file',
      header: {},
      formData: { fileName },
      timeout: 30000,
      success(res) {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(data?.msg || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('响应解析失败'));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传失败'));
      },
    });
  });
}

module.exports = { recommend, explain, analyzeReport, BASE_URL };
