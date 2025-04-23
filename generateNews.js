const axios = require('axios');
const fs = require('fs');

const now = new Date();
const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = `${taiwanTime.toISOString().slice(0, 10)} ${taiwanTime.toTimeString().split(' ')[0]}`;

async function fetchNews() {
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=finance OR stock market OR banking OR interest rates&language=en&pageSize=5&sortBy=popularity&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;

    const newsList = articles.map((a, i) => ({
      index: i + 1,
      title: a.title,
      url: a.url
    }));

    console.log(`🕒 台灣時間：${timestamp}`);
    console.log('🔥 熱門金融新聞：\n');
    newsList.forEach((n) => {
      console.log(`${n.index}. ${n.title}`);
      console.log(`👉 ${n.url}`);
      console.log('--------------------');
    });

    const finalOutput = {
      generatedAt: timestamp,
      news: newsList
    };

    fs.writeFileSync('news.json', JSON.stringify(finalOutput, null, 2));
    console.log('✅ news.json 寫入成功！');
  } catch (err) {
    console.error('❌ 抓新聞失敗：', err.message);
  }
}

fetchNews();
