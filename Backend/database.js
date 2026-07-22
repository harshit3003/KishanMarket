const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const fs = require('fs');

const dataStoreDir = path.join(__dirname, 'server_storage');
if (!fs.existsSync(dataStoreDir)) {
  fs.mkdirSync(dataStoreDir, { recursive: true });
}

function saveTableToFile(filename, data) {
  try {
    fs.writeFileSync(path.join(dataStoreDir, filename), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to save ${filename}:`, e);
  }
}

function loadTableFromFile(filename) {
  try {
    const filePath = path.join(dataStoreDir, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Failed to load ${filename}:`, e);
  }
  return [];
}

// Initialize database connection
async function getDbConnection() {
  return open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
}

// Create tables if they don't exist
async function initDb() {
  const db = await getDbConnection();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      weight TEXT NOT NULL,
      rate TEXT NOT NULL,
      seller TEXT NOT NULL,
      loc TEXT NOT NULL,
      seller_mobile TEXT,
      status TEXT DEFAULT 'active'
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS BuyerRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop TEXT NOT NULL,
      budget TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      buyer_mobile TEXT NOT NULL,
      buyer_location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_mobile TEXT NOT NULL,
      crop_id INTEGER NOT NULL,
      UNIQUE(buyer_mobile, crop_id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL,
      crop_name TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_mobile TEXT NOT NULL,
      seller_name TEXT NOT NULL,
      seller_mobile TEXT,
      asking_rate TEXT NOT NULL,
      bid_rate TEXT NOT NULL,
      weight TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safely patch existing Users table if missing user_id column
  try { await db.exec(`ALTER TABLE Users ADD COLUMN user_id TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN seller_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN status TEXT DEFAULT 'active';`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN soldDate TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyerName TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN distance REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN transportCost REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN netProfit REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyer_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE BuyerRequests ADD COLUMN buyer_name TEXT;`); } catch(e) {}

  // Hydrate SQLite database from server_storage files on startup
  try {
    const savedUsers = loadTableFromFile('users.json');
    for (let idx = 0; idx < savedUsers.length; idx++) {
      const u = savedUsers[idx];
      const genId = u.user_id || (u.role === 'seller' ? `KM-S-${1000 + idx + 1}` : `KM-B-${1000 + idx + 1}`);
      await db.run(
        'INSERT OR IGNORE INTO Users (user_id, name, mobile, location, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [genId, u.name, u.mobile, u.location || '', u.role, u.password]
      );
    }

    const savedCrops = loadTableFromFile('crops.json');
    for (const c of savedCrops) {
      await db.run(
        'INSERT OR IGNORE INTO Crops (id, name, weight, rate, seller, loc, seller_mobile, status, soldDate, buyerName, distance, transportCost, netProfit, buyer_mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.weight, c.rate, c.seller, c.loc, c.seller_mobile, c.status || 'active', c.soldDate || null, c.buyerName || null, c.distance || null, c.transportCost || null, c.netProfit || null, c.buyer_mobile || null]
      );
    }

    const savedRequests = loadTableFromFile('buyer_requests.json');
    for (const r of savedRequests) {
      await db.run(
        'INSERT OR IGNORE INTO BuyerRequests (id, crop, budget, status, buyer_mobile, buyer_location, buyer_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.crop, r.budget, r.status || 'Pending', r.buyer_mobile, r.buyer_location, r.buyer_name]
      );
    }

    const savedBids = loadTableFromFile('bids.json');
    for (const b of savedBids) {
      await db.run(
        'INSERT OR IGNORE INTO Bids (id, crop_id, crop_name, buyer_name, buyer_mobile, seller_name, seller_mobile, asking_rate, bid_rate, weight, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.crop_id, b.crop_name, b.buyer_name, b.buyer_mobile, b.seller_name, b.seller_mobile, b.asking_rate, b.bid_rate, b.weight, b.status || 'pending']
      );
    }

    const savedMessages = loadTableFromFile('messages.json');
    for (const m of savedMessages) {
      await db.run(
        'INSERT OR IGNORE INTO Messages (id, room_id, sender, text, time) VALUES (?, ?, ?, ?, ?)',
        [m.id, m.room_id, m.sender, m.text, m.time]
      );
    }
  } catch (err) {
    console.error("Hydration warning:", err);
  }

  console.log('Database tables verified/created successfully.');
  return db;
}

module.exports = {
  getDbConnection,
  initDb,
  saveTableToFile,
  loadTableFromFile
};
