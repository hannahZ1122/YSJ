const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const multer = require('multer');
const config = require('./config');

const app = express();
app.use(express.json());

// CORS 支持（微信小程序需要）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const PRODUCTS_PATH = path.join(__dirname, 'data', 'products.json');
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');

// 临时文件上传目录
const upload = multer({
    dest: path.join(__dirname, 'uploads/'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 上限
});

// ─────────────────────────────────────────────
// 工具函数：调用云雾 API（OpenAI 兼容格式）
// ─────────────────────────────────────────────
function callYunwuAPI(messages, timeoutMs = config.AI_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model: config.YUNWU_MODEL,
            messages,
            max_tokens: 400,
            temperature: 0.7,
        });

        const url = new URL(config.YUNWU_BASE_URL + '/chat/completions');
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.YUNWU_API_KEY}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const timer = setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs);

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                clearTimeout(timer);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(parsed.error.message));
                    resolve(parsed.choices[0].message.content.trim());
                } catch (e) {
                    reject(new Error('AI_PARSE_ERROR'));
                }
            });
        });

        req.on('error', (e) => { clearTimeout(timer); reject(e); });
        req.write(body);
        req.end();
    });
}

// ─────────────────────────────────────────────
// 工具函数：根据报告 OCR 文本提取分数（关键词映射）
// ─────────────────────────────────────────────
const REPORT_KEYWORD_SCORES = [
    // 肠道相关
    { keywords: ['菌群失衡', '肠道菌群紊乱', '双歧杆菌偏低', '双歧杆菌减少'], scores: { P1: 30 } },
    { keywords: ['乳杆菌缺乏', '乳酸菌偏低', '乳酸杆菌不足'], scores: { P1: 25 } },
    { keywords: ['肠道炎症', '结肠炎', '肠易激'], scores: { P1: 20, P6: 10 } },
    { keywords: ['便秘', '排便困难', '大便干燥'], scores: { P1: 20 } },
    { keywords: ['腹泻', '腹痛', '肠痉挛'], scores: { P1: 15, P6: 10 } },
    // 代谢相关
    { keywords: ['血糖偏高', '胰岛素抵抗', '糖耐量', '高血糖'], scores: { P3: 25 } },
    { keywords: ['血脂异常', '甘油三酯', '胆固醇偏高'], scores: { P3: 20 } },
    { keywords: ['肥胖', '体重超标', 'BMI偏高', 'bmi偏高'], scores: { P3: 15 } },
    // 免疫相关
    { keywords: ['免疫力低下', '抵抗力弱', '淋巴细胞'], scores: { P6: 25 } },
    { keywords: ['过敏', '敏感体质', 'IgE升高', 'ige'], scores: { P6: 20 } },
    // 衰老相关
    { keywords: ['氧化应激', '自由基', '抗氧化'], scores: { P2: 25 } },
    { keywords: ['细胞老化', '端粒', '衰老指标'], scores: { P2: 20, P7: 10 } },
    // 睡眠/情绪
    { keywords: ['皮质醇偏高', '压力激素', '焦虑'], scores: { P5: 25 } },
    { keywords: ['睡眠障碍', '褪黑素', '失眠'], scores: { P5: 20 } },
    // 脑力
    { keywords: ['神经递质', '血清素', '多巴胺不足'], scores: { P4: 20 } },
    // 男性
    { keywords: ['睾酮偏低', '雄性激素', '前列腺'], scores: { P9: 25 } },
    // 女性
    { keywords: ['阴道菌群', '乳杆菌缺乏', 'pH偏高', '念珠菌'], scores: { P10: 25 } },
    // 长寿
    { keywords: ['AKK菌', '阿克曼', '长寿菌群'], scores: { P7: 30 } },
];

function extractScoresFromOCR(ocrText) {
    const text = ocrText.toLowerCase();
    let scoreBoard = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0, P7: 0, P9: 0, P10: 0 };

    REPORT_KEYWORD_SCORES.forEach(rule => {
        rule.keywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                for (let pid in rule.scores) {
                    if (scoreBoard.hasOwnProperty(pid)) {
                        scoreBoard[pid] += rule.scores[pid];
                    }
                }
            }
        });
    });

    return scoreBoard;
}

// ─────────────────────────────────────────────
// 原有接口：POST /api/recommend
// ─────────────────────────────────────────────
app.post('/api/recommend', (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ code: 400, msg: '数据格式错误' });
        }

        const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

        let scoreBoard = {};
        products.forEach(p => scoreBoard[p.id] = 0);

        answers.forEach(item => {
            if (item.scores) {
                for (let pid in item.scores) {
                    if (scoreBoard.hasOwnProperty(pid)) {
                        scoreBoard[pid] += item.scores[pid];
                    }
                }
            }
        });

        let winnerId = Object.keys(scoreBoard).reduce((a, b) =>
            scoreBoard[a] >= scoreBoard[b] ? a : b
        );

        const recommendation = products.find(p => p.id === winnerId);

        console.log('--- 问卷推荐记录 ---');
        console.log('得分看板:', scoreBoard);
        console.log('最终胜出:', winnerId);

        res.json({
            code: 200,
            msg: '评估完成',
            data: recommendation,
            all_scores: scoreBoard,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 500, msg: '计算引擎故障' });
    }
});

// ─────────────────────────────────────────────
// 新接口：POST /api/explain
// 接收推荐产品 + 用户摘要，调用 AI 生成个性化解释
// ─────────────────────────────────────────────
app.post('/api/explain', async (req, res) => {
    try {
        const { product, userSummary } = req.body;
        if (!product) {
            return res.status(400).json({ code: 400, msg: '缺少产品信息' });
        }

        const prompt = `你是一位专业的肠道健康顾问，根据用户评估结果撰写一段个性化解读。

推荐产品：${product.name}
核心菌株：${(product.strains || []).join('、')}
用户情况：${userSummary || '综合健康需求评估'}

请严格按照以下三段逻辑写，总字数 100~140 字，不分段、连续输出：
① 用户现状——用 1~2 句点出用户当前的身体状态或核心诉求（不重复用户自己都知道的废话，直接说影响）
② 菌株匹配——说明推荐配方中哪些关键菌株针对上述问题有帮助，以及作用方向（不堆砌菌名，点到为止）
③ 生活建议——给一句具体可执行的日常建议，与产品形成协同

要求：语气专业但不生硬；禁止使用"治疗""治愈""疗效""临床"等医疗用语；不重复产品名称超过一次；不用感叹号。`;

        let explanation;
        try {
            explanation = await callYunwuAPI([
                { role: 'system', content: '你是专业的益生菌健康顾问，用简洁亲切的中文回答。' },
                { role: 'user', content: prompt },
            ]);
        } catch (aiErr) {
            console.warn('AI 调用失败，使用模板兜底:', aiErr.message);
            // 兜底模板文案
            explanation = `您的评估结果显示，${userSummary || '当前身体状态存在一定的微生态失衡'}，需要有针对性地补充特定益生菌群落。${product.name}中的${(product.strains || []).slice(0, 2).join('与')}等核心菌株，能定向调节肠道微环境，从根源改善相关问题。建议餐后30分钟随温水服用，同时保持规律作息，持续4~8周效果更稳定。`;
        }

        res.json({
            code: 200,
            msg: '解释生成完成',
            data: { explanation },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 500, msg: 'AI 解释服务故障' });
    }
});

// ─────────────────────────────────────────────
// 新接口：POST /api/analyze-report
// 接收上传的图片/PDF，用 AI Vision 提取关键词，返回推荐
// ─────────────────────────────────────────────
app.post('/api/analyze-report', upload.single('file'), async (req, res) => {
    const filePath = req.file ? req.file.path : null;

    try {
        if (!req.file) {
            return res.status(400).json({ code: 400, msg: '请上传文件' });
        }

        const mimeType = req.file.mimetype;
        const isImage = mimeType.startsWith('image/');
        const isPDF = mimeType === 'application/pdf';

        if (!isImage && !isPDF) {
            return res.status(400).json({ code: 400, msg: '仅支持图片或 PDF 格式' });
        }

        let ocrText = '';

        if (isImage) {
            // 将图片转 base64，调用 AI Vision 识别
            const imageData = fs.readFileSync(filePath);
            const base64Image = imageData.toString('base64');
            const dataURL = `data:${mimeType};base64,${base64Image}`;

            try {
                ocrText = await callYunwuAPI([
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: { url: dataURL },
                            },
                            {
                                type: 'text',
                                text: '这是一份肠道或健康体检报告。请提取报告中所有与肠道菌群、免疫、代谢、激素、过敏、睡眠相关的检测结论和数值，原文输出，不要分析。',
                            },
                        ],
                    },
                ], 15000);
            } catch (visionErr) {
                console.warn('Vision OCR 失败:', visionErr.message);
                ocrText = ''; // 降级处理
            }
        } else if (isPDF) {
            // PDF 暂不支持 vision，提示用户转为图片
            // 未来可接入腾讯云 OCR 或 pdf-parse
            ocrText = '';
        }

        // 删除临时文件
        fs.unlink(filePath, () => {});

        // 基于 OCR 文本打分
        const scoreBoard = extractScoresFromOCR(ocrText);
        const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

        // 确保所有产品 ID 都在 scoreBoard 中
        products.forEach(p => { if (!scoreBoard.hasOwnProperty(p.id)) scoreBoard[p.id] = 0; });

        const hasAnyScore = Object.values(scoreBoard).some(v => v > 0);

        let winnerId;
        if (hasAnyScore) {
            winnerId = Object.keys(scoreBoard).reduce((a, b) =>
                scoreBoard[a] >= scoreBoard[b] ? a : b
            );
        } else {
            // 报告无法识别有效信息，默认推荐肠道产品
            winnerId = 'P1';
        }

        const recommendation = products.find(p => p.id === winnerId);

        console.log('--- 报告分析记录 ---');
        console.log('OCR 文本长度:', ocrText.length);
        console.log('得分看板:', scoreBoard);
        console.log('推荐产品:', winnerId);

        res.json({
            code: 200,
            msg: hasAnyScore ? '报告分析完成' : '报告识别信息有限，已推荐基础方案',
            data: recommendation,
            all_scores: scoreBoard,
            ocr_success: hasAnyScore,
        });

    } catch (err) {
        if (filePath) fs.unlink(filePath, () => {});
        console.error(err);
        res.status(500).json({ code: 500, msg: '报告分析服务故障' });
    }
});

// ─────────────────────────────────────────────
// 提供问卷数据（小程序可选择直接加载）
// ─────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));
        res.json({ code: 200, data });
    } catch (err) {
        res.status(500).json({ code: 500, msg: '数据加载失败' });
    }
});

app.listen(config.PORT, () => console.log(`🚀 服务已在 ${config.PORT} 端口就位`));
