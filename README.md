# 🌾 KishanMarket (KishaanMarket) — Agritech Direct Trading Platform
> **Empowering Farmers with Direct Buyer Connections, Real-Time Bidding & Isolated P2P Negotiation**

---

## 📌 Project Overview
**KishanMarket** is a full-stack agritech marketplace designed to eliminate middleman exploitation in agricultural trade. By directly bridging the gap between **Farmers (Sellers / Kisan)** and **Wholesalers/Traders (Buyers / Vyapari)**, KishanMarket provides transparent price discovery, real-time negotiation, and direct order fulfillment.

---

## 🌟 Key Features
- **Direct P2P Trading**: Zero commission fees; direct financial and trade negotiation between Kisan and Vyapari.
- **Isolated 1-on-1 Customer Chat Boxes**: Every buyer chatting with a seller about a specific crop gets a completely separate, private negotiation room.
- **Live Bidding System (Boli System)**: Buyers can place custom rate bids; sellers can **Accept**, **Reject**, or issue **Counter-Offers** in real time.
- **Demand Broadcasting ("Apni Zarurat")**: Buyers can post crop procurement requirements with custom budgets.
- **Real-Time Mandi Price Ticker**: Live market trend discovery for major crops (Wheat, Rice, Maize, Mustard, Chana).
- **Logistics & Profitability Calculator**: Automatically calculates net profit after estimated transport costs based on location distance.
- **Dual-Engine Persistence**: SQLite for high-speed local processing + automatic MongoDB Atlas Cloud synchronization for permanent cloud hosting (Render).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React.js, Vite, Bootstrap 5 / Glassmorphism Vanilla CSS, FontAwesome Icons, Hot Toast |
| **Real-Time Messaging** | Socket.io (WebSockets) |
| **Backend Server** | Node.js, Express.js |
| **Database & Persistence** | SQLite3 (`database.sqlite`), Mongoose (`MongoDB Atlas Cloud Sync`) |
| **Deployment & Hosting** | Render Web Services (Production), GitHub Version Control |

---

## 🚀 Detailed Module Breakdown

### 1. Dual-Role Authentication & Access Control
- Dedicated signup/login portals for **Sellers (Farmers)** and **Buyers (Traders)**.
- Normalizes mobile numbers and assigns permanent Customer IDs (`KM-S-XXXX` for Sellers, `KM-B-XXXX` for Buyers).
- Route guards prevent unauthorized access to role-specific dashboards.

### 2. Isolated Customer-to-Client 1-on-1 Chat Engine
- Each negotiation creates a canonical room ID: `room_c{cropId}_s_{sellerMobile}_b_{buyerMobile}`.
- Messages carry complete metadata (`sender_name`, `sender_mobile`, `receiver_name`, `receiver_mobile`, `crop_name`, `crop_id`).
- Real-time personal WebSocket channels (`user_{mobile}` & `user_{name}`) push instant notification toasts across windows.
- Navbar **Messages 💬** drawer lets users manage all ongoing conversations with unread badges and last-message previews.

### 3. Live Bidding & Counter-Offer Engine ("Boli System")
- Buyers click **Boli Lagayein** to submit custom bids below or above asking rate.
- Sellers receive instant bid alerts on their dashboard.
- Sellers can click:
  - **Accept**: Finalizes transaction and marks crop listing as SOLD.
  - **Reject**: Declines bid.
  - **Counter ₹**: Proposes a new rate back to the buyer in real time.

### 4. Buyer Demand Requests ("Apni Zarurat")
- Buyers post specific crop procurement needs (e.g., 50 quintals Dhan @ ₹2100/q budget).
- Posted requests are broadcast to sellers, who can click **Chat** to fulfill the order directly.

### 5. Mandi Market Intelligence & Ticker
- Displays live average mandi rates and percentage trends.
- Dynamically updates averages based on active marketplace listings.

---

## 📥 Local Setup & Installation

### Prerequisites
- Node.js `v22.x` or higher
- npm `v9.x` or higher

```bash
# Clone Repository
git clone https://github.com/harshit3003/KishanMarket.git
cd KishanMarket

# Install & Build
npm run build

# Start Backend Server (Port 5000)
npm start

# Start Frontend Dev Server (Port 5173)
cd FrontEnd && npm run dev
```

---

## 🌐 Live Render Deployment
- **Live Application URL**: [https://kishanmarket.onrender.com](https://kishanmarket.onrender.com)
- **GitHub Repository**: [https://github.com/harshit3003/KishanMarket.git](https://github.com/harshit3003/KishanMarket.git)