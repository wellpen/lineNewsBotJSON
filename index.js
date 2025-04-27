require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim().toLowerCase();
      if (text === 'news' || text === '新聞') {
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
        if (ogImage) {
          item.image = ogImage;
        } else {
          item.image = 'https://fakeimg.pl/600x400/?text=News&font=lobster';
        }
      } catch (error) {
        item.image = 'https://fakeimg.pl/600x400/?text=News&font=lobster';
      }
      return item;
    }
  }));

  return enrichedNews;
}

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
          url: item.image,
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: `🗓️ ${item.date}`,
              size: "sm",
              color: "#888888"
            },
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
              height: "100px"
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

async function sendFlexNews(replyToken) {
  try {
    const newsList = await fetchNewsWithImages();
    const flexMessage = flexCarouselTemplate(newsList);
    await replyFlex(replyToken, flexMessage);
  } catch (error) {
    console.error('❌ Flex Carousel回覆失敗：', error.response?.data || error);
    await replyText(replyToken, '⚠️ 無法取得新聞，請稍後再試');
  }
}

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

app.listen(PORT, () => {
  console.log(`🚀 LINE Bot server is running at http://localhost:${PORT}`);
});
