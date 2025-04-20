const fs = require('fs');

const now = new Date();
const dateStr = now.toISOString().slice(0, 10);
const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

const news = {
  date: dateStr,
  time: timeStr,
  news: [
    `🕒 測試產生時間為：${dateStr} ${timeStr}`,
    '微軟推出新一代 AI 晶片',
    '台積電宣布設廠德國，強化歐洲供應鏈',
    '比特幣重新站上 7 萬美元',
    '美國 CPI 降溫，市場預期降息近了'
  ]
};

fs.writeFileSync('news.json', JSON.stringify(news, null, 2), 'utf8');
console.log('✅ 已產生 news.json，內含時間戳：', `${dateStr} ${timeStr}`);
