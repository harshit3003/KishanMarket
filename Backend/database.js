const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const dataStoreDir = path.join(__dirname, 'server_storage');
if (!fs.existsSync(dataStoreDir)) {
  fs.mkdirSync(dataStoreDir, { recursive: true });
}

// Mongoose Models for Permanent Cloud DB Sync
const UserSchema = new mongoose.Schema({
  user_id: String,
  name: String,
  mobile: { type: String, unique: true },
  location: String,
  role: String,
  password: String,
  profile_photo: String,
  bio: String,
  business_name: String,
  address: String,
  state: String,
  district: String,
  pincode: String,
  crops_specialty: String,
  avg_rating: { type: Number, default: 5.0 },
  review_count: { type: Number, default: 0 },
  latitude: Number,
  longitude: Number
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  id: Number,
  order_id: String,
  from_user_mobile: String,
  from_user_name: String,
  to_user_mobile: String,
  to_user_name: String,
  rating: Number,
  comment: String
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  id: Number,
  listing_id: Number,
  buyer_mobile: String,
  buyer_name: String,
  seller_mobile: String,
  seller_name: String,
  bid_id: Number,
  crop_name: String,
  quantity: String,
  final_price: String,
  status: { type: String, default: 'Confirmed' },
  cancel_reason: String,
  cancelled_by: String,
  cancelled_at: Date,
  invoice_number: String,
  transporter_name: String,
  vehicle_no: String,
  tracking_id: String,
  driver_phone: String,
  est_delivery_date: String,
  dispatched_at: Date
}, { timestamps: true });

const DisputeSchema = new mongoose.Schema({
  id: Number,
  order_id: Number,
  raised_by_mobile: String,
  raised_by_name: String,
  target_mobile: String,
  target_name: String,
  reason: String,
  evidence_photo: String,
  status: { type: String, default: 'Pending' },
  resolution: String,
  resolution_notes: String,
  resolved_at: Date
}, { timestamps: true });

const CropSchema = new mongoose.Schema({
  id: Number,
  name: String,
  weight: String,
  rate: String,
  seller: String,
  loc: String,
  seller_mobile: String,
  status: { type: String, default: 'active' },
  soldDate: String,
  buyerName: String,
  distance: Number,
  transportCost: Number,
  netProfit: Number,
  buyer_mobile: String,
  total_quantity: Number,
  available_quantity: Number,
  is_removed: { type: Number, default: 0 }
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  id: Number,
  reported_by_mobile: String,
  reported_by_name: String,
  target_type: String,
  target_id: String,
  target_name: String,
  reason: String,
  notes: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

const SupportTicketSchema = new mongoose.Schema({
  id: Number,
  user_mobile: String,
  user_name: String,
  subject: String,
  category: String,
  description: String,
  status: { type: String, default: 'Open' },
  resolved_at: Date
}, { timestamps: true });

const TicketReplySchema = new mongoose.Schema({
  id: Number,
  ticket_id: Number,
  sender_mobile: String,
  sender_name: String,
  is_admin: Number,
  message: String
}, { timestamps: true });

const BuyerRequestSchema = new mongoose.Schema({
  id: Number,
  crop: String,
  budget: String,
  status: { type: String, default: 'Pending' },
  buyer_mobile: String,
  buyer_location: String,
  buyer_name: String
}, { timestamps: true });

const BidSchema = new mongoose.Schema({
  id: Number,
  crop_id: Number,
  crop_name: String,
  buyer_name: String,
  buyer_mobile: String,
  seller_name: String,
  seller_mobile: String,
  asking_rate: String,
  bid_rate: String,
  weight: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  id: Number,
  room_id: String,
  sender: String,
  text: String,
  time: String,
  sender_name: String,
  sender_mobile: String,
  receiver_mobile: String,
  crop_name: String,
  crop_id: Number
}, { timestamps: true });

const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongoCrop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
const MongoBuyerRequest = mongoose.models.BuyerRequest || mongoose.model('BuyerRequest', BuyerRequestSchema);
const MongoBid = mongoose.models.Bid || mongoose.model('Bid', BidSchema);
const MongoMessage = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const MongoReview = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const MongoOrder = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const MongoDispute = mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);

async function syncToCloud(filename, data) {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!mongoUri) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    if (filename === 'users.json' && Array.isArray(data)) {
      for (const u of data) {
        if (u.mobile) await MongoUser.updateOne({ mobile: u.mobile }, u, { upsert: true });
      }
    } else if (filename === 'crops.json' && Array.isArray(data)) {
      for (const c of data) {
        if (c.id) await MongoCrop.updateOne({ id: c.id }, c, { upsert: true });
      }
    } else if (filename === 'buyer_requests.json' && Array.isArray(data)) {
      for (const r of data) {
        if (r.id) await MongoBuyerRequest.updateOne({ id: r.id }, r, { upsert: true });
      }
    } else if (filename === 'bids.json' && Array.isArray(data)) {
      for (const b of data) {
        if (b.id) await MongoBid.updateOne({ id: b.id }, b, { upsert: true });
      }
    } else if (filename === 'messages.json' && Array.isArray(data)) {
      for (const m of data) {
        if (m.id) await MongoMessage.updateOne({ id: m.id }, m, { upsert: true });
      }
    } else if (filename === 'reviews.json' && Array.isArray(data)) {
      for (const r of data) {
        if (r.id) await MongoReview.updateOne({ id: r.id }, r, { upsert: true });
      }
    } else if (filename === 'orders.json' && Array.isArray(data)) {
      for (const o of data) {
        if (o.id) await MongoOrder.updateOne({ id: o.id }, o, { upsert: true });
      }
    } else if (filename === 'disputes.json' && Array.isArray(data)) {
      for (const d of data) {
        if (d.id) await MongoDispute.updateOne({ id: d.id }, d, { upsert: true });
      }
    }
  } catch (e) {
    console.error("Cloud DB Sync Notice:", e.message);
  }
}

function saveTableToFile(filename, data) {
  try {
    fs.writeFileSync(path.join(dataStoreDir, filename), JSON.stringify(data, null, 2));
    syncToCloud(filename, data);
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

    CREATE TABLE IF NOT EXISTS Reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      from_user_mobile TEXT NOT NULL,
      from_user_name TEXT NOT NULL,
      to_user_mobile TEXT NOT NULL,
      to_user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER,
      buyer_mobile TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      seller_mobile TEXT NOT NULL,
      seller_name TEXT NOT NULL,
      bid_id INTEGER,
      crop_name TEXT NOT NULL,
      quantity TEXT NOT NULL,
      final_price TEXT NOT NULL,
      status TEXT DEFAULT 'Confirmed',
      cancel_reason TEXT,
      cancelled_by TEXT,
      cancelled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      raised_by_mobile TEXT NOT NULL,
      raised_by_name TEXT NOT NULL,
      target_mobile TEXT NOT NULL,
      target_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_photo TEXT,
      status TEXT DEFAULT 'Pending',
      resolution TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS SeasonalCrops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season TEXT NOT NULL,
      months TEXT NOT NULL,
      region TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      hindi_name TEXT,
      tips TEXT
    );

    CREATE TABLE IF NOT EXISTS Reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reported_by_mobile TEXT NOT NULL,
      reported_by_name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_name TEXT,
      reason TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS SupportTickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_mobile TEXT NOT NULL,
      user_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS TicketReplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_mobile TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safely patch existing Users table if missing profile columns
  try { await db.exec(`ALTER TABLE Users ADD COLUMN user_id TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN profile_photo TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN bio TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN business_name TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN address TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN state TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN district TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN pincode TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN crops_specialty TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN avg_rating REAL DEFAULT 5.0;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN review_count INTEGER DEFAULT 0;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN latitude REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN longitude REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Users ADD COLUMN account_status TEXT DEFAULT 'active';`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN is_removed INTEGER DEFAULT 0;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN cancel_reason TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN cancelled_by TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN cancelled_at DATETIME;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN invoice_number TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN transporter_name TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN vehicle_no TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN tracking_id TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN driver_phone TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN est_delivery_date TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Orders ADD COLUMN dispatched_at DATETIME;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN seller_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN status TEXT DEFAULT 'active';`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN soldDate TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyerName TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN distance REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN transportCost REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN netProfit REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN buyer_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN total_quantity REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Crops ADD COLUMN available_quantity REAL;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE BuyerRequests ADD COLUMN buyer_name TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Messages ADD COLUMN sender_name TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Messages ADD COLUMN sender_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Messages ADD COLUMN receiver_mobile TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Messages ADD COLUMN crop_name TEXT;`); } catch(e) {}
  try { await db.exec(`ALTER TABLE Messages ADD COLUMN crop_id INTEGER;`); } catch(e) {}

  // Cloud DB Restoration on Boot (if MONGODB_URI is provided)
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (mongoUri) {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(mongoUri);
      }
      const cloudUsers = await MongoUser.find({}).lean();
      for (let idx = 0; idx < cloudUsers.length; idx++) {
        const u = cloudUsers[idx];
        await db.run(
          `INSERT INTO Users (user_id, name, mobile, location, role, password, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(mobile) DO UPDATE SET
             profile_photo=COALESCE(excluded.profile_photo, Users.profile_photo),
             bio=COALESCE(excluded.bio, Users.bio),
             business_name=COALESCE(excluded.business_name, Users.business_name),
             address=COALESCE(excluded.address, Users.address),
             state=COALESCE(excluded.state, Users.state),
             district=COALESCE(excluded.district, Users.district),
             pincode=COALESCE(excluded.pincode, Users.pincode),
             crops_specialty=COALESCE(excluded.crops_specialty, Users.crops_specialty)`,
          [
            genId, u.name, u.mobile, u.location || '', u.role, u.password,
            u.profile_photo || null, u.bio || null, u.business_name || null,
            u.address || null, u.state || null, u.district || null, u.pincode || null, u.crops_specialty || null
          ]
        );
      }
      console.log(`Cloud DB Restored ${cloudUsers.length} users successfully.`);
    } catch (e) {
      console.error("Cloud restoration note:", e.message);
    }
  }

  // Hydrate SQLite database from server_storage files on startup
  try {
    const savedUsers = loadTableFromFile('users.json');
    for (let idx = 0; idx < savedUsers.length; idx++) {
      const u = savedUsers[idx];
      const genId = u.user_id || (u.role === 'seller' ? `KM-S-${1000 + idx + 1}` : `KM-B-${1000 + idx + 1}`);
      await db.run(
        `INSERT INTO Users (user_id, name, mobile, location, role, password, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(mobile) DO UPDATE SET
           profile_photo=COALESCE(excluded.profile_photo, Users.profile_photo),
           bio=COALESCE(excluded.bio, Users.bio),
           business_name=COALESCE(excluded.business_name, Users.business_name),
           address=COALESCE(excluded.address, Users.address),
           state=COALESCE(excluded.state, Users.state),
           district=COALESCE(excluded.district, Users.district),
           pincode=COALESCE(excluded.pincode, Users.pincode),
           crops_specialty=COALESCE(excluded.crops_specialty, Users.crops_specialty)`,
        [
          genId, u.name, u.mobile, u.location || '', u.role, u.password,
          u.profile_photo || null, u.bio || null, u.business_name || null,
          u.address || null, u.state || null, u.district || null, u.pincode || null, u.crops_specialty || null
        ]
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

    const savedReviews = loadTableFromFile('reviews.json');
    for (const r of savedReviews) {
      await db.run(
        'INSERT OR IGNORE INTO Reviews (id, order_id, from_user_mobile, from_user_name, to_user_mobile, to_user_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.order_id, r.from_user_mobile, r.from_user_name, r.to_user_mobile, r.to_user_name, r.rating, r.comment]
      );
    }

    const savedOrders = loadTableFromFile('orders.json');
    for (const o of savedOrders) {
      await db.run(
        'INSERT OR IGNORE INTO Orders (id, listing_id, buyer_mobile, buyer_name, seller_mobile, seller_name, bid_id, crop_name, quantity, final_price, status, cancel_reason, cancelled_by, cancelled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [o.id, o.listing_id, o.buyer_mobile, o.buyer_name, o.seller_mobile, o.seller_name, o.bid_id, o.crop_name, o.quantity, o.final_price, o.status || 'Confirmed', o.cancel_reason || null, o.cancelled_by || null, o.cancelled_at || null]
      );
    }

    const savedDisputes = loadTableFromFile('disputes.json');
    for (const d of savedDisputes) {
      await db.run(
        'INSERT OR IGNORE INTO Disputes (id, order_id, raised_by_mobile, raised_by_name, target_mobile, target_name, reason, evidence_photo, status, resolution, resolution_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.order_id, d.raised_by_mobile, d.raised_by_name, d.target_mobile, d.target_name, d.reason, d.evidence_photo, d.status || 'Pending', d.resolution || null, d.resolution_notes || null]
      );
    }

    // Seed Seasonal Crops if table is empty
    const seasonalCount = await db.get('SELECT COUNT(*) as cnt FROM SeasonalCrops');
    if (seasonalCount && seasonalCount.cnt === 0) {
      const defaultSeasonal = [
        // Rabi (Oct - Mar: Months 10,11,12,1,2,3)
        { season: 'Rabi', months: '10,11,12,1,2,3', region: 'North', crop_name: 'Gehu (Wheat)', hindi_name: 'गेहूं', tips: 'High demand season. Top buyers procurement period.' },
        { season: 'Rabi', months: '10,11,12,1,2,3', region: 'North', crop_name: 'Sarson (Mustard)', hindi_name: 'सरसों', tips: 'Excellent oilseed prices during winter harvesting.' },
        { season: 'Rabi', months: '10,11,12,1,2,3', region: 'North', crop_name: 'Chana (Gram)', hindi_name: 'चना', tips: 'Pulses demand spikes during winter months.' },
        { season: 'Rabi', months: '10,11,12,1,2,3', region: 'North', crop_name: 'Matar (Peas)', hindi_name: 'मटर', tips: 'Fresh green peas peak market rate.' },

        // Kharif (Jun - Oct: Months 6,7,8,9,10)
        { season: 'Kharif', months: '6,7,8,9,10', region: 'North', crop_name: 'Dhan (Paddy/Rice)', hindi_name: 'धान', tips: 'Monsoon harvesting. High wholesale buyer demand.' },
        { season: 'Kharif', months: '6,7,8,9,10', region: 'North', crop_name: 'Makka (Maize)', hindi_name: 'मक्का', tips: 'Feed and industrial starch demand.' },
        { season: 'Kharif', months: '6,7,8,9,10', region: 'North', crop_name: 'Kapaas (Cotton)', hindi_name: 'कपास', tips: 'Textile procurement active.' },
        { season: 'Kharif', months: '6,7,8,9,10', region: 'North', crop_name: 'Moong Dal', hindi_name: 'मूंग', tips: 'Short duration cash crop.' },

        // Zaid (Mar - Jun: Months 3,4,5,6)
        { season: 'Zaid', months: '3,4,5,6', region: 'North', crop_name: 'Tarbooz (Watermelon)', hindi_name: 'तरबूज', tips: 'Peak summer fruit demand.' },
        { season: 'Zaid', months: '3,4,5,6', region: 'North', crop_name: 'Kheera (Cucumber)', hindi_name: 'खीरा', tips: 'Quick yield summer vegetable.' }
      ];

      for (const sc of defaultSeasonal) {
        await db.run(
          'INSERT INTO SeasonalCrops (season, months, region, crop_name, hindi_name, tips) VALUES (?, ?, ?, ?, ?, ?)',
          [sc.season, sc.months, sc.region, sc.crop_name, sc.hindi_name, sc.tips]
        );
      }
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
