const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

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
  `);

  // Safely patch existing Crops table if missing new columns (ignores errors if columns already exist)
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN seller_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN status TEXT DEFAULT 'active';`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN soldDate TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyerName TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN distance REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN transportCost REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN netProfit REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyer_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE BuyerRequests ADD COLUMN buyer_name TEXT;`); } catch(e) {}

  console.log('Database tables verified/created successfully.');
  return db;
}

module.exports = {
  getDbConnection,
  initDb
};
