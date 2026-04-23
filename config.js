// 配置文件：敏感信息通过环境变量注入，不要在此文件中硬编码密钥
// 本地开发：在项目根目录创建 .env 文件，通过 dotenv 加载
// 腾讯云部署：在云函数/容器环境变量中配置

require('dotenv').config(); // 本地开发读取 .env 文件，生产环境会忽略

module.exports = {
  // 云雾 AI API 配置（OpenAI 兼容格式）
  YUNWU_API_KEY: process.env.YUNWU_API_KEY || '',
  YUNWU_BASE_URL: process.env.YUNWU_BASE_URL || 'https://yunwu.ai/v1',
  YUNWU_MODEL: process.env.YUNWU_MODEL || 'gpt-4o-mini',

  // 服务配置
  PORT: process.env.PORT || 3000,

  // AI 解释超时（毫秒）
  AI_TIMEOUT_MS: 8000,
};

