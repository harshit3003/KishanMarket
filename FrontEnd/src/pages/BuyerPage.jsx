import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { getInstantCoords } from '../utils/geoUtils';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/buyer-style.css';

import NegotiationChat from '../components/BuyerFeatures/NegotiationChat';
import ConversationsModal from '../components/ConversationsModal';
import socket from '../socket';
import InteractiveMarketMap from '../components/InteractiveMarketMap';


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
  const [isConversationsModalOpen, setIsConversationsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', role: 'buyer' });
  const [allCrops, setAllCrops] = useState(defaultCrops);
  const [displayedCrops, setDisplayedCrops] = useState(defaultCrops);
  const [watchlist, setWatchlist] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [bidModal, setBidModal] = useState({ open: false, crop: null, bidRate: '', weight: '' });

  const openBidModal = (crop) => {
    setBidModal({ open: true, crop, bidRate: crop.rate, weight: crop.weight });
  };

  const submitBid = async (e) => {
    e.preventDefault();
    if (!bidModal.crop || !bidModal.bidRate) return;
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_id: bidModal.crop.id || 0,
          crop_name: bidModal.crop.name,
          buyer_name: currentUser.name || 'Buyer',
          buyer_mobile: currentUser.mobile || 'guest',
          seller_name: bidModal.crop.seller || 'Seller',
          seller_mobile: bidModal.crop.seller_mobile || 'guest',
          asking_rate: bidModal.crop.rate,
          bid_rate: bidModal.bidRate,
          weight: bidModal.weight
        })
      });
      if (res.ok) {
        toast.success(`₹${bidModal.bidRate}/q ki Boli safaltapoorvak lagai gayi!`);

        // Update displayed crops state immediately on screen
        setDisplayedCrops(prev => prev.map(c => {
          if (c.id === bidModal.crop.id || c.name.toLowerCase() === bidModal.crop.name.toLowerCase()) {
            return { ...c, rate: bidModal.bidRate };
          }
          return c;
        }));

        setBidModal({ open: false, crop: null, bidRate: '', weight: '' });
      }
    } catch (err) {
      toast.error('Boli lagane me samasya aayi.');
    }
  };

  // Search State
  const [searchLoc, setSearchLoc] = useState('');
  const [cropType, setCropType] = useState('All');
  const [activeFilter, setActiveFilter] = useState('all');

  // Request Form State
  const [reqCrop, setReqCrop] = useState('');
  const [reqBudget, setReqBudget] = useState('');

  // Graph Ref
  const priceChartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Socket room auto-join and unread message counter for Buyer
  useEffect(() => {
    if (currentUser) {
      if (currentUser.mobile) {
        const cleanMob = currentUser.mobile.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        socket.emit('join_room', `user_${cleanMob}`);
      }
      if (currentUser.name) {
        const cleanName = currentUser.name.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        socket.emit('join_room', `user_${cleanName}`);
      }
    }
    if (allCrops.length > 0) {
      allCrops.forEach(crop => {
        const roomId = `room_${crop.seller}_${crop.name}`.toLowerCase().replace(/\s+/g, '_');
        socket.emit('join_room', roomId);
      });
    }
    if (myRequests.length > 0 && currentUser.name) {
      myRequests.forEach(req => {
        const reqRoomId = `room_${currentUser.name}_${req.crop}`.toLowerCase().replace(/\s+/g, '_');
        socket.emit('join_room', reqRoomId);
      });
    }
  }, [allCrops, myRequests, currentUser]);

  useEffect(() => {
    const handleReceive = (data) => {
      if (data.message && data.message.sender === 'seller') {
        const room = data.room;
        setUnreadCounts(prev => ({
          ...prev,
          [room]: (prev[room] || 0) + 1
        }));
        toast.success(`💬 New message from Seller!`, { id: room });
      }
    };

    const handleCounterBid = (bid) => {
      if (bid.buyer_mobile === currentUser.mobile || bid.buyer_name === currentUser.name) {
        toast.success(`🤝 Seller ne Counter-Offer ₹${bid.bid_rate}/q ka bhej diya hai!`, { duration: 5000 });
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('counter_bid_placed', handleCounterBid);
    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('counter_bid_placed', handleCounterBid);
    };
  }, [currentUser]);

  const openChatForCrop = (crop) => {
    let roomId;
    if (crop.reqId || crop.isRequest) {
      roomId = `room_req_${crop.reqId || crop.id}`;
    } else if (crop.id) {
      const buyerKey = (currentUser.name || currentUser.mobile || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      roomId = `room_crop_${crop.id}_${buyerKey}`;
    } else {
      const sellerKey = (crop.seller_mobile || crop.seller || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const buyerKey = (currentUser.mobile || currentUser.name || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cropKey = (crop.name || crop.crop || 'crop').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      roomId = `room_${sellerKey}_${buyerKey}_${cropKey}`;
    }

    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    setActiveChat({
      ...crop,
      buyerMobile: currentUser.mobile,
      buyerName: currentUser.name,
      roomId
    });
  };

  useEffect(() => {
    const handlePriceUpdate = (data) => {
      setAllCrops(prevCrops => prevCrops.map(crop => {
        if (crop.id === data.crop_id || (crop.name && crop.name.toLowerCase() === data.crop_name.toLowerCase())) {
          return { ...crop, rate: data.new_rate };
        }
        return crop;
      }));

      setDisplayedCrops(prevCrops => prevCrops.map(crop => {
        if (crop.id === data.crop_id || (crop.name && crop.name.toLowerCase() === data.crop_name.toLowerCase())) {
          return { ...crop, rate: data.new_rate };
        }
        return crop;
      }));
    };

    socket.on('crop_price_updated', handlePriceUpdate);
    return () => socket.off('crop_price_updated', handlePriceUpdate);
  }, []);

  const handleDeleteRequest = async (reqId) => {
    if (!reqId) return;
    try {
      const res = await fetch(`/api/buyer-requests/${reqId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyRequests(prev => prev.filter(r => r.id !== reqId));
        toast.success('Request deleted successfully!');
      }
    } catch (err) {
      toast.error('Failed to delete request.');
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    let currentMobile = 'guest';
    let buyerLoc = '';
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setCurrentUser(parsed);
      currentMobile = parsed.mobile || 'guest';
      buyerLoc = parsed.location || '';
    }

    const filterByLoc = (cropsList) => {
      if (!buyerLoc || buyerLoc === '') return cropsList;
      const locParts = buyerLoc.toLowerCase().split(',').map(s => s.trim());
      const filtered = cropsList.filter(crop => {
        const cLoc = (crop.loc || '').toLowerCase();
        return locParts.some(part => cLoc.includes(part) || part.includes(cLoc));
      });
      
      if (filtered.length > 0) return filtered;

      // Fallback: If no direct matches, sort crops by shortest geographic distance using instant coords
      const [bLat, bLng] = getInstantCoords(buyerLoc);
      
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };
      
      const sortedCrops = [...cropsList].sort((a, b) => {
        const [aLat, aLng] = getInstantCoords(a.loc || 'India');
        const [bCoordsLat, bCoordsLng] = getInstantCoords(b.loc || 'India');
        return getDistance(bLat, bLng, aLat, aLng) - getDistance(bLat, bLng, bCoordsLat, bCoordsLng);
      });
      
      return sortedCrops;
    };

    const fetchCrops = async () => {
      // CACHE LOAD
      const cachedCrops = localStorage.getItem('cache_buyerCrops');
      if (cachedCrops) {
        const parsed = JSON.parse(cachedCrops);
        if (parsed && parsed.length > 0) {
          setAllCrops(parsed);
          setDisplayedCrops(filterByLoc(parsed));
        }
      }

      try {
        const res = await fetch('/api/crops?limit=50');
        if (res.ok) {
          const apiCrops = await res.json();
          const finalCrops = (apiCrops && apiCrops.length > 0) ? apiCrops : defaultCrops;
          setAllCrops(finalCrops);
          setDisplayedCrops(filterByLoc(finalCrops));
          localStorage.setItem('cache_buyerCrops', JSON.stringify(finalCrops));
        } else {
          setAllCrops(defaultCrops);
          setDisplayedCrops(filterByLoc(defaultCrops));
        }
      } catch (err) {
        console.error("Failed to fetch crops", err);
        setAllCrops(defaultCrops);
        setDisplayedCrops(filterByLoc(defaultCrops));
      }
    };
    fetchCrops();

    const fetchRequests = async () => {
      try {
        const reqRes = await fetch(`/api/buyer-requests?mobile=${currentMobile}`);
        if (reqRes.ok) {
          setMyRequests(await reqRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    };

    const fetchWatchlist = async () => {
      try {
        const res = await fetch(`/api/watchlist?mobile=${currentMobile}`);
        if (res.ok) setWatchlist(await res.json());
      } catch (err) {}
    };

    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases?mobile=${currentMobile}`);
        if (res.ok) setMyPurchases(await res.json());
      } catch (err) {}
    };

    fetchRequests();
    if (currentMobile !== 'guest') {
      fetchWatchlist();
      fetchPurchases();
    }
  }, []);

  // Dynamic Chart Effect
  useEffect(() => {
    if (priceChartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = priceChartRef.current.getContext('2d');

      // Generate dynamic data based on activeFilter
      const basePrice = activeFilter === 'Gehu' ? 2450 : activeFilter === 'Dhan' ? 3100 : activeFilter === 'Makka' ? 1850 : 2500;
      const cropName = activeFilter === 'all' ? 'Market Average' : activeFilter;

      const dataPoints = Array.from({ length: 30 }, (_, i) => {
        // Create a realistic-looking trend line
        const fluctuation = Math.sin(i / 3) * 100 + (Math.random() * 50 - 25);
        return Math.round(basePrice + fluctuation);
      });

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
          datasets: [{
            label: `${cropName} Price (₹/q)`,
            data: dataPoints,
            borderColor: '#52b788',
            backgroundColor: 'rgba(82, 183, 136, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${cropName}: ₹${context.parsed.y}/q`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [activeFilter]);

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.clear();
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

    setDisplayedCrops(filtered.slice(0, 5)); // prevent browser lag
  };

  const toggleWatchlist = async (crop) => {
    if (!currentUser.mobile || currentUser.mobile === 'guest') {
      toast.error('Please login to save crops to your watchlist.');
      return;
    }
    const exists = watchlist.find(c => c.id === crop.id);
    if (exists) {
      setWatchlist(watchlist.filter(c => c.id !== crop.id));
      await fetch(`/api/watchlist/${crop.id}?mobile=${currentUser.mobile}`, { method: 'DELETE' });
    } else {
      if (window.confirm("Is crop ko apni watchlist mein daalna chahte hain?")) {
        toast.success(`${crop.name} added to watchlist!`);
        setWatchlist([...watchlist, crop]);
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer_mobile: currentUser.mobile, crop_id: crop.id })
        });
      }
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqCrop || !reqBudget) return;

    try {
      const res = await fetch('/api/buyer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: reqCrop,
          budget: reqBudget,
          buyer_mobile: currentUser.mobile || 'guest',
          buyer_location: currentUser.location || 'Unknown',
          buyer_name: currentUser.name || 'Buyer'
        })
      });
      if (res.ok) {
        const getRes = await fetch(`/api/buyer-requests?mobile=${currentUser.mobile || 'guest'}`);
        setMyRequests(await getRes.json());
        setReqCrop('');
        setReqBudget('');
        toast.success("Request Posted! Sellers will contact you shortly.");
      }
    } catch (e) {
      toast.error("Failed to post request to server.");
    }
  };

  return (
    <>

      <nav className="navbar navbar-dark shadow-sm mb-4">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold" to="/buyer"><i className="fas fa-seedling me-2"></i>Kishan<span>Market</span></Link>

          <div className="d-flex align-items-center gap-3">
            <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => setIsConversationsModalOpen(true)} title="All My Chats">
              <i className="fas fa-comments fa-lg text-white"></i>
              {totalUnread > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                  {totalUnread}
                </span>
              )}
            </div>

            <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => toast(totalUnread > 0 ? `You have ${totalUnread} unread messages!` : "No new chat notifications.", { icon: '🔔' })}>
              <i className="fas fa-bell fa-lg text-white"></i>
              {totalUnread > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                  {totalUnread}
                </span>
              )}
            </div>

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
                  <li className="dropdown-divider"></li>
                  <li><a href="#" className="logout-item" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
              </div>
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
        <div className="analytics-card mb-5">
          <div className="chart-header">
            <h5 className="chart-title"><i className="fas fa-chart-line me-2"></i> {activeFilter === 'all' ? 'All Crops' : activeFilter} 30-Day Price Trend</h5>
            <span className="badge bg-success rounded-pill px-3 py-2">Live Market Data</span>
          </div>
          <div className="chart-container" style={{ height: '300px', width: '100%', position: 'relative' }}>
            <canvas ref={priceChartRef}></canvas>
          </div>
        </div>

        {/* Dynamic Interactive Market Map */}
        <InteractiveMarketMap 
          userLocation={currentUser.location || 'Banda, Uttar Pradesh'} 
          userRole="buyer" 
          items={displayedCrops} 
          title="Live Crop Sellers Near You" 
        />

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
                <option value="Mustard">Mustard (Sarson)</option>
                <option value="Cotton">Cotton (Kapas)</option>
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
              const cropRoomId = `room_${crop.seller}_${crop.name}`.toLowerCase().replace(/\s+/g, '_');
              const unreadCount = unreadCounts[cropRoomId] || 0;
              return (
                <div className="col-md-4" key={idx}>
                  <div className="crop-card shadow-sm h-100 p-3 bg-white rounded border">
                    <span className="badge bg-success mb-2"><i className="fas fa-map-marker-alt"></i> {crop.loc}</span>
                    <h5 className="text-success fw-bold">{crop.name}</h5>
                    <p className="text-muted small mb-1">Seller: <strong>{crop.seller}</strong></p>
                    <p className="m-0">Vazan: {crop.weight}q</p>
                    <p className="fs-5 fw-bold text-success mt-2">Rate: ₹{crop.rate}/q</p>
                    <div className="d-flex justify-content-between align-items-center mt-3 gap-1">
                      <button className={`btn btn-sm ${isWatchlisted ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => toggleWatchlist(crop)}>
                        <i className="fas fa-heart"></i>
                      </button>
                      <button className="btn btn-sm btn-warning text-dark fw-bold px-2" onClick={() => openBidModal(crop)} title="Place Custom Bid">
                        <i className="fas fa-gavel me-1"></i> Boli Lagayein
                      </button>
                      <button className="btn btn-sm btn-success px-2 position-relative" onClick={() => openChatForCrop(crop)}>
                        <i className="fas fa-comments me-1"></i> Chat
                        {unreadCount > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                            {unreadCount}
                          </span>
                        )}
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
                  <select className="form-select custom-input" value={reqCrop} onChange={(e) => setReqCrop(e.target.value)} required>
                    <option value="" disabled>Fasal Chunein (Select Crop)</option>
                    <option value="Gehu">Gehu (Wheat)</option>
                    <option value="Dhan">Dhan (Rice)</option>
                    <option value="Makka">Makka (Maize)</option>
                    <option value="Mustard">Mustard (Sarson)</option>
                    <option value="Cotton">Cotton (Kapas)</option>
                  </select>
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
                  myRequests.map((req, i) => {
                    const reqRoomId = `room_${currentUser.name || 'buyer'}_${req.crop}`.toLowerCase().replace(/\s+/g, '_');
                    const reqUnread = unreadCounts[reqRoomId] || 0;
                    return (
                      <div key={i} className="d-flex justify-content-between align-items-center bg-light p-2 mb-2 rounded border">
                        <div>
                          <h6 className="m-0 fw-bold text-success">{req.crop}</h6>
                          <small className="text-muted">Budget: ₹{req.budget}/q</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button 
                            onClick={() => openChatForCrop({ id: req.id, reqId: req.id, isRequest: true, name: req.crop, weight: 'Bulk', rate: req.budget, seller: 'Verified Seller', buyerName: currentUser.name })} 
                            className="btn btn-sm btn-outline-success py-0 px-2 position-relative" 
                            style={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                            <i className="fas fa-comments me-1"></i> Chat
                            {reqUnread > 0 && (
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                                {reqUnread}
                              </span>
                            )}
                          </button>
                          <span className="badge bg-warning text-dark me-1">{req.status}</span>
                          <button 
                            onClick={() => handleDeleteRequest(req.id)} 
                            className="btn btn-sm btn-outline-danger py-0 px-2" 
                            style={{ fontSize: '0.75rem', borderRadius: '10px' }}
                            title="Delete Request">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
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
      <ConversationsModal 
        isOpen={isConversationsModalOpen} 
        onClose={() => setIsConversationsModalOpen(false)} 
        currentUser={currentUser} 
        onSelectChat={(chat) => setActiveChat(chat)} 
        unreadCounts={unreadCounts} 
      />
      {/* Real-time Bidding Modal */}
      {bidModal.open && bidModal.crop && (
        <div className="dynamic-modal-overlay active">
          <div className="dynamic-modal text-start p-4" style={{ maxWidth: '420px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0"><i className="fas fa-gavel text-warning me-2"></i> Boli Lagayein (Place Bid)</h5>
              <button className="btn-close" onClick={() => setBidModal({ open: false, crop: null, bidRate: '', weight: '' })}></button>
            </div>
            <div className="p-2 bg-light rounded mb-3 border">
              <p className="m-0 small"><strong>Fasal:</strong> {bidModal.crop.name} ({bidModal.crop.weight}q)</p>
              <p className="m-0 small text-muted">Asking Rate: ₹{bidModal.crop.rate}/q • Seller: {bidModal.crop.seller}</p>
            </div>
            <form onSubmit={submitBid}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Aapki Boli Rate (₹/q)</label>
                <input type="number" className="form-control custom-input" placeholder="e.g. 2500" value={bidModal.bidRate} onChange={e => setBidModal({...bidModal, bidRate: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Quantity (Quintals)</label>
                <input type="number" className="form-control custom-input" value={bidModal.weight} onChange={e => setBidModal({...bidModal, weight: e.target.value})} required />
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary w-50" onClick={() => setBidModal({ open: false, crop: null, bidRate: '', weight: '' })}>Cancel</button>
                <button type="submit" className="btn btn-success w-50 fw-bold">Submit Boli</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerPage;
