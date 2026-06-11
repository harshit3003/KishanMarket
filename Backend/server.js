const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1 style="color: #28a745;">KishanMarket API is Running! 🚀</h1>
        <p>This is the backend data server. Your frontend should communicate with the <code>/api</code> endpoints here.</p>
        <p>Please return to your Vite frontend (usually <a href="http://localhost:5173">http://localhost:5173</a>) to view the actual application.</p>
      </body>
    </html>
  `);
});

const dataDir = path.join(__dirname, '..', 'DataStorage');

// Helper to read and optionally limit JSON data
const serveData = (filename, req, res) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Data not found' });
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(rawData);

    // Dynamic ?limit=X slicing optimization
    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        data = data.slice(0, limit);
      }
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error reading data' });
  }
};

// --- Endpoints ---

// Buyer Endpoints
app.get('/api/buyer-purchases', (req, res) => serveData('buyer-purchases.json', req, res));
app.get('/api/buyers_data', (req, res) => serveData('buyers_data.json', req, res));

// Market Endpoints
app.get('/api/market-intel', (req, res) => serveData('market-intel.json', req, res));
app.get('/api/crops', (req, res) => serveData('crops_data.json', req, res));

// Seller Endpoints
app.get('/api/seller-sales', (req, res) => serveData('seller-sales.json', req, res));
app.get('/api/seller-market-intel', (req, res) => serveData('seller-market-intel.json', req, res));
app.get('/api/seller-predictions', (req, res) => serveData('seller-predictions.json', req, res));

// --- Auth Endpoints ---

app.post('/api/register', (req, res) => {
  const { name, mobile, location, role, password } = req.body;
  if (!mobile || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const usersFile = path.join(dataDir, 'users.json');
  let users = [];
  
  if (fs.existsSync(usersFile)) {
    try {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (e) {
      console.error("Error reading users.json", e);
    }
  }

  const existingUser = users.find(u => u.mobile === mobile);
  if (existingUser) {
    return res.status(409).json({ error: 'User with this mobile already exists' });
  }

  const newUser = { name, mobile, location, role, password, id: Date.now() };
  users.push(newUser);

  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'User registered successfully', user: { name, mobile, role, location } });
  } catch (e) {
    console.error("Error writing users.json", e);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.listen(PORT, () => {
  console.log(`KishanMarket Backend is running on http://localhost:${PORT}`);
});
