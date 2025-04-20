const fs = require('fs');

const news = {
  date: new Date().toISOString().slice(0, 10),
  news: [
    "微軟推出新一代 AI 晶片，挑戰 NVIDIA 地位",
    "美國 CPI 降溫，市場看好降息機率上升",
    "比特幣重返 7 萬美元，投資人信心顯著回升",
    "歐盟對蘋果廣告業務展開反壟斷調查",
    "台積電在德國設廠，強化歐洲供應鏈佈局"
  ]
};

fs.writeFileSync('news.json', JSON.stringify(news, null, 2), 'utf8');
console.log('✅ 已產生 news.json');
