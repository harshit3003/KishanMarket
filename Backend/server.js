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
  if (!db) return;
  try {
    const msgs = await db.all('SELECT * FROM Messages');
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
            data.sender_name || message.sender_name || null,
            data.sender_mobile || message.sender_mobile || null,
            data.receiver_mobile || message.receiver_mobile || null,
            data.crop_name || message.crop_name || null,
            data.crop_id || message.crop_id || null
          ]
        );
        await syncMessages();
      } catch (e) {
        console.error('Failed to save message:', e);
      }
    }
    io.to(room).emit('receive_message', data);
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

let db;
initDb().then(connection => {
  db = connection;
  console.log('SQLite Database connected and initialized successfully.');
}).catch(err => {
  console.error('Database connection failed', err);
});

// Server-side file backup sync helpers
async function syncUsers() {
  if (!db) return;
  try {
    const users = await db.all('SELECT user_id, name, mobile, location, role, password FROM Users');
    saveTableToFile('users.json', users);
  } catch (e) {}
}

async function syncCrops() {
  if (!db) return;
  try {
    const crops = await db.all('SELECT * FROM Crops');
    saveTableToFile('crops.json', crops);
  } catch (e) {}
}

async function syncRequests() {
  if (!db) return;
  try {
    const reqs = await db.all('SELECT * FROM BuyerRequests');
    saveTableToFile('buyer_requests.json', reqs);
  } catch (e) {}
}

async function syncBids() {
  if (!db) return;
  try {
    const bids = await db.all('SELECT * FROM Bids');
    saveTableToFile('bids.json', bids);
  } catch (e) {}
}

// --- Endpoints ---

// SQL Endpoints
app.get('/api/crops', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    let crops;
    if (limit > 0) {
      crops = await db.all("SELECT * FROM Crops WHERE status='active' ORDER BY id DESC LIMIT ?", [limit]);
    } else {
      crops = await db.all("SELECT * FROM Crops WHERE status='active' ORDER BY id DESC");
    }
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
    const result = await db.run(
      'INSERT INTO Crops (name, weight, rate, seller, loc, seller_mobile) VALUES (?, ?, ?, ?, ?, ?)',
      [name, weight, rate, seller, loc, seller_mobile]
    );
    await syncCrops();
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
    const { mobile } = req.query;
    if (!mobile) return res.json([]);
    const cleanMob = mobile.toString().replace(/\D/g, '');

    const rows = await db.all(
      `SELECT room_id, sender, text, time, sender_name, sender_mobile, receiver_mobile, crop_name, crop_id, created_at
       FROM Messages
       WHERE room_id LIKE ? OR sender_mobile LIKE ? OR receiver_mobile LIKE ? OR room_id LIKE ?
       ORDER BY id DESC`,
      [`%${cleanMob}%`, `%${cleanMob}%`, `%${cleanMob}%`, `%_${mobile}_%`]
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
    if (bid && status === 'accepted' && bid.crop_id && bid.crop_id !== 0) {
      await db.run('UPDATE Crops SET rate = ?, status = ? WHERE id = ?', [bid.bid_rate, 'sold', bid.crop_id]);
      await db.run('UPDATE Bids SET status = ? WHERE crop_id = ? AND id != ? AND status = ?', ['expired', bid.crop_id, req.params.id, 'pending']);
      await syncBids();
      await syncCrops();
      io.emit('crop_price_updated', { crop_id: bid.crop_id, crop_name: bid.crop_name, new_rate: bid.bid_rate, status: 'sold' });
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
    const existingUser = await db.get(
      'SELECT * FROM Users WHERE TRIM(mobile) = ? OR TRIM(mobile) = ?',
      [cleanMobile, rawMobile]
    );
    if (existingUser) {
      return res.status(409).json({ error: 'User with this mobile already exists. Please login.' });
    }

    const countRow = await db.get('SELECT COUNT(*) as count FROM Users');
    const nextCount = (countRow ? countRow.count : 0) + 1;
    const user_id = role === 'seller' ? `KM-S-${1000 + nextCount}` : `KM-B-${1000 + nextCount}`;

    await db.run(
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
    const foundUser = await db.get(
      'SELECT * FROM Users WHERE (TRIM(mobile) = ? OR TRIM(mobile) = ?) AND TRIM(password) = ?',
      [cleanMobile, rawMobile, cleanPassword]
    );
    if (foundUser) {
      if (!foundUser.user_id) {
        const genId = foundUser.role === 'seller' ? `KM-S-${1000 + foundUser.id}` : `KM-B-${1000 + foundUser.id}`;
        await db.run('UPDATE Users SET user_id = ? WHERE id = ?', [genId, foundUser.id]);
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
