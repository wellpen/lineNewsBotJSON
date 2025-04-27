require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;

// 除錯資訊
console.log('🧪 測試讀取 LINE_CHANNEL_TOKEN:', LINE_TOKEN);
console.log('🔍 所有載入的 env keys:', Object.keys(process.env).filter(key => key.startsWith('LINE')));

app.use(bodyParser.json());

// 處理 LINE webhook
app.post('/webhook', async (req, res) => {
  console.log('📥 收到來自 LINE 的 webhook：', JSON.stringify(req.body, null, 2));

  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim().toLowerCase();
      if (text === 'news' || text === '新聞') {
        await sendFlexNews(event.replyToken);
      } else {
        await replyText(event.replyToken, '請輸入「news」來獲取今日國際新聞 🗞️');
      }
    }
  }

  res.sendStatus(200);
});

// 產生 Flex Carousel
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
          url: item.image && item.image.trim() !== ''
            ? item.image
            : "https://fakeimg.pl/600x400/?text=News&font=lobster",
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: item.title,
                  weight: "bold",
                  size: "lg",
                  wrap: true,
                  maxLines: 3
                }
              ],
              height: "100px" // ✅ 標題區固定高度
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "🔗 查看新聞",
                uri: item.link
              },
              style: "primary",
              margin: "md"
            }
          ]
        }
      }))
    }
  };
}

// 取得新聞資料並發送 Flex Message
async function sendFlexNews(replyToken) {
  try {
    const res = await axios.get('https://wellpen.github.io/lineNewsBotJSON/news.json');
    const newsList = res.data;

    if (!Array.isArray(newsList) || newsList.length === 0) {
      await replyText(replyToken, '⚠️ 目前沒有可顯示的新聞');
      return;
    }

    // 只取前10則
    const top10 = newsList.slice(0, 10);

    const flexMessage = flexCarouselTemplate(top10);
    await replyFlex(replyToken, flexMessage);
  } catch (error) {
    console.error('❌ Flex Carousel回覆失敗：', error.response?.data || error);
    await replyText(replyToken, '⚠️ 無法取得新聞，請稍後再試');
  }
}

// 回覆 Flex
async function replyFlex(replyToken, flexContent) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [flexContent]
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  console.log('✅ Flex Message 回覆成功');
}

// 回覆純文字
async function replyText(replyToken, message) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [{ type: 'text', text: message }]
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  console.log('✅ 純文字回覆成功');
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
