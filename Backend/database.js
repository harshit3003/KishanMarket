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
const MongoReport = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const MongoSupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
const MongoTicketReply = mongoose.models.TicketReply || mongoose.model('TicketReply', TicketReplySchema);

async function syncToCloud(filename, data) {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!mongoUri || !Array.isArray(data) || data.length === 0) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    if (filename === 'users.json') {
      const ops = data.filter(u => u.mobile).map(u => ({
        updateOne: { filter: { mobile: u.mobile }, update: { $set: u }, upsert: true }
      }));
      if (ops.length > 0) await MongoUser.bulkWrite(ops);
    } else if (filename === 'crops.json') {
      const ops = data.filter(c => c.id).map(c => ({
        updateOne: { filter: { id: c.id }, update: { $set: c }, upsert: true }
      }));
      if (ops.length > 0) await MongoCrop.bulkWrite(ops);
    } else if (filename === 'buyer_requests.json') {
      const ops = data.filter(r => r.id).map(r => ({
        updateOne: { filter: { id: r.id }, update: { $set: r }, upsert: true }
      }));
      if (ops.length > 0) await MongoBuyerRequest.bulkWrite(ops);
    } else if (filename === 'bids.json') {
      const ops = data.filter(b => b.id).map(b => ({
        updateOne: { filter: { id: b.id }, update: { $set: b }, upsert: true }
      }));
      if (ops.length > 0) await MongoBid.bulkWrite(ops);
    } else if (filename === 'messages.json') {
      const ops = data.filter(m => m.id).map(m => ({
        updateOne: { filter: { id: m.id }, update: { $set: m }, upsert: true }
      }));
      if (ops.length > 0) await MongoMessage.bulkWrite(ops);
    } else if (filename === 'reviews.json') {
      const ops = data.filter(r => r.id).map(r => ({
        updateOne: { filter: { id: r.id }, update: { $set: r }, upsert: true }
      }));
      if (ops.length > 0) await MongoReview.bulkWrite(ops);
    } else if (filename === 'orders.json') {
      const ops = data.filter(o => o.id).map(o => ({
        updateOne: { filter: { id: o.id }, update: { $set: o }, upsert: true }
      }));
      if (ops.length > 0) await MongoOrder.bulkWrite(ops);
    } else if (filename === 'disputes.json') {
      const ops = data.filter(d => d.id).map(d => ({
        updateOne: { filter: { id: d.id }, update: { $set: d }, upsert: true }
      }));
      if (ops.length > 0) await MongoDispute.bulkWrite(ops);
    } else if (filename === 'reports.json') {
      const ops = data.filter(rep => rep.id).map(rep => ({
        updateOne: { filter: { id: rep.id }, update: { $set: rep }, upsert: true }
      }));
      if (ops.length > 0) await MongoReport.bulkWrite(ops);
    } else if (filename === 'support_tickets.json') {
      const ops = data.filter(t => t.id).map(t => ({
        updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true }
      }));
      if (ops.length > 0) await MongoSupportTicket.bulkWrite(ops);
    } else if (filename === 'ticket_replies.json') {
      const ops = data.filter(rep => rep.id).map(rep => ({
        updateOne: { filter: { id: rep.id }, update: { $set: rep }, upsert: true }
      }));
      if (ops.length > 0) await MongoTicketReply.bulkWrite(ops);
    }
  } catch (e) {
    console.error("Cloud DB Sync Notice:", e.message);
  }
}

async function saveTableToFile(filename, data) {
  try {
    fs.writeFileSync(path.join(dataStoreDir, filename), JSON.stringify(data, null, 2));
    await syncToCloud(filename, data);
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

  try { await db.exec(`PRAGMA journal_mode = WAL;`); } catch(e) {}
  try { await db.exec(`PRAGMA synchronous = NORMAL;`); } catch(e) {}
  try { await db.exec(`PRAGMA cache_size = -64000;`); } catch(e) {}

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

  // Create High-Performance DB Indexes for fast sub-100ms queries
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_users_mobile ON Users(mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_buyer ON Orders(buyer_mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_seller ON Orders(seller_mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_crops_seller ON Crops(seller_mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_crops_status ON Crops(status);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_crops_active ON Crops(status, is_removed, id DESC);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_bids_seller ON Bids(seller_mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_bids_buyer ON Bids(buyer_mobile);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_buyer_req_status ON BuyerRequests(status, id DESC);`); } catch(e) {}
  try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_room ON Messages(room_id, id ASC);`); } catch(e) {}

  // Cloud DB Restoration on Boot (if MONGODB_URI is provided)
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  let hasRestoredFromCloud = false;

  if (mongoUri) {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(mongoUri);
      }

      // 1. Users
      const cloudUsers = await MongoUser.find({}).lean();
      for (let idx = 0; idx < cloudUsers.length; idx++) {
        const u = cloudUsers[idx];
        const genId = u.user_id || (u.role === 'seller' ? `KM-S-${1000 + idx + 1}` : `KM-B-${1000 + idx + 1}`);
        await db.run(
          `INSERT INTO Users (user_id, name, mobile, location, role, password, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty, avg_rating, review_count, latitude, longitude, account_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(mobile) DO UPDATE SET
             profile_photo=COALESCE(excluded.profile_photo, Users.profile_photo),
             bio=COALESCE(excluded.bio, Users.bio),
             business_name=COALESCE(excluded.business_name, Users.business_name),
             address=COALESCE(excluded.address, Users.address),
             state=COALESCE(excluded.state, Users.state),
             district=COALESCE(excluded.district, Users.district),
             pincode=COALESCE(excluded.pincode, Users.pincode),
             crops_specialty=COALESCE(excluded.crops_specialty, Users.crops_specialty),
             account_status=COALESCE(excluded.account_status, Users.account_status)`,
          [
            genId, u.name, u.mobile, u.location || '', u.role, u.password,
            u.profile_photo || null, u.bio || null, u.business_name || null,
            u.address || null, u.state || null, u.district || null, u.pincode || null, u.crops_specialty || null,
            u.avg_rating || 5.0, u.review_count || 0, u.latitude || null, u.longitude || null, u.account_status || 'active'
          ]
        );
      }

      // 2. Crops
      const cloudCrops = await MongoCrop.find({}).lean();
      for (const c of cloudCrops) {
        await db.run(
          'INSERT OR REPLACE INTO Crops (id, name, weight, rate, seller, loc, seller_mobile, status, soldDate, buyerName, distance, transportCost, netProfit, buyer_mobile, is_removed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.weight, c.rate, c.seller, c.loc, c.seller_mobile, c.status || 'active', c.soldDate || null, c.buyerName || null, c.distance || null, c.transportCost || null, c.netProfit || null, c.buyer_mobile || null, c.is_removed || 0]
        );
      }

      // 3. Buyer Requests
      const cloudReqs = await MongoBuyerRequest.find({}).lean();
      for (const r of cloudReqs) {
        await db.run(
          'INSERT OR REPLACE INTO BuyerRequests (id, crop, budget, status, buyer_mobile, buyer_location, buyer_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [r.id, r.crop, r.budget, r.status || 'Pending', r.buyer_mobile, r.buyer_location, r.buyer_name]
        );
      }

      // 4. Bids
      const cloudBids = await MongoBid.find({}).lean();
      for (const b of cloudBids) {
        await db.run(
          'INSERT OR REPLACE INTO Bids (id, crop_id, crop_name, buyer_name, buyer_mobile, seller_name, seller_mobile, asking_rate, bid_rate, weight, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.crop_id, b.crop_name, b.buyer_name, b.buyer_mobile, b.seller_name, b.seller_mobile, b.asking_rate, b.bid_rate, b.weight, b.status || 'pending']
        );
      }

      // 5. Messages
      const cloudMsgs = await MongoMessage.find({}).lean();
      for (const m of cloudMsgs) {
        await db.run(
          'INSERT OR REPLACE INTO Messages (id, room_id, sender, text, time, sender_name, sender_mobile, receiver_mobile, crop_name, crop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [m.id, m.room_id, m.sender, m.text, m.time, m.sender_name || null, m.sender_mobile || null, m.receiver_mobile || null, m.crop_name || null, m.crop_id || null]
        );
      }

      // 6. Reviews
      const cloudReviews = await MongoReview.find({}).lean();
      for (const r of cloudReviews) {
        await db.run(
          'INSERT OR REPLACE INTO Reviews (id, order_id, from_user_mobile, from_user_name, to_user_mobile, to_user_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [r.id, r.order_id, r.from_user_mobile, r.from_user_name, r.to_user_mobile, r.to_user_name, r.rating, r.comment]
        );
      }

      // 7. Orders
      const cloudOrders = await MongoOrder.find({}).lean();
      for (const o of cloudOrders) {
        await db.run(
          'INSERT OR REPLACE INTO Orders (id, listing_id, buyer_mobile, buyer_name, seller_mobile, seller_name, bid_id, crop_name, quantity, final_price, status, cancel_reason, cancelled_by, cancelled_at, invoice_number, transporter_name, vehicle_no, tracking_id, driver_phone, est_delivery_date, dispatched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [o.id, o.listing_id, o.buyer_mobile, o.buyer_name, o.seller_mobile, o.seller_name, o.bid_id, o.crop_name, o.quantity, o.final_price, o.status || 'Confirmed', o.cancel_reason || null, o.cancelled_by || null, o.cancelled_at || null, o.invoice_number || null, o.transporter_name || null, o.vehicle_no || null, o.tracking_id || null, o.driver_phone || null, o.est_delivery_date || null, o.dispatched_at || null]
        );
      }

      // 8. Disputes
      const cloudDisputes = await MongoDispute.find({}).lean();
      for (const d of cloudDisputes) {
        await db.run(
          'INSERT OR REPLACE INTO Disputes (id, order_id, raised_by_mobile, raised_by_name, target_mobile, target_name, reason, evidence_photo, status, resolution, resolution_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [d.id, d.order_id, d.raised_by_mobile, d.raised_by_name, d.target_mobile, d.target_name, d.reason, d.evidence_photo, d.status || 'Pending', d.resolution || null, d.resolution_notes || null]
        );
      }

      // 9. Reports
      const cloudReports = await MongoReport.find({}).lean();
      for (const rep of cloudReports) {
        await db.run(
          'INSERT OR REPLACE INTO Reports (id, reported_by_mobile, reported_by_name, target_type, target_id, target_name, reason, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [rep.id, rep.reported_by_mobile, rep.reported_by_name, rep.target_type, rep.target_id, rep.target_name || null, rep.reason, rep.notes || null, rep.status || 'Pending']
        );
      }

      // 10. Support Tickets
      const cloudTickets = await MongoSupportTicket.find({}).lean();
      for (const t of cloudTickets) {
        await db.run(
          'INSERT OR REPLACE INTO SupportTickets (id, user_mobile, user_name, subject, category, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.user_mobile, t.user_name, t.subject, t.category, t.description, t.status || 'Open']
        );
      }

      // 11. Ticket Replies
      const cloudReplies = await MongoTicketReply.find({}).lean();
      for (const r of cloudReplies) {
        await db.run(
          'INSERT OR REPLACE INTO TicketReplies (id, ticket_id, sender_mobile, sender_name, is_admin, message) VALUES (?, ?, ?, ?, ?, ?)',
          [r.id, r.ticket_id, r.sender_mobile, r.sender_name, r.is_admin || 0, r.message]
        );
      }

      hasRestoredFromCloud = true;
      console.log(`Cloud DB Restored all collections successfully from MongoDB Atlas.`);
    } catch (e) {
      console.error("Cloud restoration note:", e.message);
    }
  }

  // Ensure SuperAdmin user exists
  try {
    await db.run(
      `INSERT INTO Users (user_id, name, mobile, location, role, password, business_name, crops_specialty)
       VALUES ('KM-ADM-0001', 'KishanMarket SuperAdmin', '0000000000', 'HQ Command Center', 'admin', '$2b$12$K1f8N1Q/X3h1sH9W6Z4B5eR7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H', 'Platform Governance HQ', 'System Administration')
       ON CONFLICT(mobile) DO UPDATE SET role='admin'`
    );
  } catch (e) {}

  // Hydrate from static JSON files ONLY if MongoDB did NOT restore and SQLite tables are empty
  const userCountRow = await db.get('SELECT COUNT(*) as count FROM Users');
  if (!hasRestoredFromCloud && userCountRow && userCountRow.count <= 1) {
    try {
      const savedUsers = loadTableFromFile('users.json');
      for (let idx = 0; idx < savedUsers.length; idx++) {
        const u = savedUsers[idx];
        const genId = u.user_id || (u.role === 'seller' ? `KM-S-${1000 + idx + 1}` : `KM-B-${1000 + idx + 1}`);
        await db.run(
          `INSERT INTO Users (user_id, name, mobile, location, role, password, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(mobile) DO NOTHING`,
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
    } catch (err) {
      console.error("Hydration warning:", err);
    }
  }

    // Seed Seasonal Crops if table is empty
    try {
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
      console.error("Seasonal crops seeding warning:", err);
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
