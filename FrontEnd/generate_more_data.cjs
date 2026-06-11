const fs = require('fs');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const names = ["Reliance Agri", "ITC Limited", "Adani Wholesales", "Punjab Mandi", "Kisan Traders", "Green Organic", "Haryana Agro", "Delhi Fresh", "AgriSafe", "Garg Trading", "Local Mandi", "Adani Wilmar"];
const crops = ["Gehu", "Dhan", "Makka", "Bajra", "Jowar", "Soyabean", "Cotton", "Sugarcane", "Mustard", "Chana"];
const trends = ["up", "down", "stable"];
const statuses = ["Success", "Pending", "Cancelled"];

// 1. seller-predictions.json
const sellerPredictions = [];
for(let i=0; i<1000; i++) {
  const tr = trends[getRandomInt(0, trends.length-1)];
  const val = (Math.random() * 5).toFixed(1);
  const sign = tr === 'up' ? '+' : tr === 'down' ? '-' : '';
  sellerPredictions.push({
    crop: crops[getRandomInt(0, crops.length-1)] + ` Grade ${getRandomInt(1,5)}`,
    trend: tr,
    value: `${sign}${val}%`
  });
}
fs.writeFileSync('./public/api/seller-predictions.json', JSON.stringify(sellerPredictions, null, 2));

// 2. seller-sales.json
const sellerSales = [];
for(let i=0; i<1000; i++) {
  const amount = getRandomInt(10000, 500000).toLocaleString('en-IN');
  sellerSales.push({
    date: `${getRandomInt(1, 28)} Apr`,
    buyer: names[getRandomInt(0, names.length-1)],
    crop: crops[getRandomInt(0, crops.length-1)],
    amount: `₹${amount}`,
    status: statuses[getRandomInt(0, statuses.length-1)]
  });
}
fs.writeFileSync('./public/api/seller-sales.json', JSON.stringify(sellerSales, null, 2));
