// 載入環境變數
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

app.use(bodyParser.json());

// webhook主入口
app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim().toLowerCase();

      if (text === 'news' || text === '新聞') {
        await handleNews(event.replyToken);
      } else if (text === '幹') {
        await replyText(event.replyToken, '閉嘴白癡');
      } else if (/^[a-zA-Z]{1,5}$/.test(text)) {
        await handleStock(event.replyToken, text.toUpperCase());
      } else {
        await replyText(event.replyToken, '請輸入「news」查新聞或輸入股票代號查詢股價 📈');
      }
    }
  }
  res.sendStatus(200);
});

// 取得新聞 + 圖片
async function fetchNews() {
  try {
    const { data } = await axios.get('https://wellpen.github.io/lineNewsBotJSON/news.json');
    return await Promise.all(
      data.slice(0, 10).map(async (item) => {
        if (!item.image) {
          try {
            const res = await axios.get(item.link, { timeout: 5000 });
            const $ = cheerio.load(res.data);
            item.image = $('meta[property="og:image"]').attr('content') || 'https://fakeimg.pl/600x400/?text=News&font=lobster';
          } catch {
            item.image = 'https://fakeimg.pl/600x400/?text=News&font=lobster';
          }
        }
        return item;
      })
    );
  } catch (error) {
    console.error('❌ 抓新聞失敗：', error.message);
    throw error;
  }
}

// Flex訊息格式
function createNewsFlex(newsList) {
  return {
    type: "flex",
    altText: "📰 今日新聞",
    contents: {
      type: "carousel",
      contents: newsList.map(news => ({
        type: "bubble",
        size: "mega",
        hero: {
          type: "image",
          url: news.image,
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            { type: "text", text: `🗓️ ${news.date}`, size: "sm", color: "#888888" },
            { type: "text", text: news.title, weight: "bold", size: "md", wrap: true, maxLines: 3 },
            {
              type: "button",
              action: { type: "uri", label: "🔗 查看新聞", uri: news.link },
              style: "primary",
              margin: "md"
            }
          ]
        }
      }))
    }
  };
}

// 取得股價
async function fetchStock(symbol) {
  try {
    const { data } = await axios.get(`https://yahoo-finance-real-time1.p.rapidapi.com/stock/v2/get-summary?symbol=${symbol}&region=US`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'yahoo-finance-real-time1.p.rapidapi.com'
      }
    });
    const quote = data.price;
    if (quote) {
      return `${quote.longName || symbol} (${symbol})\n現價：$${quote.regularMarketPrice.raw} ${quote.currency || 'USD'}`;
    } else {
      return `⚠️ 找不到股票代號：${symbol}`;
    }
  } catch (error) {
    console.error('❌ 抓股價失敗：', error.response?.data || error.message);
    return '⚠️ 無法取得股價，請稍後再試';
  }
}

// 送出Flex新聞
async function handleNews(replyToken) {
  try {
    const newsList = await fetchNews();
    const flex = createNewsFlex(newsList);
    await replyFlex(replyToken, flex);
  } catch {
    await replyText(replyToken, '⚠️ 無法取得新聞，請稍後再試');
  }
}

// 送出股價訊息
async function handleStock(replyToken, symbol) {
  const message = await fetchStock(symbol);
  await replyText(replyToken, message);
}

// 回覆Flex
async function replyFlex(replyToken, flexContent) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [flexContent]
  }, {
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' }
  });
}

// 回覆文字
async function replyText(replyToken, text) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [{ type: 'text', text }]
  }, {
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' }
  });
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
