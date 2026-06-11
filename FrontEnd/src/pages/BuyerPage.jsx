import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import BackgroundLayer from '../components/BackgroundLayer';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/buyer-style.css';

import NegotiationChat from '../components/BuyerFeatures/NegotiationChat';

const defaultCrops = [
  { id: 1, name: "Gehu (Sarbati)", weight: "50", rate: "2450", seller: "Kishan Singh", loc: "Punjab" },
  { id: 2, name: "Basmati Dhan", weight: "120", rate: "3100", seller: "Harsh Patel", loc: "Haryana" },
  { id: 3, name: "Organic Makka", weight: "85", rate: "1900", seller: "Ram Lal", loc: "UP" }
];

const mandiLocations = [
  { id: 1, lat: 26.9124, lng: 75.7873, name: 'Jaipur Mandi', crop: 'Gehu', rate: '₹2,450/q' },
  { id: 2, lat: 25.1622, lng: 75.8202, name: 'Kota Mandi', crop: 'Dhan', rate: '₹3,200/q' },
  { id: 3, lat: 24.5854, lng: 73.7125, name: 'Udaipur Mandi', crop: 'Makka', rate: '₹1,890/q' },
];

const BuyerPage = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', role: 'buyer' });
  const [allCrops, setAllCrops] = useState(defaultCrops);
  const [displayedCrops, setDisplayedCrops] = useState(defaultCrops);
  const [watchlist, setWatchlist] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  // Search State
  const [searchLoc, setSearchLoc] = useState('');
  const [cropType, setCropType] = useState('All');
  const [activeFilter, setActiveFilter] = useState('all');

  // Request Form State
  const [reqCrop, setReqCrop] = useState('');
  const [reqBudget, setReqBudget] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const savedCrops = JSON.parse(localStorage.getItem('myCrops')) || [];
    // Convert seller crops to buyer view format
    const mappedCrops = savedCrops.map((c, i) => ({
      id: 100 + i, name: c.name, weight: c.weight, rate: c.rate, seller: "Local Farmer", loc: "Nearby"
    }));

    setAllCrops([...defaultCrops, ...mappedCrops]);
    setDisplayedCrops([...defaultCrops, ...mappedCrops]);

    const savedReqs = JSON.parse(localStorage.getItem('buyerRequests')) || [];
    setMyRequests(savedReqs);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('displayUserName');
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters(activeFilter, searchLoc, cropType);
  };

  const handleFilterClick = (filterValue) => {
    setActiveFilter(filterValue);
    applyFilters(filterValue, searchLoc, cropType);
  };

  const applyFilters = (filterBtn, loc, type) => {
    let filtered = allCrops;

    // Filter by type dropdown
    if (type !== "All") {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(type.toLowerCase()));
    }

    // Filter by pill
    if (filterBtn !== 'all') {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(filterBtn.toLowerCase()));
    }

    // Filter by location
    if (loc) {
      filtered = filtered.filter(c => c.loc.toLowerCase().includes(loc.toLowerCase()));
    }

    setDisplayedCrops(filtered);
  };

  const toggleWatchlist = (crop) => {
    const exists = watchlist.find(c => c.id === crop.id);
    if (exists) {
      setWatchlist(watchlist.filter(c => c.id !== crop.id));
    } else {
      if (window.confirm("Is crop ko apni watchlist mein daalna chahte hain?")) {
        toast.success(`${crop.name} added to watchlist!`);
        setWatchlist([...watchlist, crop]);
      }
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!reqCrop || !reqBudget) return;

    const newReq = { crop: reqCrop, budget: reqBudget, status: 'Pending' };
    const updated = [newReq, ...myRequests];
    setMyRequests(updated);
    localStorage.setItem('buyerRequests', JSON.stringify(updated));
    setReqCrop('');
    setReqBudget('');
    toast.success("Request Posted! Sellers will contact you shortly.");
  };

  return (
    <>
      <BackgroundLayer />

      <nav className="navbar navbar-dark shadow-sm mb-4">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold" to="/buyer"><i className="fas fa-seedling me-2"></i>Kishan<span>Market</span></Link>

          <div className="profile-container position-relative">
            <i className="fas fa-user-circle fa-2x text-white" id="profileIcon" style={{ cursor: 'pointer' }} onClick={toggleProfile}></i>
            <div className="profile-dropdown shadow-lg" id="profileDropdown" style={{ display: isProfileOpen ? 'block' : 'none' }}>
              <div className="dropdown-user-info">
                <h6 className="m-0 fw-bold" id="buyerProfileName">{currentUser.name}</h6>
                <small className="text-muted">Buyer ID: KB-2026</small>
              </div>
              <ul className="dropdown-links-list">
                <li><Link to="/profile/buyer"><i className="fas fa-user"></i> My Profile</Link></li>
                <li><Link to="/orders"><i className="fas fa-shopping-basket"></i> My Orders</Link></li>
                <li><a href="#"><i className="fas fa-heart"></i> Watchlist</a></li>
                <li><Link to="/seller"><i className="fas fa-shopping-basket"></i> Sell Grains</Link></li>

                <li className="dropdown-divider"></li>
                <li><a href="#" className="logout-item" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="trending-ticker-container mb-4 shadow">
          <div className="ticker-header">
            <div className="live-dot"></div>
            <span className="fw-bold">LIVE MANDI RATES</span>
          </div>
          <div className="ticker-content">
            <div className="rate-item">
              <span className="crop-name">Gehu</span>
              <span className="crop-price">₹2,450/q</span>
              <span className="price-up"><i className="fas fa-caret-up"></i> +₹50</span>
            </div>
            <div className="rate-item">
              <span className="crop-name">Dhan</span>
              <span className="crop-price">₹2,100/q</span>
              <span className="price-down"><i className="fas fa-caret-down"></i> -₹20</span>
            </div>
            <div className="rate-item">
              <span className="crop-name">Makka</span>
              <span className="crop-price">₹1,850/q</span>
              <span className="price-up"><i className="fas fa-caret-up"></i> +₹15</span>
            </div>
          </div>
        </div>

        {/* Live Analytics Chart Component */}
        <div className="analytics-card">
          <div className="chart-header">
            <h5 className="chart-title"><i className="fas fa-chart-line me-2"></i> Wheat (Gehu) 30-Day Price Trend</h5>
            <span className="badge bg-success rounded-pill px-3 py-2">+4.2% This Month</span>
          </div>
          <div className="chart-container">
            <div className="chart-bar-wrapper">
              <span className="chart-tooltip">₹2100</span>
              <div className="chart-bar" style={{ height: '50%' }}></div>
              <span className="chart-label">Week 1</span>
            </div>
            <div className="chart-bar-wrapper">
              <span className="chart-tooltip">₹2150</span>
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <span className="chart-label">Week 2</span>
            </div>
            <div className="chart-bar-wrapper">
              <span className="chart-tooltip">₹2300</span>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <span className="chart-label">Week 3</span>
            </div>
            <div className="chart-bar-wrapper">
              <span className="chart-tooltip">₹2450</span>
              <div className="chart-bar" style={{ height: '100%' }}></div>
              <span className="chart-label">Week 4</span>
            </div>
          </div>
        </div>

        {/* Interactive Mandi Map */}
        <div className="glass-card p-4 mb-5 shadow-sm border-accent">
          <h5 className="text-success fw-bold mb-3"><i className="fas fa-map-marker-alt me-2"></i> Live Mandi Map</h5>
          <div className="mandi-map-container" style={{ height: '300px', backgroundColor: '#e9ecef', borderRadius: '10px', overflow: 'hidden' }}>
            <MapContainer center={[25.5, 75]} zoom={6} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mandiLocations.map(m => (
                <Marker key={m.id} position={[m.lat, m.lng]}>
                  <Popup>
                    <strong>{m.name}</strong><br />
                    {m.crop} - {m.rate}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="glass-card p-4 mb-5 shadow-sm border-accent">
          <h5 className="text-success fw-bold mb-3"><i className="fas fa-search me-2"></i> Fasal Dhundein (Search Crops)</h5>
          <form className="row g-3" onSubmit={handleSearch}>
            <div className="col-md-5">
              <input type="text" className="form-control custom-input" placeholder="Location se search karein..." value={searchLoc} onChange={(e) => setSearchLoc(e.target.value)} />
            </div>
            <div className="col-md-5">
              <select className="form-select custom-input" value={cropType} onChange={(e) => setCropType(e.target.value)}>
                <option value="All">Sari Faslein (All)</option>
                <option value="Gehu">Gehu (Wheat)</option>
                <option value="Dhan">Dhan (Paddy)</option>
                <option value="Makka">Makka (Maize)</option>
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-warning w-100 fw-bold">Dhundhein</button>
            </div>
          </form>
        </div>

        <div className="buyer-header-box mb-4 shadow">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="header-icon-circle"><i className="fas fa-leaf"></i></div>
              <h4 className="m-0 fw-bold text-white header-text">Available Listings</h4>
            </div>
            <span className="badge live-status-badge">LIVE DEALS</span>
          </div>
        </div>

        {/* Interactive Category Filters */}
        <div className="filter-container mb-4">
          <button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilterClick('all')}>All Crops</button>
          <button className={`filter-pill ${activeFilter === 'gehu' ? 'active' : ''}`} onClick={() => handleFilterClick('gehu')}>Wheat (Gehu)</button>
          <button className={`filter-pill ${activeFilter === 'dhan' ? 'active' : ''}`} onClick={() => handleFilterClick('dhan')}>Paddy (Dhan)</button>
          <button className={`filter-pill ${activeFilter === 'makka' ? 'active' : ''}`} onClick={() => handleFilterClick('makka')}>Maize (Makka)</button>
        </div>
        <div className="row g-4 mb-5">
          {displayedCrops.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="fas fa-seedling fa-3x mb-3 opacity-50"></i>
              <p>No crops match your search. Try different filters.</p>
            </div>
          ) : (
            displayedCrops.map((crop, idx) => {
              const isWatchlisted = watchlist.some(c => c.id === crop.id);
              return (
                <div className="col-md-4" key={idx}>
                  <div className="crop-card shadow-sm h-100 p-3 bg-white rounded border">
                    <span className="badge bg-success mb-2"><i className="fas fa-map-marker-alt"></i> {crop.loc}</span>
                    <h5 className="text-success fw-bold">{crop.name}</h5>
                    <p className="text-muted small mb-1">Seller: <strong>{crop.seller}</strong></p>
                    <p className="m-0">Vazan: {crop.weight}q</p>
                    <p className="fs-5 fw-bold text-success mt-2">Rate: ₹{crop.rate}/q</p>
                    <div className="d-flex justify-content-between mt-3">
                      <button className={`btn btn-sm ${isWatchlisted ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => toggleWatchlist(crop)}>
                        <i className="fas fa-heart"></i> {isWatchlisted ? 'Saved' : 'Watch'}
                      </button>
                      <button className="btn btn-sm btn-success px-3" onClick={() => setActiveChat(crop)}>
                        <i className="fas fa-comments me-1"></i> Contact
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="glass-card p-4 h-100 border-upload">
              <h5 className="mb-4 text-success fw-bold"><i className="fas fa-bullhorn me-2"></i> Apni Zarurat Batayein</h5>
              <form onSubmit={handleRequestSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Kaunsi Fasal Chahiye?</label>
                  <input type="text" className="form-control custom-input" placeholder="e.g. 100q Gehu chahiye" value={reqCrop} onChange={(e) => setReqCrop(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Aapka Budget (₹/q)</label>
                  <input type="number" className="form-control custom-input" placeholder="₹" value={reqBudget} onChange={(e) => setReqBudget(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-success w-100 py-2 fw-bold mb-4">Request Post Karein</button>
              </form>

              {/* My Active Requests Section */}
              <h6 className="fw-bold text-muted border-top pt-3"><i className="fas fa-list-alt me-2"></i> My Active Requests</h6>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {myRequests.length === 0 ? (
                  <p className="text-muted small">Aapki koi request nahi hai.</p>
                ) : (
                  myRequests.map((req, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center bg-light p-2 mb-2 rounded border">
                      <div>
                        <h6 className="m-0 fw-bold text-success">{req.crop}</h6>
                        <small className="text-muted">Budget: ₹{req.budget}/q</small>
                      </div>
                      <span className="badge bg-warning text-dark">{req.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="glass-card p-4 h-100 border-bottom-success">
              <h5 className="mb-4 text-success fw-bold"><i className="fas fa-star me-2"></i> Interested Crops (Watchlist)</h5>
              <div className="row g-3">
                {watchlist.length === 0 ? (
                  <div className="col-12">
                    <p className="text-muted text-center p-4 small">Watchlist khali hai. Click 'Watch' on crops above to save them here.</p>
                  </div>
                ) : (
                  watchlist.map((crop, i) => (
                    <div className="col-12" key={i}>
                      <div className="d-flex justify-content-between align-items-center p-3 h-100 border rounded bg-white shadow-sm">
                        <div>
                          <h6 className="m-0 fw-bold text-dark">{crop.name}</h6>
                          <small className="text-muted">{crop.loc} • {crop.weight}q</small>
                        </div>
                        <div className="text-end">
                          <span className="fw-bold text-success d-block mb-1">₹{crop.rate}/q</span>
                          <button className="btn btn-sm text-danger p-0" onClick={() => toggleWatchlist(crop)}>
                            <i className="fas fa-times"></i> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <NegotiationChat chatData={activeChat} onClose={() => setActiveChat(null)} />
    </>
  );
};

export default BuyerPage;
