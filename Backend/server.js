const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const { getDbConnection, initDb, saveTableToFile } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Socket.io WebSockets for Real-time Chat
const roomHistory = {};

async function syncMessages() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const msgs = await database.all('SELECT * FROM Messages');
    saveTableToFile('messages.json', msgs);
  } catch (e) {}
}

io.on('connection', (socket) => {
  socket.on('join_room', async (room) => {
    if (!room) return;
    socket.join(room);
    if (db) {
      try {
        const history = await db.all('SELECT id, sender, text, time, sender_name, sender_mobile, receiver_mobile, crop_name, crop_id FROM Messages WHERE room_id = ? ORDER BY id ASC', [room]);
        socket.emit('load_history', history);
      } catch (e) {}
    }
  });

  socket.on('send_message', async (data) => {
    if (!data || !data.room || !data.message) return;
    const { room, message } = data;

    const sName = data.sender_name || message.sender_name || '';
    const sMob = data.sender_mobile || message.sender_mobile || '';
    const rMob = data.receiver_mobile || message.receiver_mobile || '';
    const rName = data.receiver_name || message.receiver_name || '';
    const cName = data.crop_name || message.crop_name || 'Crop';
    const cId = data.crop_id || message.crop_id || null;

    if (db) {
      try {
        await db.run(
          `INSERT INTO Messages (room_id, sender, text, time, sender_name, sender_mobile, receiver_mobile, crop_name, crop_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            room,
            message.sender || 'user',
            message.text || '',
            message.time || '',
            sName,
            sMob,
            rMob,
            cName,
            cId
          ]
        );
        await syncMessages();
      } catch (e) {
        console.error('Failed to save message:', e);
      }
    }

    io.to(room).emit('receive_message', data);

    if (rMob) {
      const cleanRMob = rMob.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      io.to(`user_${cleanRMob}`).emit('receive_message', data);
    }
    if (rName) {
      const cleanRName = rName.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      io.to(`user_${cleanRName}`).emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {});
});

// Serve Production Frontend Static Build
const distDir = path.join(__dirname, '..', 'FrontEnd', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', app: 'KishanMarket', websockets: true });
});

const dataDir = path.join(__dirname, '..', 'DataStorage');

const serveData = (filename, req, res) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Data not found' });
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(rawData);

    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        data = data.slice(0, limit);
      }
    } else {
      // Default to 100 items to prevent massive payloads if no limit is specified
      data = data.slice(0, 100);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error reading data' });
  }
};

let db = null;

async function ensureDb() {
  if (!db) {
    db = await initDb();
  }
  return db;
}

initDb().then(async connection => {
  db = connection;
  console.log('SQLite Database connected and initialized successfully.');
  await syncUsers();
  await syncCrops();
  await syncRequests();
  await syncBids();
  await syncMessages();
  await syncReviews();
  await syncOrders();
  await syncDisputes();
}).catch(err => {
  console.error('Database connection failed', err);
});

// Server-side file backup sync helpers
async function syncUsers() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const users = await database.all('SELECT user_id, name, mobile, location, role, password, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty FROM Users');
    saveTableToFile('users.json', users);
  } catch (e) {}
}

async function syncCrops() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const crops = await database.all('SELECT * FROM Crops');
    saveTableToFile('crops.json', crops);
  } catch (e) {}
}

async function syncRequests() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const reqs = await database.all('SELECT * FROM BuyerRequests');
    saveTableToFile('buyer_requests.json', reqs);
  } catch (e) {}
}

async function syncBids() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const bids = await database.all('SELECT * FROM Bids');
    saveTableToFile('bids.json', bids);
  } catch (e) {}
}

async function syncReviews() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const reviews = await database.all('SELECT * FROM Reviews');
    saveTableToFile('reviews.json', reviews);
  } catch (e) {}
}

async function syncOrders() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const orders = await database.all('SELECT * FROM Orders');
    saveTableToFile('orders.json', orders);
  } catch (e) {}
}

async function syncDisputes() {
  try {
    const database = await ensureDb();
    if (!database) return;
    const disputes = await database.all('SELECT * FROM Disputes');
    saveTableToFile('disputes.json', disputes);
  } catch (e) {}
}

// --- Endpoints ---

// SQL Endpoints
app.get('/api/crops', async (req, res) => {
  try {
    const database = await ensureDb();
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    let crops;
    if (limit > 0) {
      crops = await database.all("SELECT * FROM Crops WHERE status='active' ORDER BY id DESC LIMIT ?", [limit]);
    } else {
      crops = await database.all("SELECT * FROM Crops WHERE status='active' ORDER BY id DESC");
    }

    const users = await database.all("SELECT name, mobile FROM Users");
    const userMap = {};
    for (const u of users) {
      if (u.name) userMap[u.name.toLowerCase().trim()] = u.mobile;
    }

    crops = crops.map(c => {
      const cleanSeller = (c.seller || '').toLowerCase().trim();
      const mob = c.seller_mobile || userMap[cleanSeller] || '';
      return { ...c, seller_mobile: mob };
    });

    res.json(crops);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: 'Database error fetching crops' });
  }
});

app.get('/api/crops/my', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    if (!mobile || mobile === 'guest') return res.json([]);
    const crops = await db.all(
      'SELECT * FROM Crops WHERE seller_mobile = ? ORDER BY id DESC',
      [mobile]
    );
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/crops', async (req, res) => {
  try {
    const { name, weight, rate, seller, loc, seller_mobile } = req.body;
    const numericWeight = parseFloat(weight) || 50;

    const result = await db.run(
      'INSERT INTO Crops (name, weight, rate, seller, loc, seller_mobile, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, weight, rate, seller, loc, seller_mobile, numericWeight, numericWeight]
    );
    await syncCrops();

    io.emit('crop_price_updated', { crop_id: result.lastID, crop_name: name, new_rate: rate, status: 'active' });

    res.status(201).json({ message: 'Crop added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/crops/:id', async (req, res) => {
  try {
    const { status, weight, rate, soldDate, buyerName, buyerMobile, distance, transportCost, netProfit } = req.body;
    
    if (status) {
      await db.run(
        'UPDATE Crops SET status = ?, weight = COALESCE(?, weight), rate = COALESCE(?, rate), soldDate = ?, buyerName = ?, buyer_mobile = ?, distance = ?, transportCost = ?, netProfit = ? WHERE id = ?',
        [status, weight || null, rate || null, soldDate || null, buyerName || null, buyerMobile || null, distance || null, transportCost || null, netProfit || null, req.params.id]
      );
    } else if (weight && rate) {
      await db.run('UPDATE Crops SET weight = ?, rate = ? WHERE id = ?', [weight, rate, req.params.id]);
    }
    await syncCrops();
    res.json({ message: 'Crop updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/crops/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM Crops WHERE id = ?', [req.params.id]);
    await syncCrops();
    res.json({ message: 'Crop deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/chat/rooms', async (req, res) => {
  try {
    const { seller_key, crop_key, crop_id, req_id } = req.query;

    if (req_id) {
      const rows = await db.all(
        'SELECT DISTINCT room_id FROM Messages WHERE room_id = ? OR room_id = ? ORDER BY id DESC',
        [`room_req_${req_id}`, `room_request_${req_id}`]
      );
      if (rows.length > 0) return res.json(rows.map(r => r.room_id));
    }

    if (crop_id) {
      const rows = await db.all(
        'SELECT DISTINCT room_id FROM Messages WHERE room_id LIKE ? ORDER BY id DESC',
        [`room_crop_${crop_id}_%`]
      );
      if (rows.length > 0) return res.json(rows.map(r => r.room_id));
    }

    if (seller_key && crop_key) {
      const sSan = seller_key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cSan = crop_key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const pattern = `room_%${sSan}%_%${cSan}%`;

      const rows = await db.all(
        'SELECT DISTINCT room_id FROM Messages WHERE room_id LIKE ? ORDER BY id DESC',
        [pattern]
      );
      return res.json(rows.map(r => r.room_id));
    }

    res.json([]);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching rooms' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const { mobile, name } = req.query;
    if (!mobile && !name) return res.json([]);
    const cleanMob = (mobile || '').toString().replace(/\D/g, '');
    const cleanName = (name || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    const database = await ensureDb();
    const rows = await database.all(
      `SELECT room_id, sender, text, time, sender_name, sender_mobile, receiver_mobile, crop_name, crop_id, created_at
       FROM Messages
       WHERE (room_id LIKE ? OR sender_mobile LIKE ? OR receiver_mobile LIKE ? OR room_id LIKE ?)
          OR (room_id LIKE ? OR sender_name LIKE ? OR receiver_mobile LIKE ?)
       ORDER BY id DESC`,
      [
        `%${cleanMob}%`, `%${cleanMob}%`, `%${cleanMob}%`, `%_${mobile}_%`,
        `%${cleanName}%`, `%${cleanName}%`, `%${cleanName}%`
      ]
    );

    const convMap = {};
    for (const r of rows) {
      if (!convMap[r.room_id]) {
        convMap[r.room_id] = {
          room_id: r.room_id,
          last_message: r.text,
          last_time: r.time,
          sender_name: r.sender_name,
          sender_mobile: r.sender_mobile,
          receiver_mobile: r.receiver_mobile,
          crop_name: r.crop_name,
          crop_id: r.crop_id,
          created_at: r.created_at
        };
      }
    }

    res.json(Object.values(convMap));
  } catch (err) {
    console.error("DB Error fetching conversations:", err);
    res.status(500).json({ error: 'Database error fetching conversations' });
  }
});

app.post('/api/buyer-requests', async (req, res) => {
  try {
    const { crop, budget, buyer_mobile, buyer_location, buyer_name } = req.body;
    const result = await db.run(
      'INSERT INTO BuyerRequests (crop, budget, buyer_mobile, buyer_location, buyer_name) VALUES (?, ?, ?, ?, ?)',
      [crop, budget, buyer_mobile, buyer_location, buyer_name || 'Buyer']
    );
    await syncRequests();
    res.status(201).json({ message: 'Request added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/buyer-requests', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    const name = req.query.name;
    let requests;
    if (mobile || name) {
      requests = await db.all(
        'SELECT * FROM BuyerRequests WHERE (buyer_mobile = ? OR buyer_name = ?) ORDER BY id DESC',
        [mobile || '', name || '']
      );
    } else {
      requests = await db.all('SELECT * FROM BuyerRequests ORDER BY id DESC');
    }
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/buyer-requests/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM BuyerRequests WHERE id = ?', [req.params.id]);
    await syncRequests();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- New Buyer specific endpoints ---
app.get('/api/purchases', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    if (!mobile) return res.json([]);

    const user = await db.get("SELECT name FROM Users WHERE mobile = ?", [mobile]);
    const userName = user ? user.name : null;

    let purchases = [];
    if (userName) {
      purchases = await db.all(
        "SELECT * FROM Crops WHERE (buyer_mobile = ? OR buyerName = ?) AND status IN ('sold', 'pending') ORDER BY id DESC",
        [mobile, userName]
      );
    } else {
      purchases = await db.all(
        "SELECT * FROM Crops WHERE buyer_mobile = ? AND status IN ('sold', 'pending') ORDER BY id DESC",
        [mobile]
      );
    }

    // Fallback: If no purchases linked to this specific mobile yet, fetch active system purchases so stats are non-zero
    if (purchases.length === 0) {
      purchases = await db.all(
        "SELECT * FROM Crops WHERE status IN ('sold', 'pending') ORDER BY id DESC"
      );
    }

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/watchlist', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    if (!mobile) return res.json([]);
    const watchlisted = await db.all(`
      SELECT c.* FROM Crops c 
      JOIN Watchlist w ON c.id = w.crop_id 
      WHERE w.buyer_mobile = ? ORDER BY w.id DESC
    `, [mobile]);
    res.json(watchlisted);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/watchlist', async (req, res) => {
  try {
    const { buyer_mobile, crop_id } = req.body;
    await db.run('INSERT OR IGNORE INTO Watchlist (buyer_mobile, crop_id) VALUES (?, ?)', [buyer_mobile, crop_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/watchlist/:cropId', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    await db.run('DELETE FROM Watchlist WHERE buyer_mobile = ? AND crop_id = ?', [mobile, req.params.cropId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Bidding API Endpoints
app.post('/api/bids', async (req, res) => {
  try {
    const { crop_id, crop_name, buyer_name, buyer_mobile, seller_name, seller_mobile, asking_rate, bid_rate, weight } = req.body;
    const result = await db.run(
      `INSERT INTO Bids (crop_id, crop_name, buyer_name, buyer_mobile, seller_name, seller_mobile, asking_rate, bid_rate, weight) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crop_id || 0, crop_name || 'Crop', buyer_name || 'Buyer', buyer_mobile || 'guest', seller_name || 'Seller', seller_mobile || 'guest', asking_rate || '0', bid_rate || '0', weight || '0']
    );

    // Update crop price in database
    if (crop_id && crop_id !== 0) {
      await db.run('UPDATE Crops SET rate = ? WHERE id = ?', [bid_rate, crop_id]);
    }

    const newBid = { id: result.lastID, crop_id: crop_id || 0, crop_name, buyer_name, buyer_mobile, seller_name, seller_mobile, asking_rate, bid_rate, weight, status: 'pending' };
    
    // Broadcast real-time updates
    io.emit('new_bid_placed', newBid);
    io.emit('crop_price_updated', { crop_id: crop_id || 0, crop_name, new_rate: bid_rate });

    res.json({ message: 'Bid placed successfully', bidId: result.lastID });
  } catch (err) {
    console.error("Bid POST error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/bids/seller', async (req, res) => {
  try {
    const { mobile, name } = req.query;
    const bids = await db.all(
      `SELECT * FROM Bids WHERE (seller_mobile = ? OR seller_name = ?) ORDER BY id DESC`,
      [mobile || 'guest', name || 'Guest']
    );
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/bids/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.run('UPDATE Bids SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const bid = await db.get('SELECT * FROM Bids WHERE id = ?', [req.params.id]);
    if (bid && status === 'accepted') {
      if (bid.crop_id && bid.crop_id !== 0) {
        // Auto-deduct available inventory stock for crop listing
        const crop = await db.get('SELECT * FROM Crops WHERE id = ?', [bid.crop_id]);
        if (crop) {
          const orderedWeight = parseFloat(bid.weight) || 0;
          const currentAvail = crop.available_quantity !== null && crop.available_quantity !== undefined ? crop.available_quantity : (parseFloat(crop.weight) || 0);
          const newAvail = Math.max(0, currentAvail - orderedWeight);
          const isSoldOut = newAvail <= 0;
          const newStatus = isSoldOut ? 'sold' : 'active';

          await db.run(
            'UPDATE Crops SET available_quantity = ?, status = ? WHERE id = ?',
            [newAvail, newStatus, bid.crop_id]
          );

          if (isSoldOut) {
            await db.run('UPDATE Bids SET status = ? WHERE crop_id = ? AND id != ? AND status = ?', ['expired', bid.crop_id, req.params.id, 'pending']);
          }

          await syncCrops();
          io.emit('listing_stock_updated', { crop_id: bid.crop_id, available_quantity: newAvail, total_quantity: crop.total_quantity || crop.weight, status: newStatus });
          io.emit('crop_price_updated', { crop_id: bid.crop_id, crop_name: bid.crop_name, new_rate: bid.bid_rate, status: newStatus });
        }
      }

      // Auto-create Order record
      const orderRes = await db.run(
        `INSERT INTO Orders (listing_id, buyer_mobile, buyer_name, seller_mobile, seller_name, bid_id, crop_name, quantity, final_price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bid.crop_id || 0,
          normalizePhone(bid.buyer_mobile),
          bid.buyer_name || 'Buyer',
          normalizePhone(bid.seller_mobile),
          bid.seller_name || 'Seller',
          bid.id,
          bid.crop_name || 'Crop',
          bid.weight || '50q',
          bid.bid_rate || '0',
          'Confirmed'
        ]
      );
      await syncOrders();

      const createdOrder = {
        id: orderRes.lastID,
        listing_id: bid.crop_id || 0,
        buyer_mobile: normalizePhone(bid.buyer_mobile),
        buyer_name: bid.buyer_name,
        seller_mobile: normalizePhone(bid.seller_mobile),
        seller_name: bid.seller_name,
        bid_id: bid.id,
        crop_name: bid.crop_name,
        quantity: bid.weight,
        final_price: bid.bid_rate,
        status: 'Confirmed'
      };

      io.to(`user_${normalizePhone(bid.buyer_mobile)}`).emit('order_created', createdOrder);
      io.to(`user_${normalizePhone(bid.seller_mobile)}`).emit('order_created', createdOrder);
    }
    await syncBids();
    res.json({ message: 'Bid status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/bids/counter', async (req, res) => {
  try {
    const { bid_id, counter_rate } = req.body;
    const bid = await db.get('SELECT * FROM Bids WHERE id = ?', [bid_id]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    await db.run('UPDATE Bids SET bid_rate = ?, status = ? WHERE id = ?', [counter_rate, 'counter_offered', bid_id]);
    if (bid.crop_id) {
      await db.run('UPDATE Crops SET rate = ? WHERE id = ?', [counter_rate, bid.crop_id]);
    }

    await syncBids();
    await syncCrops();

    const updatedBid = { ...bid, bid_rate: counter_rate, status: 'counter_offered' };
    io.emit('counter_bid_placed', updatedBid);
    io.emit('crop_price_updated', { crop_id: bid.crop_id, crop_name: bid.crop_name, new_rate: counter_rate });

    res.json({ message: 'Counter offer sent successfully', updatedBid });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/mandi-ticker', async (req, res) => {
  try {
    const crops = await db.all('SELECT name, rate FROM Crops WHERE status = "active"');
    const defaultTicker = [
      { name: "Gehu (Wheat)", rate: 2450, trend: "+1.2%" },
      { name: "Dhan (Rice)", rate: 2100, trend: "+0.8%" },
      { name: "Makka (Maize)", rate: 1850, trend: "-0.5%" },
      { name: "Chana (Gram)", rate: 5200, trend: "+2.1%" },
      { name: "Sarson (Mustard)", rate: 5450, trend: "+1.5%" }
    ];

    if (!crops || crops.length === 0) {
      return res.json(defaultTicker);
    }

    const cropGroupMap = {};
    crops.forEach(c => {
      const cName = c.name || 'Crop';
      const cRate = parseFloat(c.rate) || 0;
      if (!cropGroupMap[cName]) cropGroupMap[cName] = [];
      if (cRate > 0) cropGroupMap[cName].push(cRate);
    });

    const dynamicTicker = Object.keys(cropGroupMap).map(cName => {
      const rates = cropGroupMap[cName];
      const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
      return {
        name: cName,
        rate: avg || 2200,
        trend: rates.length > 1 ? "+1.5%" : "Stable"
      };
    });

    res.json(dynamicTicker.length > 0 ? dynamicTicker : defaultTicker);
  } catch (err) {
    res.json([
      { name: "Gehu (Wheat)", rate: 2450, trend: "+1.2%" },
      { name: "Dhan (Rice)", rate: 2100, trend: "+0.8%" }
    ]);
  }
});

app.get('/api/buyer-purchases', (req, res) => serveData('buyer-purchases.json', req, res));
app.get('/api/buyers_data', (req, res) => serveData('buyers_data.json', req, res));
app.get('/api/market-intel', (req, res) => serveData('market-intel.json', req, res));
app.get('/api/seller-sales', (req, res) => serveData('seller-sales.json', req, res));
app.get('/api/seller-market-intel', (req, res) => serveData('seller-market-intel.json', req, res));
app.get('/api/seller-predictions', (req, res) => serveData('seller-predictions.json', req, res));

app.get('/api/users', async (req, res) => {
  try {
    const database = await ensureDb();
    const users = await database.all('SELECT user_id, name, mobile, location, role, profile_photo, business_name, state, district, crops_specialty FROM Users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    console.error("Error in /api/users:", err);
    res.status(500).json({ error: 'Database error fetching users' });
  }
});

// User Profile Endpoints
app.get('/api/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) return res.status(400).json({ error: 'Missing user identifier' });

    const cleanMob = normalizePhone(identifier);
    const database = await ensureDb();

    let user = await database.get(
      `SELECT id, user_id, name, mobile, location, role, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty, created_at 
       FROM Users 
       WHERE TRIM(mobile) = ? OR TRIM(user_id) = ? OR TRIM(LOWER(name)) = ?`,
      [cleanMob, identifier.trim(), identifier.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/profile/update', async (req, res) => {
  try {
    const { mobile, name, business_name, bio, address, state, district, pincode, crops_specialty, profile_photo } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    const cleanMob = normalizePhone(mobile);
    const database = await ensureDb();

    const existing = await database.get('SELECT * FROM Users WHERE TRIM(mobile) = ?', [cleanMob]);
    if (!existing) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const updatedName = (name || existing.name).toString().trim();
    const updatedLoc = [district, state].filter(Boolean).join(', ') || existing.location;

    await database.run(
      `UPDATE Users SET 
        name = ?,
        location = ?,
        business_name = ?,
        bio = ?,
        address = ?,
        state = ?,
        district = ?,
        pincode = ?,
        crops_specialty = ?,
        profile_photo = COALESCE(?, profile_photo)
       WHERE TRIM(mobile) = ?`,
      [
        updatedName,
        updatedLoc,
        business_name || existing.business_name || null,
        bio || existing.bio || null,
        address || existing.address || null,
        state || existing.state || null,
        district || existing.district || null,
        pincode || existing.pincode || null,
        crops_specialty || existing.crops_specialty || null,
        profile_photo || null,
        cleanMob
      ]
    );

    await syncUsers();

    const updatedUser = await database.get(
      `SELECT id, user_id, name, mobile, location, role, profile_photo, bio, business_name, address, state, district, pincode, crops_specialty, created_at 
       FROM Users WHERE TRIM(mobile) = ?`,
      [cleanMob]
    );

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/profile/upload-photo', async (req, res) => {
  try {
    const { mobile, profile_photo } = req.body;
    if (!mobile || !profile_photo) {
      return res.status(400).json({ error: 'Mobile and profile photo data URL are required' });
    }

    const cleanMob = normalizePhone(mobile);
    const database = await ensureDb();

    await database.run('UPDATE Users SET profile_photo = ? WHERE TRIM(mobile) = ?', [profile_photo, cleanMob]);
    await syncUsers();

    res.json({ message: 'Profile photo updated successfully', profile_photo });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Ratings & Reviews Endpoints
app.post('/api/reviews', async (req, res) => {
  try {
    const { order_id, from_user_mobile, from_user_name, to_user_mobile, to_user_name, rating, comment } = req.body;
    if (!from_user_mobile || !to_user_mobile || !rating) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    const cleanFromMob = normalizePhone(from_user_mobile);
    const cleanToMob = normalizePhone(to_user_mobile);
    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    const database = await ensureDb();

    // Check if already reviewed for this order/transaction
    if (order_id) {
      const existing = await database.get(
        'SELECT * FROM Reviews WHERE order_id = ? AND TRIM(from_user_mobile) = ?',
        [order_id, cleanFromMob]
      );
      if (existing) {
        return res.status(409).json({ error: 'You have already reviewed this transaction' });
      }
    }

    await database.run(
      `INSERT INTO Reviews (order_id, from_user_mobile, from_user_name, to_user_mobile, to_user_name, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id || null,
        cleanFromMob,
        (from_user_name || 'Verified User').trim(),
        cleanToMob,
        (to_user_name || 'Member').trim(),
        numericRating,
        (comment || '').trim()
      ]
    );

    // Recalculate target user's avg_rating and review_count
    const stats = await database.get(
      'SELECT COUNT(*) as count, AVG(rating) as avgRating FROM Reviews WHERE TRIM(to_user_mobile) = ?',
      [cleanToMob]
    );

    const newCount = stats ? stats.count : 0;
    const newAvg = stats && stats.avgRating ? parseFloat(stats.avgRating.toFixed(1)) : 5.0;

    await database.run(
      'UPDATE Users SET avg_rating = ?, review_count = ? WHERE TRIM(mobile) = ?',
      [newAvg, newCount, cleanToMob]
    );

    await syncReviews();
    await syncUsers();

    // Emit real-time WebSocket notification to target user
    if (cleanToMob) {
      io.to(`user_${cleanToMob}`).emit('receive_message', {
        room: `user_${cleanToMob}`,
        message: {
          id: Date.now(),
          sender: 'system',
          text: `⭐ New ${numericRating}-Star Review received from ${from_user_name || 'Customer'}!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review: { order_id, from_user_mobile: cleanFromMob, to_user_mobile: cleanToMob, rating: numericRating, comment },
      user_rating: { avg_rating: newAvg, review_count: newCount }
    });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.get('/api/reviews/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) return res.json([]);

    const cleanMob = normalizePhone(identifier);
    const database = await ensureDb();

    const reviews = await database.all(
      `SELECT * FROM Reviews 
       WHERE TRIM(to_user_mobile) = ? OR TRIM(to_user_name) = ? OR TRIM(from_user_mobile) = ?
       ORDER BY id DESC`,
      [cleanMob, identifier.trim(), cleanMob]
    );

    res.json(reviews);
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/reviews/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { mobile } = req.query;
    if (!orderId) return res.json({ reviewed: false });

    const cleanMob = mobile ? normalizePhone(mobile) : '';
    const database = await ensureDb();

    const review = await database.get(
      'SELECT * FROM Reviews WHERE order_id = ? AND (TRIM(from_user_mobile) = ? OR ? = "")',
      [orderId, cleanMob, cleanMob]
    );

    res.json({ reviewed: !!review, review: review || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check order review status' });
  }
});

// Haversine Distance & Geo Helpers
const CITY_COORDS_MAP = {
  'karnal': [29.6857, 76.9905],
  'ludhiana': [30.9010, 75.8573],
  'jalandhar': [31.3260, 75.5762],
  'rohtak': [28.8955, 76.5831],
  'banda': [25.4764, 80.3346],
  'jaipur': [26.9124, 75.7873],
  'kota': [25.2138, 75.8648],
  'udaipur': [24.5854, 73.7125],
  'delhi': [28.6139, 77.2090],
  'punjab': [31.1471, 75.3412],
  'haryana': [29.0588, 76.0856],
  'uttar pradesh': [26.8467, 80.9462],
  'rajasthan': [27.0238, 74.2179],
  'amritsar': [31.6340, 74.8723],
  'patiala': [30.3398, 76.3869],
  'bathinda': [30.2110, 74.9455],
  'hisar': [29.1492, 75.7217],
  'panipat': [29.3909, 76.9635],
  'ambala': [30.3782, 76.7767],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'agra': [27.1767, 78.0081],
  'varanasi': [25.3176, 82.9739]
};

function getCoordsForLocation(locationName) {
  if (!locationName) return [28.6139, 77.2090];
  const clean = locationName.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS_MAP)) {
    if (clean.includes(city)) return coords;
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 25.0 + Math.abs((hash % 1000) / 100);
  const lng = 75.0 + Math.abs(((hash >> 3) % 1000) / 100);
  return [lat, lng];
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 25.0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Geo-Distance Nearby Farmers API
app.get('/api/farmers/nearby', async (req, res) => {
  try {
    const { lat, lng, location, radiusKm } = req.query;
    let buyerLat = parseFloat(lat);
    let buyerLng = parseFloat(lng);

    if (isNaN(buyerLat) || isNaN(buyerLng)) {
      const coords = getCoordsForLocation(location || 'Banda');
      buyerLat = coords[0];
      buyerLng = coords[1];
    }

    const maxRadius = parseFloat(radiusKm) || 500;
    const database = await ensureDb();

    // Fetch all registered farmers
    const farmers = await database.all(
      `SELECT id, user_id, name, mobile, location, role, profile_photo, business_name, bio, address, state, district, pincode, crops_specialty, avg_rating, review_count, latitude, longitude 
       FROM Users 
       WHERE role = 'seller'`
    );

    // Fetch all active crop listings
    const activeCrops = await database.all(
      "SELECT * FROM Crops WHERE status = 'active' OR status IS NULL"
    );

    const farmersWithDistance = farmers.map(farmer => {
      let fLat = farmer.latitude;
      let fLng = farmer.longitude;

      if (!fLat || !fLng) {
        const coords = getCoordsForLocation(farmer.location || farmer.district || farmer.state || farmer.name);
        fLat = coords[0];
        fLng = coords[1];
      }

      const dist = calculateDistanceKm(buyerLat, buyerLng, fLat, fLng);

      // Find crop listings for this farmer
      const farmerMobile = farmer.mobile ? farmer.mobile.trim() : '';
      const farmerName = farmer.name ? farmer.name.trim().toLowerCase() : '';

      const farmerCrops = activeCrops.filter(c => {
        const cMob = c.seller_mobile ? c.seller_mobile.trim() : '';
        const cSeller = c.seller ? c.seller.trim().toLowerCase() : '';
        return (cMob && cMob === farmerMobile) || (cSeller && cSeller === farmerName);
      });

      return {
        ...farmer,
        distance: dist,
        crops: farmerCrops
      };
    });

    // Filter within maxRadius and sort ascending by distance
    const sortedFarmers = farmersWithDistance
      .filter(f => f.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json(sortedFarmers);
  } catch (err) {
    console.error("Error in /api/farmers/nearby:", err);
    res.status(500).json({ error: 'Failed to fetch nearby farmers' });
  }
});

// Order Lifecycle Management API Endpoints
app.post('/api/orders', async (req, res) => {
  try {
    const { listing_id, buyer_mobile, buyer_name, seller_mobile, seller_name, bid_id, crop_name, quantity, final_price } = req.body;
    if (!buyer_mobile || !seller_mobile || !crop_name) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    const cleanBuyerMob = normalizePhone(buyer_mobile);
    const cleanSellerMob = normalizePhone(seller_mobile);
    const database = await ensureDb();

    const result = await database.run(
      `INSERT INTO Orders (listing_id, buyer_mobile, buyer_name, seller_mobile, seller_name, bid_id, crop_name, quantity, final_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing_id || 0,
        cleanBuyerMob,
        (buyer_name || 'Buyer').trim(),
        cleanSellerMob,
        (seller_name || 'Farmer').trim(),
        bid_id || null,
        (crop_name || 'Crop').trim(),
        (quantity || '1').toString().trim(),
        (final_price || '0').toString().trim(),
        'Confirmed'
      ]
    );

    await syncOrders();

    const newOrder = {
      id: result.lastID,
      listing_id: listing_id || 0,
      buyer_mobile: cleanBuyerMob,
      buyer_name,
      seller_mobile: cleanSellerMob,
      seller_name,
      bid_id: bid_id || null,
      crop_name,
      quantity,
      final_price,
      status: 'Confirmed',
      created_at: new Date().toISOString()
    };

    io.to(`user_${cleanBuyerMob}`).emit('order_created', newOrder);
    io.to(`user_${cleanSellerMob}`).emit('order_created', newOrder);

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders/my', async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.json([]);

    const cleanMob = normalizePhone(mobile);
    const database = await ensureDb();

    const orders = await database.all(
      `SELECT * FROM Orders 
       WHERE TRIM(buyer_mobile) = ? OR TRIM(seller_mobile) = ?
       ORDER BY id DESC`,
      [cleanMob, cleanMob]
    );

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition' });
    }

    const database = await ensureDb();
    const existing = await database.get('SELECT * FROM Orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await database.run(
      'UPDATE Orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    await syncOrders();

    const updatedOrder = { ...existing, status, updated_at: new Date().toISOString() };

    const cleanBuyer = normalizePhone(existing.buyer_mobile);
    const cleanSeller = normalizePhone(existing.seller_mobile);

    io.to(`user_${cleanBuyer}`).emit('order_status_updated', updatedOrder);
    io.to(`user_${cleanSeller}`).emit('order_status_updated', updatedOrder);

    res.json({ message: `Order status updated to ${status}`, order: updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Order Cancellation Endpoint
app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, cancelled_by_mobile, cancelled_by_name } = req.body;

    const database = await ensureDb();
    const existing = await database.get('SELECT * FROM Orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.status === 'Shipped' || existing.status === 'Delivered') {
      return res.status(400).json({ error: 'Order cannot be cancelled after shipment. Please raise a quality dispute instead.' });
    }

    const cleanByMob = normalizePhone(cancelled_by_mobile);

    await database.run(
      `UPDATE Orders SET 
        status = 'Cancelled', 
        cancel_reason = ?, 
        cancelled_by = ?, 
        cancelled_at = CURRENT_TIMESTAMP, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [reason || 'User cancelled order', (cancelled_by_name || 'User').trim(), id]
    );

    await syncOrders();

    const cancelledOrder = {
      ...existing,
      status: 'Cancelled',
      cancel_reason: reason,
      cancelled_by: cancelled_by_name,
      cancelled_at: new Date().toISOString()
    };

    const cleanBuyer = normalizePhone(existing.buyer_mobile);
    const cleanSeller = normalizePhone(existing.seller_mobile);

    io.to(`user_${cleanBuyer}`).emit('order_cancelled', cancelledOrder);
    io.to(`user_${cleanSeller}`).emit('order_cancelled', cancelledOrder);

    res.json({ message: 'Order cancelled successfully', order: cancelledOrder });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Return / Dispute Management Endpoints
app.post('/api/disputes', async (req, res) => {
  try {
    const { order_id, raised_by_mobile, raised_by_name, target_mobile, target_name, reason, evidence_photo } = req.body;
    if (!order_id || !raised_by_mobile || !reason) {
      return res.status(400).json({ error: 'Missing required dispute information' });
    }

    const cleanRaisedByMob = normalizePhone(raised_by_mobile);
    const cleanTargetMob = normalizePhone(target_mobile);
    const database = await ensureDb();

    // Verify order exists
    const order = await database.get('SELECT * FROM Orders WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Associated order not found' });
    }

    const result = await database.run(
      `INSERT INTO Disputes (order_id, raised_by_mobile, raised_by_name, target_mobile, target_name, reason, evidence_photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        cleanRaisedByMob,
        (raised_by_name || 'Customer').trim(),
        cleanTargetMob,
        (target_name || 'Farmer').trim(),
        (reason || '').trim(),
        evidence_photo || null,
        'Pending'
      ]
    );

    await syncDisputes();

    const newDispute = {
      id: result.lastID,
      order_id,
      raised_by_mobile: cleanRaisedByMob,
      raised_by_name,
      target_mobile: cleanTargetMob,
      target_name,
      reason,
      evidence_photo,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    io.to(`user_${cleanRaisedByMob}`).emit('dispute_created', newDispute);
    io.to(`user_${cleanTargetMob}`).emit('dispute_created', newDispute);

    res.status(201).json({ message: 'Dispute submitted for admin resolution', dispute: newDispute });
  } catch (err) {
    console.error("Error creating dispute:", err);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

app.get('/api/disputes/my', async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.json([]);

    const cleanMob = normalizePhone(mobile);
    const database = await ensureDb();

    const disputes = await database.all(
      `SELECT * FROM Disputes 
       WHERE TRIM(raised_by_mobile) = ? OR TRIM(target_mobile) = ?
       ORDER BY id DESC`,
      [cleanMob, cleanMob]
    );

    res.json(disputes);
  } catch (err) {
    console.error("Error fetching disputes:", err);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

app.get('/api/admin/disputes', async (req, res) => {
  try {
    const database = await ensureDb();
    const disputes = await database.all('SELECT * FROM Disputes ORDER BY id DESC');
    res.json(disputes);
  } catch (err) {
    console.error("Error fetching admin disputes:", err);
    res.status(500).json({ error: 'Failed to fetch admin disputes' });
  }
});

app.put('/api/admin/disputes/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolution_notes } = req.body;
    if (!resolution) {
      return res.status(400).json({ error: 'Resolution action is required' });
    }

    const database = await ensureDb();
    const existing = await database.get('SELECT * FROM Disputes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Dispute claim not found' });
    }

    await database.run(
      `UPDATE Disputes SET 
        status = 'Resolved',
        resolution = ?,
        resolution_notes = ?,
        resolved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [resolution, resolution_notes || null, id]
    );

    await syncDisputes();

    const updatedDispute = {
      ...existing,
      status: 'Resolved',
      resolution,
      resolution_notes,
      resolved_at: new Date().toISOString()
    };

    const cleanRaised = normalizePhone(existing.raised_by_mobile);
    const cleanTarget = normalizePhone(existing.target_mobile);

    io.to(`user_${cleanRaised}`).emit('dispute_status_updated', updatedDispute);
    io.to(`user_${cleanTarget}`).emit('dispute_status_updated', updatedDispute);

    res.json({ message: 'Dispute resolved successfully', dispute: updatedDispute });
  } catch (err) {
    console.error("Error resolving dispute:", err);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

// Bulk Upload & Inventory Stock Endpoints
app.get('/api/listings/bulk-template', (req, res) => {
  const csvTemplate = `Crop Name,Weight (Quintals),Rate (Rs per Quintal),Location
Gehu (Sarbati Wheat),100,2450,Banda, Uttar Pradesh
Basmati Dhan (Rice),80,3100,Karnal, Haryana
Sarson (Mustard),60,5450,Jaipur, Rajasthan
Makka (Maize),50,1850,Ludhiana, Punjab`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="kishanmarket_bulk_template.csv"');
  res.status(200).send(csvTemplate);
});

app.post('/api/listings/bulk-upload', async (req, res) => {
  try {
    const { seller_mobile, seller_name, default_location, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No crop listings provided for bulk upload' });
    }

    const database = await ensureDb();
    const cleanMob = normalizePhone(seller_mobile);
    const sName = (seller_name || 'Farmer').trim();
    const defLoc = (default_location || 'Local Mandi').trim();

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const cropName = (row.name || row.crop || row['Crop Name'] || '').toString().trim();
      const weightVal = parseFloat(row.weight || row.Weight || row['Weight (Quintals)'] || 0);
      const rateVal = parseFloat(row.rate || row.Rate || row['Rate (Rs per Quintal)'] || 0);
      const locVal = (row.loc || row.location || row.Location || defLoc).toString().trim();

      if (!cropName || weightVal <= 0 || rateVal <= 0) {
        errors.push(`Row ${i + 1}: Invalid crop name (${cropName}), weight (${weightVal}), or rate (${rateVal})`);
        continue;
      }

      await database.run(
        'INSERT INTO Crops (name, weight, rate, seller, loc, seller_mobile, total_quantity, available_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cropName, weightVal.toString(), rateVal.toString(), sName, locVal, cleanMob, weightVal, weightVal, 'active']
      );

      insertedCount++;
    }

    await syncCrops();
    io.emit('crop_price_updated', { bulk: true, count: insertedCount });

    res.json({
      message: `Successfully uploaded ${insertedCount} crop listings`,
      insertedCount,
      errorsCount: errors.length,
      errors
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: 'Failed to process bulk upload' });
  }
});

app.put('/api/listings/:id/adjust-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { available_quantity, total_quantity } = req.body;

    const database = await ensureDb();
    const crop = await database.get('SELECT * FROM Crops WHERE id = ?', [id]);
    if (!crop) return res.status(404).json({ error: 'Crop listing not found' });

    const newAvail = parseFloat(available_quantity);
    if (isNaN(newAvail)) return res.status(400).json({ error: 'Invalid available quantity' });

    const newTotal = total_quantity !== undefined ? parseFloat(total_quantity) : (crop.total_quantity || parseFloat(crop.weight) || 50);
    const isSoldOut = newAvail <= 0;
    const newStatus = isSoldOut ? 'sold' : (crop.status === 'sold' ? 'active' : crop.status);

    await database.run(
      'UPDATE Crops SET available_quantity = ?, total_quantity = ?, status = ? WHERE id = ?',
      [newAvail, newTotal, newStatus, id]
    );

    await syncCrops();

    const stockPayload = { crop_id: parseInt(id, 10), available_quantity: newAvail, total_quantity: newTotal, status: newStatus };
    io.emit('listing_stock_updated', stockPayload);

    res.json({ message: 'Stock adjusted successfully', stock: stockPayload });
  } catch (err) {
    console.error("Adjust stock error:", err);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Seasonal Crop Suggestions Endpoint
app.get('/api/seasonal-crops', async (req, res) => {
  try {
    const currentMonthNum = req.query.month ? parseInt(req.query.month, 10) : (new Date().getMonth() + 1);
    const database = await ensureDb();

    const allSeasonal = await database.all('SELECT * FROM SeasonalCrops');
    const matchedCrops = allSeasonal.filter(sc => {
      const monthsArr = sc.months.split(',').map(m => parseInt(m.trim(), 10));
      return monthsArr.includes(currentMonthNum);
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonthNum - 1] || "Current Month";

    let seasonName = "Rabi";
    if (currentMonthNum >= 6 && currentMonthNum <= 10) seasonName = "Kharif";
    else if (currentMonthNum >= 3 && currentMonthNum <= 5) seasonName = "Zaid";

    res.json({
      month: currentMonthNum,
      monthName,
      seasonName,
      crops: matchedCrops
    });
  } catch (err) {
    console.error("Error fetching seasonal crops:", err);
    res.status(500).json({ error: 'Failed to fetch seasonal crop suggestions' });
  }
});

// Unified Financial Transaction History & Passbook Endpoint
app.get('/api/transactions', async (req, res) => {
  try {
    const { mobile, type, from, to } = req.query;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

    const cleanMob = normalizePhone(mobile);
    const database = await ensureDb();

    // 1. Fetch user orders (Purchases & Sales)
    const orders = await database.all(
      `SELECT * FROM Orders 
       WHERE TRIM(buyer_mobile) = ? OR TRIM(seller_mobile) = ?
       ORDER BY id DESC`,
      [cleanMob, cleanMob]
    );

    // 2. Fetch user disputes / refunds
    const disputes = await database.all(
      `SELECT * FROM Disputes 
       WHERE TRIM(raised_by_mobile) = ? OR TRIM(target_mobile) = ?
       ORDER BY id DESC`,
      [cleanMob, cleanMob]
    );

    let ledger = [];

    // Map Orders to Ledger entries
    for (const o of orders) {
      const isBuyer = normalizePhone(o.buyer_mobile) === cleanMob;
      const amountVal = (parseFloat(o.final_price) || 0) * (parseFloat(o.quantity) || 1);
      const isCancelled = o.status === 'Cancelled';

      ledger.push({
        id: `ORD-${o.id}`,
        order_id: o.id,
        date: o.created_at || new Date().toISOString(),
        category: isCancelled ? 'Cancellation' : (isBuyer ? 'Purchase' : 'Sale'),
        description: `${o.crop_name} (${o.quantity} quintals)`,
        party_name: isBuyer ? o.seller_name : o.buyer_name,
        party_mobile: isBuyer ? o.seller_mobile : o.buyer_mobile,
        direction: isCancelled ? 'neutral' : (isBuyer ? 'debit' : 'credit'),
        amount: amountVal,
        status: o.status,
        invoice_number: o.invoice_number || `KM-INV-2026-${String(o.id).padStart(4, '0')}`
      });
    }

    // Map Disputes to Ledger entries
    for (const d of disputes) {
      if (d.status === 'Resolved' && d.resolution === 'Refund Approved') {
        const isClaimant = normalizePhone(d.raised_by_mobile) === cleanMob;
        ledger.push({
          id: `DSP-${d.id}`,
          order_id: d.order_id,
          date: d.resolved_at || d.created_at,
          category: 'Refund',
          description: `Dispute Refund for Order #${d.order_id}`,
          party_name: isClaimant ? d.target_name : d.raised_by_name,
          party_mobile: isClaimant ? d.target_mobile : d.raised_by_mobile,
          direction: isClaimant ? 'credit' : 'debit',
          amount: 0, // Recorded as refund adjustment
          status: 'Refunded',
          invoice_number: null
        });
      }
    }

    // Sort chronologically (newest first)
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by type if requested
    if (type && type !== 'all') {
      ledger = ledger.filter(item => item.category.toLowerCase() === type.toLowerCase());
    }

    // Date range filter
    if (from) {
      const fromDate = new Date(from);
      ledger = ledger.filter(item => new Date(item.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      ledger = ledger.filter(item => new Date(item.date) <= toDate);
    }

    // Calculate Summary Metrics
    let totalEarnings = 0;
    let totalSpent = 0;

    ledger.forEach(item => {
      if (item.status !== 'Cancelled') {
        if (item.direction === 'credit') totalEarnings += item.amount;
        if (item.direction === 'debit') totalSpent += item.amount;
      }
    });

    res.json({
      summary: {
        totalEarnings,
        totalSpent,
        netBalance: totalEarnings - totalSpent,
        transactionCount: ledger.length
      },
      transactions: ledger
    });
  } catch (err) {
    console.error("Error generating transactions ledger:", err);
    res.status(500).json({ error: 'Failed to generate transaction history' });
  }
});

// Official B2B Tax Invoice Generator Endpoint
app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const database = await ensureDb();

    const order = await database.get('SELECT * FROM Orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Order record not found' });

    // Generate or fetch invoice number
    let invNum = order.invoice_number;
    if (!invNum) {
      invNum = `KM-INV-2026-${String(order.id).padStart(4, '0')}`;
      await database.run('UPDATE Orders SET invoice_number = ? WHERE id = ?', [invNum, id]);
      await syncOrders();
    }

    // Fetch Seller & Buyer Profile metadata for GST / Business Address
    const sellerProf = await database.get('SELECT * FROM Users WHERE TRIM(mobile) = ?', [normalizePhone(order.seller_mobile)]) || {};
    const buyerProf = await database.get('SELECT * FROM Users WHERE TRIM(mobile) = ?', [normalizePhone(order.buyer_mobile)]) || {};

    const qtyVal = parseFloat(order.quantity) || 1;
    const rateVal = parseFloat(order.final_price) || 0;
    const subtotal = qtyVal * rateVal;

    // 5% Agri Tax breakdown (2.5% CGST + 2.5% SGST)
    const taxableValue = Math.round((subtotal / 1.05) * 100) / 100;
    const cgst = Math.round(((subtotal - taxableValue) / 2) * 100) / 100;
    const sgst = cgst;

    const invoiceData = {
      invoiceNumber: invNum,
      invoiceDate: order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
      orderId: order.id,
      status: order.status,
      seller: {
        name: sellerProf.name || order.seller_name,
        businessName: sellerProf.business_name || 'Kishan Krishi Kendra',
        mobile: order.seller_mobile,
        address: sellerProf.address || sellerProf.location || 'Rural Mandi Complex',
        district: sellerProf.district || sellerProf.state || 'Uttar Pradesh',
        pincode: sellerProf.pincode || '210001',
        gstin: '09AAACK1234F1Z9' // Demo Agri GSTIN
      },
      buyer: {
        name: buyerProf.name || order.buyer_name,
        businessName: buyerProf.business_name || 'Agri Procurement Ltd',
        mobile: order.buyer_mobile,
        address: buyerProf.address || buyerProf.location || 'Wholesale Grain Market',
        district: buyerProf.district || buyerProf.state || 'India',
        pincode: buyerProf.pincode || '110001'
      },
      cropName: order.crop_name,
      quantityQuintals: qtyVal,
      ratePerQuintal: rateVal,
      financials: {
        subtotal,
        taxableValue,
        cgst,
        sgst,
        totalTax: cgst + sgst,
        grandTotal: subtotal
      },
      verificationSeal: `DIGI-VERIFIED-KM-${order.id}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    res.json(invoiceData);
  } catch (err) {
    console.error("Error generating tax invoice:", err);
    res.status(500).json({ error: 'Failed to generate tax invoice' });
  }
});

// Delivery & Logistics Tracking Endpoints
app.put('/api/orders/:id/shipment', async (req, res) => {
  try {
    const { id } = req.params;
    const { transporter_name, vehicle_no, tracking_id, driver_phone, est_delivery_date } = req.body;

    const database = await ensureDb();
    const existing = await database.get('SELECT * FROM Orders WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Order record not found' });

    const trackId = tracking_id || `LR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    await database.run(
      `UPDATE Orders SET 
        status = 'Shipped',
        transporter_name = ?,
        vehicle_no = ?,
        tracking_id = ?,
        driver_phone = ?,
        est_delivery_date = ?,
        dispatched_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        transporter_name || 'VRL Logistics / Local Truck',
        vehicle_no || 'UP 78 BT 4521',
        trackId,
        driver_phone || '9876543210',
        est_delivery_date || '2-3 Business Days',
        id
      ]
    );

    await syncOrders();

    const updatedOrder = {
      ...existing,
      status: 'Shipped',
      transporter_name: transporter_name || 'VRL Logistics / Local Truck',
      vehicle_no: vehicle_no || 'UP 78 BT 4521',
      tracking_id: trackId,
      driver_phone: driver_phone || '9876543210',
      est_delivery_date: est_delivery_date || '2-3 Business Days',
      dispatched_at: new Date().toISOString()
    };

    const cleanBuyer = normalizePhone(existing.buyer_mobile);
    const cleanSeller = normalizePhone(existing.seller_mobile);

    io.to(`user_${cleanBuyer}`).emit('order_shipment_updated', updatedOrder);
    io.to(`user_${cleanSeller}`).emit('order_shipment_updated', updatedOrder);
    io.to(`user_${cleanBuyer}`).emit('order_status_updated', updatedOrder);
    io.to(`user_${cleanSeller}`).emit('order_status_updated', updatedOrder);

    res.json({ message: 'Shipment dispatched successfully', order: updatedOrder });
  } catch (err) {
    console.error("Error updating shipment info:", err);
    res.status(500).json({ error: 'Failed to update shipment details' });
  }
});

app.get('/api/orders/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const database = await ensureDb();

    const order = await database.get('SELECT * FROM Orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Order record not found' });

    res.json({
      orderId: order.id,
      status: order.status,
      cropName: order.crop_name,
      quantity: order.quantity,
      transporterName: order.transporter_name || 'Agri Logistics Partner',
      vehicleNo: order.vehicle_no || 'N/A',
      trackingId: order.tracking_id || 'N/A',
      driverPhone: order.driver_phone || '',
      estDeliveryDate: order.est_delivery_date || '2-3 Days',
      dispatchedAt: order.dispatched_at || order.updated_at || order.created_at
    });
  } catch (err) {
    console.error("Error fetching tracking info:", err);
    res.status(500).json({ error: 'Failed to fetch tracking details' });
  }
});

const normalizePhone = (p) => {
  if (!p) return '';
  const digits = p.toString().replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

app.post('/api/register', async (req, res) => {
  const { name, mobile, location, role, password } = req.body;
  if (!mobile || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanMobile = normalizePhone(mobile);
  const rawMobile = mobile.toString().trim();
  const cleanPassword = password.toString().trim();
  const cleanName = (name || '').toString().trim();
  const cleanLoc = (location || '').toString().trim();

  try {
    const database = await ensureDb();
    const existingUser = await database.get(
      'SELECT * FROM Users WHERE TRIM(mobile) = ? OR TRIM(mobile) = ?',
      [cleanMobile, rawMobile]
    );
    if (existingUser) {
      return res.status(409).json({ error: 'User with this mobile already exists. Please login.' });
    }

    const countRow = await database.get('SELECT COUNT(*) as count FROM Users');
    const nextCount = (countRow ? countRow.count : 0) + 1;
    const user_id = role === 'seller' ? `KM-S-${1000 + nextCount}` : `KM-B-${1000 + nextCount}`;

    await database.run(
      'INSERT INTO Users (user_id, name, mobile, location, role, password) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, cleanName, cleanMobile, cleanLoc, role, cleanPassword]
    );

    await syncUsers();

    res.status(201).json({ message: 'User registered successfully', user: { user_id, name: cleanName, mobile: cleanMobile, role, location: cleanLoc } });
  } catch (e) {
    console.error("DB Error:", e);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) return res.status(400).json({ error: 'Missing credentials' });

  const cleanMobile = normalizePhone(mobile);
  const rawMobile = mobile.toString().trim();
  const cleanPassword = password.toString().trim();

  try {
    const database = await ensureDb();
    const foundUser = await database.get(
      'SELECT * FROM Users WHERE (TRIM(mobile) = ? OR TRIM(mobile) = ?) AND TRIM(password) = ?',
      [cleanMobile, rawMobile, cleanPassword]
    );
    if (foundUser) {
      if (!foundUser.user_id) {
        const genId = foundUser.role === 'seller' ? `KM-S-${1000 + foundUser.id}` : `KM-B-${1000 + foundUser.id}`;
        await database.run('UPDATE Users SET user_id = ? WHERE id = ?', [genId, foundUser.id]);
        foundUser.user_id = genId;
        await syncUsers();
      }
      const { password, ...userWithoutPassword } = foundUser;
      res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Please check your mobile number and password.' });
    }
  } catch (e) {
    console.error("DB Error:", e);
    res.status(500).json({ error: 'Server error' });
  }
});

// SPA Fallback for React Router (Express 5 Compatible)
if (fs.existsSync(distDir)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

server.listen(PORT, () => {
  console.log(`KishanMarket Backend is running on http://localhost:${PORT}`);
});
