const axios = require('axios');
const fs = require('fs');

const now = new Date();
const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = `${taiwanTime.toISOString().slice(0, 10)} ${taiwanTime.toTimeString().split(' ')[0]}`;

async function fetchTopFinanceNews() {
  const apiKey = process.env.NEWS_API_KEY;

  const sources = 'bloomberg,reuters,financial-times,the-wall-street-journal,cnbc';
  const query = 'finance OR economy OR stock market OR central bank OR interest rates';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sources=${sources}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      console.warn('⚠️ 查無主流金融新聞資料');
    }

    const newsList = articles.map((a, i) => ({
      index: i + 1,
      title: a.title,
      url: a.url
    }));

    console.log(`🕒 台灣時間：${timestamp}`);
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

fetchTopFinanceNews();
