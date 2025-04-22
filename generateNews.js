require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// 🔸 台灣時間
const now = new Date();
const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const dateStr = taiwanTime.toISOString().slice(0, 10);
const timeStr = taiwanTime.toTimeString().split(' ')[0];

async function fetchNews() {
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=global economy OR central bank OR inflation&language=en&pageSize=10&sortBy=publishedAt&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;

    const newsList = articles.map((a, i) => ({
      index: i + 1,
      title: a.title,
      url: a.url
    }));

    // ✅ 印出日期 + 新聞標題
    console.log(`🕒 台灣時間：${dateStr} ${timeStr}`);
    console.log('📢 最新新聞：\n');
    newsList.forEach((n) => {
      console.log(`${n.index}. ${n.title}`);
      console.log(`👉 ${n.url}`);
      console.log('--------------------');
    });

    // ✅ 寫入 news.json 檔
    const finalOutput = {
      date: dateStr,
      time: timeStr,
      news: newsList
    };

    fs.writeFileSync('public/news.json', JSON.stringify(finalOutput, null, 2));
    console.log('✅ news.json 寫入成功！');
  } catch (err) {
    console.error('❌ 抓新聞失敗：', err.message);
  }
}

fetchNews();
