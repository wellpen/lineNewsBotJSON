const axios = require('axios');
const fs = require('fs');

const now = new Date();
const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = `${taiwanTime.toISOString().slice(0, 10)} ${taiwanTime.toTimeString().split(' ')[0]}`;

async function fetchNews() {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error('❌ NEWS_API_KEY 未設定，請檢查 .env 檔或環境變數');
    return;
  }

  const url = `https://newsapi.org/v2/everything?q=finance&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;            
               

  console.log('🛰️ API URL:', url); // ← 印出實際請求網址

  try {
    const response = await axios.get(url);
    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      console.warn('⚠️ 查無熱門金融新聞，請檢查關鍵字或 API 限制');
      fs.writeFileSync('news.json', JSON.stringify({
        generatedAt: timestamp,
        news: []
      }, null, 2));
      return;
    }

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
