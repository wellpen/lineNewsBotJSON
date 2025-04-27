require('dotenv').config({ path: __dirname + '/.env' }); // 載入 .env

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;

// 除錯用
console.log('🧪 測試讀取 LINE_CHANNEL_TOKEN:', LINE_TOKEN);
console.log('🔍 所有載入的 env keys:', Object.keys(process.env).filter(key => key.startsWith('LINE')));

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    console.log('📥 收到來自 LINE 的 webhook：', JSON.stringify(req.body, null, 2));

    const events = req.body.events;
    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim();
            if (text === 'news') {
                const news = await fetchNews(); // 拿寫死的假新聞
                await replyToLine(event.replyToken, news);
            }else if(text === '幹'){
                const fuckMsg = await fuck(); 
                await replyToLine(event.replyToken, fuckMsg);
            }else {
                await replyToLine(event.replyToken, '請輸入「news」來獲取今日國際新聞 🗞️');
            }
        }
    }
    res.sendStatus(200);
});

// ✅ 新聞是隨機亂數跑出一則
// async function fetchNews() {
//     try {
//         const res = await axios.get('https://wellpen.github.io/lineNewsBotJSON/20250420NEWS.json'); // 可改為 news.json
//         const newsList = res.data.news;

//         if (!Array.isArray(newsList) || newsList.length === 0) {
//             return '⚠️ 目前沒有可顯示的新聞';
//         }

//         const random = newsList[Math.floor(Math.random() * newsList.length)];
//         return `📰 今日新聞：\n${random}`;
//     } catch (error) {
//         console.error('❌ 抓新聞失敗：', error.message);
//         return '⚠️ 無法取得新聞，請稍後再試';
//     }
// }
async function fetchNews() {
    try {
        const res = await axios.get('https://wellpen.github.io/lineNewsBotJSON/news.json'); // ← 改成你的 JSON 檔名
        const newsList = res.data;

        if (!Array.isArray(newsList) || newsList.length === 0) {
            return '⚠️ 目前沒有可顯示的新聞';
        }

        let message = '📰 今日新聞列表：\n\n';
        newsList.forEach((item, index) => {
            message += `${index + 1}. ${item}\n`;
        });

        return message;
    } catch (error) {
        console.error('❌ 抓新聞失敗：', error.message);
        return '⚠️ 無法取得新聞，請稍後再試';
    }
}

async function fuck() {
    const fakeNewsList = '閉嘴白癡';
    return fakeNewsList;
}

// ✅ 回覆 LINE 使用者
async function replyToLine(replyToken, message) {
    try {
        await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken,
                messages: [{ type: 'text', text: message }],
            },
            {
                headers: {
                    Authorization: `Bearer ${LINE_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('✅ 回覆成功');
    } catch (error) {
        console.error('❌ 回覆訊息失敗：', error.response?.data || error);
    }
}

// ✅ 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
