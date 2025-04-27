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

// Webhook 處理
app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim().toLowerCase();

      if (text === 'news' || text === '新聞') {
        await sendFlexNews(event.replyToken);
      } else if (text === '幹') {
        await replyText(event.replyToken, '閉嘴白癡');
      } else if (/^[a-zA-Z]{1,5}$/.test(text)) {
        await sendStockPrice(event.replyToken, text.toUpperCase());
      } else {
        await replyText(event.replyToken, '請輸入「news」查新聞或股票代號查股價 📈');
      }
    }
  }
  res.sendStatus(200);
});

// 抓新聞資料並補圖片
async function fetchNewsWithImages() {
  const res = await axios.get('https://wellpen.github.io/lineNewsBotJSON/news.json');
  const newsList = res.data;

  const enrichedNews = await Promise.all(newsList.slice(0, 10).map(async (item) => {
    if (item.image && item.image.trim() !== '') {
      return item;
    } else {
      try {
        const page = await axios.get(item.link, { timeout: 5000 });
        const $ = cheerio.load(page.data);
        const ogImage = $('meta[property="og:image"]').attr('content');
        item.image = ogImage || 'https://fakeimg.pl/600x400/?text=News&font=lobster';
      } catch (error) {
        item.image = 'https://fakeimg.pl/600x400/?text=News&font=lobster';
      }
      return item;
    }
  }));

  return enrichedNews;
}

// 更美版 Flex Carousel 模板
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
          body: { backgroundColor: "#F5F5F5" }
        },
        hero: {
          type: "image",
          url: item.image,
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: `🗓️ ${item.date}`,
              size: "xs",
              color: "#888888",
              align: "start"
            },
            {
              type: "box",
              layout: "vertical",
              height: "100px",
              contents: [
                {
                  type: "text",
                  text: item.title,
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  maxLines: 3,
                  align: "center"
                }
              ]
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "🔗 查看新聞",
                uri: item.link
              },
              style: "primary",
              color: "#00C853",
              height: "sm",
              margin: "md"
            }
          ]
        }
      }))
    }
  };
}

// 發送 Flex 新聞
async function sendFlexNews(replyToken) {
  try {
    const newsList = await fetchNewsWithImages();
    const flexMessage = flexCarouselTemplate(newsList);
    await replyFlex(replyToken, flexMessage);
  } catch (error) {
    console.error('❌ Flex Carousel 回覆失敗:', error.response?.data || error.message);
    await replyText(replyToken, '⚠️ 無法取得新聞，請稍後再試');
  }
}

// 查詢股價 (RapidAPI)
async function fetchStockPrice(symbol) {
  try {
    const res = await axios.get(`https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?ticker=${symbol}&type=STOCKS`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
      }
    });

    const data = res.data.body.primaryData;
    if (data && data.lastSalePrice) {
      return `${symbol} 現價：${data.lastSalePrice} (變動 ${data.netChange}, ${data.percentageChange})`;
    } else {
      return `⚠️ 找不到股票代號：${symbol}`;
    }
  } catch (error) {
    console.error('❌ 抓股價失敗:', error.response?.data || error.message);
    return '⚠️ 無法取得股價，請稍後再試';
  }
}

// 發送股價純文字
async function sendStockPrice(replyToken, symbol) {
  const priceMessage = await fetchStockPrice(symbol);
  await replyText(replyToken, priceMessage);
}

// 回覆 Flex
async function replyFlex(replyToken, flexContent) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    { replyToken, messages: [flexContent] },
    { headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  console.log('✅ Flex Message 回覆成功');
}

// 回覆純文字
async function replyText(replyToken, message) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    { replyToken, messages: [{ type: 'text', text: message }] },
    { headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  console.log('✅ 純文字回覆成功');
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
