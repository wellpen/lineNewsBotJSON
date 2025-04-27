// 載入環境變數
require('dotenv').config({ path: __dirname + '/.env' });

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

// ✅ 產生 Carousel Flex 結構
function flexCarouselTemplate(newsList) {
    return {
        type: "flex",
        altText: "📰 今日新聞",
        contents: {
            type: "carousel",
            contents: newsList.map(item => ({
                type: "bubble",
                size: "mega",
                styles: {
                    body: {
                        backgroundColor: "#F5F5F5"
                    }
                },
                hero: {
                    type: "image",
                    url: "https://fakeimg.pl/600x400/?text=News&font=lobster",
                    size: "full",
                    aspectRatio: "16:9",
                    aspectMode: "cover"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm", // ✅ 加小一點間距
                    contents: [
                        {
                            type: "text",
                            text: item.title,
                            weight: "bold",
                            size: "lg",
                            wrap: true,
                            maxLines: 3 // ✅ 只用這個，不加 height
                        },
                        {
                            type: "button",
                            action: {
                                type: "uri",
                                label: "🔗 查看新聞",
                                uri: item.link
                            },
                            style: "primary",
                            margin: "md" // ✅ 統一按鈕位置
                        }
                    ]
                }
            }))
        }
    };
}


// ✅ 專門傳送 Flex新聞Carousel
async function sendFlexNews(replyToken) {
    try {
        const res = await axios.get('https://wellpen.github.io/lineNewsBotJSON/news.json');
        const newsList = res.data;

        if (!Array.isArray(newsList) || newsList.length === 0) {
            await replyText(replyToken, '⚠️ 目前沒有可顯示的新聞');
            return;
        }

        // 最多只拿10則新聞
        const topNews = newsList.slice(0, 10);

        const flexMessage = flexCarouselTemplate(topNews);

        await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken,
                messages: [flexMessage]
            },
            {
                headers: {
                    Authorization: `Bearer ${LINE_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log('✅ Flex Carousel回覆成功');
    } catch (error) {
        console.error('❌ Flex Carousel回覆失敗：', error.response?.data || error);
        await replyText(replyToken, '⚠️ 無法取得新聞，請稍後再試');
    }
}

// ✅ 傳送文字訊息（備用）
async function replyText(replyToken, text) {
    await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
            replyToken,
            messages: [{ type: "text", text }]
        },
        {
            headers: {
                Authorization: `Bearer ${LINE_TOKEN}`,
                'Content-Type': 'application/json',
            }
        }
    );
}

// ✅ 處理 webhook 請求
app.post('/webhook', async (req, res) => {
    console.log('📥 收到來自 LINE 的 webhook：', JSON.stringify(req.body, null, 2));

    const events = req.body.events;
    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim();

            if (text === 'news') {
                await sendFlexNews(event.replyToken);
            } else if (text === '幹') {
                await replyText(event.replyToken, '閉嘴白癡');
            } else {
                await replyText(event.replyToken, '請輸入「news」來獲取今日國際新聞 🗞️');
            }
        }
    }
    res.sendStatus(200);
});

// ✅ 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
