const fs = require('fs');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const names = ["Reliance Agri", "ITC Limited", "Adani Wholesales", "Punjab Mandi", "Kisan Traders", "Green Organic", "Haryana Agro", "Delhi Fresh", "AgriSafe", "Garg Trading"];
const crops = ["Gehu", "Dhan", "Makka", "Bajra", "Jowar", "Soyabean", "Cotton", "Sugarcane", "Mustard", "Chana"];
const locations = ["Punjab", "Haryana", "Delhi", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Gujarat"];
const trends = ["up", "down", "stable"];
const statuses = ["Delivered", "Shipped", "Processing"];

// 1. buyers_data.json (For Seller Page search)
const buyersData = [];
for(let i=0; i<1000; i++) {
  buyersData.push({
    name: names[getRandomInt(0, names.length-1)] + (i > 10 ? ` ${i}` : ''),
    crops: crops[getRandomInt(0, crops.length-1)],
    rate: getRandomInt(1500, 3000).toString(),
    location: locations[getRandomInt(0, locations.length-1)],
    rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1)
  });
}
fs.writeFileSync('./src/assets/buyers_data.json', JSON.stringify(buyersData, null, 2));

// 2. buyer-purchases.json
const purchases = [];
for(let i=0; i<1000; i++) {
  const q = getRandomInt(10, 100);
  const rate = getRandomInt(1500, 3000);
  purchases.push({
    d: `${getRandomInt(1, 28)} Apr`,
    s: names[getRandomInt(0, names.length-1)],
    i: crops[getRandomInt(0, crops.length-1)],
    w: `${q}q`,
    a: q * rate,
    st: statuses[getRandomInt(0, statuses.length-1)]
  });
}
fs.writeFileSync('./public/api/buyer-purchases.json', JSON.stringify(purchases, null, 2));

// 3. market-intel.json
const marketIntel = [];
for(let i=0; i<1000; i++) {
  const p = getRandomInt(1500, 3500);
  marketIntel.push({
    n: crops[getRandomInt(0, crops.length-1)] + ` Grade ${getRandomInt(1,5)}`,
    p: `₹${p}/q`,
    mandi: `₹${p + getRandomInt(-200, 200)}/q`,
    tr: trends[getRandomInt(0, trends.length-1)]
  });
}
fs.writeFileSync('./public/api/market-intel.json', JSON.stringify(marketIntel, null, 2));

// 4. seller-market-intel.json
const sellerMarketIntel = [];
for(let i=0; i<1000; i++) {
  const my = getRandomInt(1500, 3500);
  sellerMarketIntel.push({
    name: crops[getRandomInt(0, crops.length-1)] + ` Mix ${i}`,
    my: my,
    mandi: my + getRandomInt(-150, 150)
  });
}
fs.writeFileSync('./public/api/seller-market-intel.json', JSON.stringify(sellerMarketIntel, null, 2));
