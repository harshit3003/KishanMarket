import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/seller-style.css';
import InteractiveMarketMap from '../components/InteractiveMarketMap';
import LiveBiddingToasts from '../components/SellerFeatures/LiveBiddingToasts';
import AIAssessor from '../components/SellerFeatures/AIAssessor';
import LogisticsCalculator from '../components/SellerFeatures/LogisticsCalculator';
import ColdStorageFinder from '../components/SellerFeatures/ColdStorageFinder';
import WeatherDashboard from '../components/SellerFeatures/WeatherDashboard';
import NegotiationChat from '../components/BuyerFeatures/NegotiationChat';
import socket from '../socket';
import { getInstantCoords } from '../utils/geoUtils';

const defaultBuyers = [
  { "name": "ITC Limited", "crops": "Gehu", "rate": "1874", "location": "Rajasthan", "rating": "3.6" },
  { "name": "Haryana Agro", "crops": "Mustard", "rate": "2974", "location": "Gujarat", "rating": "3.6" },
  { "name": "Adani Wholesales", "crops": "Dhan", "rate": "2602", "location": "Haryana", "rating": "4.4" },
  { "name": "Delhi Fresh", "crops": "Cotton", "rate": "1742", "location": "Madhya Pradesh", "rating": "3.7" },
  { "name": "ITC Limited", "crops": "Chana", "rate": "2803", "location": "Rajasthan", "rating": "4.6" }
];

const SellerPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLiveBidsOpen, setIsLiveBidsOpen] = useState(false);

  // New states for Interactive Modals
  const [editModalData, setEditModalData] = useState({ open: false, index: null, weight: '', rate: '' });
  const [sellModalData, setSellModalData] = useState({ open: false, index: null, distance: 50, buyerName: '' });
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', role: 'seller', location: '' });
  const [crops, setCrops] = useState([]);
  const [buyers, setBuyers] = useState(defaultBuyers);
  const [allBuyersData, setAllBuyersData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Search Form State
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCrop, setSearchCrop] = useState('Gehu');
  const [searchTitle, setSearchTitle] = useState('Top Buyers in Your Area');

  // Upload Form State
  const [cropName, setCropName] = useState('');
  const [cropWeight, setCropWeight] = useState('');
  const [cropRate, setCropRate] = useState('');

  // Live Weather State for Widget
  const [liveTemp, setLiveTemp] = useState('28');
  const [liveWind, setLiveWind] = useState('12');
  const [weatherLocation, setWeatherLocation] = useState('Karnal, Haryana');
  const [weatherCondition, setWeatherCondition] = useState('Clear Sky');
  const [advisoryText, setAdvisoryText] = useState('Clear, good for harvesting Gehu (Wheat)');
  
  // Card Hover State
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);

  const [myCropsCount, setMyCropsCount] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [receivedBids, setReceivedBids] = useState([]);
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);
  const [counterInputMap, setCounterInputMap] = useState({});
  const [mandiTicker, setMandiTicker] = useState([
    { name: "Gehu", rate: 2450, trend: "+1.2%" },
    { name: "Dhan", rate: 2100, trend: "+0.8%" },
    { name: "Makka", rate: 1850, trend: "-0.5%" }
  ]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/mandi-ticker');
        if (res.ok) setMandiTicker(await res.json());
      } catch (e) {}
    };
    fetchTicker();
  }, []);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await fetch(`/api/bids/seller?mobile=${currentUser.mobile || 'guest'}&name=${encodeURIComponent(currentUser.name || 'Guest')}`);
        if (res.ok) setReceivedBids(await res.json());
      } catch (e) {}
    };
    fetchBids();
  }, [currentUser]);

  useEffect(() => {
    const handleNewBid = (bid) => {
      if (bid.seller_mobile === currentUser.mobile || bid.seller_name === currentUser.name) {
        toast.success(`💰 Nayi Boli! ${bid.buyer_name} ne ₹${bid.bid_rate}/q ki boli lagai!`);
        setReceivedBids(prev => [bid, ...prev]);
      }
    };

    const handlePriceUpdate = (data) => {
      setCrops(prevCrops => prevCrops.map(crop => {
        if (crop.id === data.crop_id || (crop.name && crop.name.toLowerCase() === data.crop_name.toLowerCase())) {
          return { ...crop, rate: data.new_rate };
        }
        return crop;
      }));
    };

    socket.on('new_bid_placed', handleNewBid);
    socket.on('crop_price_updated', handlePriceUpdate);
    return () => {
      socket.off('new_bid_placed', handleNewBid);
      socket.off('crop_price_updated', handlePriceUpdate);
    };
  }, [currentUser]);

  const handleAcceptBid = async (bid) => {
    try {
      await fetch(`/api/bids/${bid.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });
      setReceivedBids(prev => prev.map(b => b.id === bid.id ? { ...b, status: 'accepted' } : b));
      setSellModalData({
        open: true,
        index: 0,
        buyerIndex: null,
        distance: 25,
        buyerName: bid.buyer_name,
        buyerMobile: bid.buyer_mobile,
        paymentStatus: 'sold',
        cropName: bid.crop_name,
        maxWeight: parseInt(bid.weight),
        weight: bid.weight,
        rate: bid.bid_rate
      });
    } catch (e) {}
  };

  const handleRejectBid = async (bidId) => {
    try {
      await fetch(`/api/bids/${bidId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      setReceivedBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b));
      toast.error('Boli asweekar kar di gayi.');
    } catch (e) {}
  };

  const handleCounterBid = async (bidId) => {
    const rateVal = counterInputMap[bidId];
    if (!rateVal) {
      toast.error("Pehle naya rate enter karein!");
      return;
    }
    try {
      const res = await fetch('/api/bids/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId, counter_rate: rateVal })
      });
      if (res.ok) {
        toast.success(`Counter-offer ₹${rateVal}/q buyer ko bhej diya gaya!`);
        setReceivedBids(prev => prev.map(b => b.id === bidId ? { ...b, bid_rate: rateVal, status: 'counter_offered' } : b));
      }
    } catch (e) {
      toast.error("Counter offer nahi bheja ja saka.");
    }
  };

  useEffect(() => {
    let currentMobile = 'guest';
    let initLoc = 'Karnal, Haryana';
    let currentName = 'Guest';

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
        currentMobile = parsedUser.mobile || 'guest';
        currentName = parsedUser.name || 'Guest';
        if (parsedUser.location && parsedUser.location.trim() !== '') {
          initLoc = parsedUser.location;
        }
      } catch (e) {}
    }
    setWeatherLocation(initLoc);

    const fetchInitialData = async (mobile, loc, name) => {
      try {
        if (mobile && mobile !== 'guest') {
          const cropsRes = await fetch(`/api/crops/my?mobile=${mobile}&name=${encodeURIComponent(name)}`);
          if (cropsRes.ok) {
            setCrops(await cropsRes.json());
          }

          const bidsRes = await fetch(`/api/bids/seller?mobile=${mobile}`);
          if (bidsRes.ok) {
            setReceivedBids(await bidsRes.json());
          }
        }

        const reqsRes = await fetch('/api/buyer-requests');
        if (reqsRes.ok) {
          const reqs = await reqsRes.json();
          const formattedRequests = reqs.map(req => ({
            reqId: req.id,
            name: req.buyer_name || "Direct Buyer (New Request)",
            mobile: req.buyer_mobile,
            crops: req.crop,
            rate: req.budget,
            location: req.buyer_location || 'Unknown',
            rating: "New"
          }));
          
          const allBuyers = [...formattedRequests, ...defaultBuyers];
          
          let localizedBuyers = allBuyers;
          if (loc && loc !== '') {
            const sellerParts = loc.toLowerCase().split(',').map(s => s.trim());
            localizedBuyers = allBuyers.filter(buyer => {
              const bLoc = buyer.location.toLowerCase();
              return sellerParts.some(part => bLoc.includes(part) || part.includes(bLoc));
            });
          }
          
          setBuyers(localizedBuyers.length > 0 ? localizedBuyers : allBuyers);
        }
      } catch (err) {}
    };

    fetchInitialData(currentMobile, initLoc, currentName);

    // Fetch actual live weather for logged-in seller location
    const [lat, lng] = getInstantCoords(initLoc);
    fetchWeatherData(lat, lng, initLoc);
  }, []);

  // Socket room auto-join and unread message counter
  useEffect(() => {
    if (crops.length > 0 && currentUser.name) {
      crops.forEach(crop => {
        const roomId = `room_${currentUser.name}_${crop.name}`.toLowerCase().replace(/\s+/g, '_');
        socket.emit('join_room', roomId);
      });
    }
  }, [crops, currentUser]);

  useEffect(() => {
    const handleReceive = (data) => {
      if (data.message && data.message.sender === 'buyer') {
        const room = data.room;
        setUnreadCounts(prev => ({
          ...prev,
          [room]: (prev[room] || 0) + 1
        }));
        
        toast((t) => (
          <div className="text-start">
            <div className="fw-bold text-success mb-1"><i className="fas fa-comments me-1"></i> New Buyer Message!</div>
            <div className="small text-muted mb-2 font-italic">"{data.message.text}"</div>
            <button 
              className="btn btn-sm btn-success w-100 fw-bold py-1"
              onClick={() => {
                toast.dismiss(t.id);
                setUnreadCounts(prev => ({ ...prev, [room]: 0 }));
                setActiveChat({
                  name: 'Crop Listing',
                  weight: 'Bulk',
                  rate: 'Market Rate',
                  seller: currentUser.name,
                  seller_mobile: currentUser.mobile,
                  roomId: room
                });
              }}
            >
              Open Chat Window
            </button>
          </div>
        ), { duration: 8000, id: room });
      }
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [currentUser]);

  const openChatForCrop = async (crop) => {
    const sellerKey = (currentUser.mobile || currentUser.name || crop.seller || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cropKey = (crop.name || 'crop').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    let activeRoomId = null;
    let buyerName = 'Direct Buyer';
    let buyerMobile = '';

    try {
      const res = await fetch(`/api/chat/rooms?seller_key=${sellerKey}&crop_key=${cropKey}`);
      if (res.ok) {
        const rooms = await res.json();
        if (rooms && rooms.length > 0) {
          activeRoomId = rooms[0];
        }
      }
    } catch (e) {}

    if (!activeRoomId) {
      const matchingBid = receivedBids.find(b => b.crop_id === crop.id || (b.crop_name && b.crop_name.toLowerCase() === crop.name.toLowerCase()));
      const buyerKey = (matchingBid ? (matchingBid.buyer_mobile || matchingBid.buyer_name) : 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      activeRoomId = `room_${sellerKey}_${buyerKey}_${cropKey}`;
      if (matchingBid) {
        buyerName = matchingBid.buyer_name;
        buyerMobile = matchingBid.buyer_mobile;
      }
    }

    setUnreadCounts(prev => ({ ...prev, [activeRoomId]: 0 }));
    setActiveChat({
      name: crop.name,
      weight: crop.weight,
      rate: crop.rate,
      seller: currentUser.name,
      seller_mobile: currentUser.mobile,
      buyer: buyerName,
      buyerMobile: buyerMobile,
      roomId: activeRoomId
    });
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const fetchWeatherData = async (lat, lon, locationName = '') => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      if (data.current_weather) {
        setLiveTemp(Math.round(data.current_weather.temperature));
        setLiveWind(Math.round(data.current_weather.windspeed));
        
        const code = data.current_weather.weathercode;
        const safeLoc = locationName || '';
        const cropHint = safeLoc.toLowerCase().includes('punjab') || safeLoc.toLowerCase().includes('haryana') ? 'Gehu (Wheat)' : 'Dhan (Rice) and local crops';
        
        if (code === 0) {
           setWeatherCondition('Clear Sky');
           setAdvisoryText(`Mausam bilkul saaf hai, ${cropHint} ki katai (harvesting) ke liye behtareen samay.`);
        } else if (code >= 1 && code <= 3) {
           setWeatherCondition('Partly Cloudy');
           setAdvisoryText(`Mausam thik hai, ${cropHint} par dhyaan dein.`);
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
           setWeatherCondition('Rainy');
           setAdvisoryText(`Baarish ki sambhavna hai! Kati hui ${cropHint} ko surakshit rakhein.`);
        } else {
           setWeatherCondition('Extreme Weather');
           setAdvisoryText(`Kharab mausam alert! Khet mein kaam karne se bachein aur ${cropHint} ko dhak dein.`);
        }
      }
    } catch (e) {
      console.log('Weather fetch failed', e);
    }
  };

  const handleChangeLocation = () => {
    const newLoc = window.prompt("Enter your city/state location (e.g. Ludhiana, Jaipur, Delhi, Banda):");
    if (newLoc && newLoc.trim()) {
      const cleanLoc = newLoc.trim();
      setWeatherLocation(cleanLoc);
      const [lat, lng] = getInstantCoords(cleanLoc);
      fetchWeatherData(lat, lng, cleanLoc);
      toast.success(`Weather location updated to ${cleanLoc}`);
    }
  };

  const handleEditCrop = (idx) => {
    const crop = crops[idx];
    setEditModalData({ open: true, index: idx, weight: crop.weight, rate: crop.rate, name: crop.name });
  };

  const confirmEditCrop = async (e) => {
    e.preventDefault();
    const idx = editModalData.index;
    const crop = crops[idx];
    if (!crop || !crop.id) return;
    
    try {
      await fetch(`/api/crops/${crop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: editModalData.weight, rate: editModalData.rate })
      });
      const getRes = await fetch(`/api/crops/my?mobile=${currentUser.mobile || 'guest'}`);
      setCrops(await getRes.json());
      setEditModalData({ open: false, index: null, weight: '', rate: '', name: '' });
      toast.success('Listing updated successfully!');
    } catch (err) {
      toast.error('Failed to update listing on server.');
    }
  };

  const handleMarkSold = (idx) => {
    const crop = crops[idx];
    setSellModalData({ open: true, index: idx, buyerIndex: null, distance: 50, buyerName: '', buyerMobile: '', paymentStatus: 'pending', cropName: crop.name, maxWeight: parseInt(crop.weight), weight: crop.weight, rate: crop.rate });
  };

  const handleDirectSell = (buyer, buyerIndex) => {
    const cropIndex = crops.findIndex(c => c.name.toLowerCase() === buyer.crops.toLowerCase() && c.status !== 'sold' && c.status !== 'pending');
    if (cropIndex === -1) {
      toast.error(`You don't have any active ${buyer.crops} listings to sell! Upload one first.`);
      return;
    }
    const crop = crops[cropIndex];
    setSellModalData({
      open: true,
      index: cropIndex,
      buyerIndex: buyerIndex,
      distance: 50,
      buyerName: buyer.name,
      paymentStatus: 'pending',
      cropName: crop.name,
      maxWeight: parseInt(crop.weight),
      weight: crop.weight,
      rate: buyer.rate,
      buyerMobile: buyer.mobile || '',
      reqId: buyer.reqId || null
    });
  };

  const confirmMarkSold = async (e) => {
    e.preventDefault();
    const idx = sellModalData.index;
    const crop = crops[idx];
    if (!crop || !crop.id) return;
    
    const soldWeight = parseInt(sellModalData.weight);
    const originalWeight = parseInt(crop.weight);

    if (!soldWeight || soldWeight <= 0) {
      toast.error("Please enter a valid amount to sell.");
      return;
    }

    const transportCost = (sellModalData.distance / 10) * 25 * soldWeight;
    const grossRevenue = parseInt(sellModalData.rate) * soldWeight;
    const netProfit = grossRevenue - transportCost;
    
    try {
      if (soldWeight < originalWeight) {
        // Update original crop weight
        await fetch(`/api/crops/${crop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: (originalWeight - soldWeight).toString(), rate: crop.rate })
        });
        
        // Add new sold crop entry
        const res = await fetch('/api/crops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: crop.name, weight: soldWeight.toString(), rate: sellModalData.rate,
            seller: currentUser.name || 'Guest', loc: currentUser.location || crop.loc || 'Unknown', seller_mobile: currentUser.mobile || 'guest'
          })
        });
        const newCropData = await res.json();
        
        // Mark the newly added crop as sold
        if (newCropData.id) {
          await fetch(`/api/crops/${newCropData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: sellModalData.paymentStatus,
              soldDate: new Date().toLocaleDateString(),
              buyerName: sellModalData.buyerName || 'Unknown Buyer',
              buyerMobile: sellModalData.buyerMobile || null,
              distance: sellModalData.distance,
              transportCost: transportCost,
              netProfit: netProfit
            })
          });
        }
      } else {
        // Mark existing crop as sold with updated weight & rate
        await fetch(`/api/crops/${crop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weight: soldWeight.toString(),
            rate: sellModalData.rate ? sellModalData.rate.toString() : crop.rate,
            status: sellModalData.paymentStatus,
            soldDate: new Date().toLocaleDateString(),
            buyerName: sellModalData.buyerName || 'Unknown Buyer',
            buyerMobile: sellModalData.buyerMobile || null,
            distance: sellModalData.distance,
            transportCost: transportCost,
            netProfit: netProfit
          })
        });
      }

      if (sellModalData.reqId) {
        await fetch(`/api/buyer-requests/${sellModalData.reqId}`, { method: 'DELETE' });
      }

      // Refresh data
      const getRes = await fetch(`/api/crops/my?mobile=${currentUser.mobile || 'guest'}`);
      setCrops(await getRes.json());

      if (sellModalData.buyerIndex !== null && sellModalData.buyerIndex !== undefined) {
        const updatedBuyers = buyers.filter((_, i) => i !== sellModalData.buyerIndex);
        setBuyers(updatedBuyers);
      }

      setSellModalData({ open: false, index: null, buyerIndex: null, distance: 50, buyerName: '', paymentStatus: 'pending' });
      toast.success(sellModalData.paymentStatus === 'sold' ? 'Sale completed! Profit tracked.' : 'Order marked as pending. Awaiting completion.');
    } catch (e) {
      toast.error('Failed to process sale on server.');
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('displayUserName');
    navigate('/login');
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('displayUserName');
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleOpenLiveBids = (e) => {
    e.preventDefault();
    setIsLiveBidsOpen(true);
    setIsProfileOpen(false); // Close dropdown
  };

  const handleUploadCrop = async (e) => {
    e.preventDefault();
    if (!cropName || !cropWeight || !cropRate) return;

    const dateStr = new Date().toLocaleDateString('en-GB');
    
    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cropName,
          weight: cropWeight,
          rate: cropRate,
          seller: currentUser.name || 'Guest',
          loc: currentUser.location || 'Unknown',
          seller_mobile: currentUser.mobile || 'guest'
        })
      });

      if (res.ok) {
        // Refresh local state from DB
        const getRes = await fetch(`/api/crops/my?mobile=${currentUser.mobile || 'guest'}&name=${encodeURIComponent(currentUser.name || 'Guest')}`);
        setCrops(await getRes.json());
        
        setCropName('');
        setCropWeight('');
        setCropRate('');
        toast.success(`${cropName} uploaded successfully!`);
      }
    } catch (e) {
      toast.error('Failed to upload crop to server.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Clear stock history?")) {
      localStorage.removeItem(`myCrops_${currentUser.mobile || 'guest'}`);
      setCrops([]);
      toast.success("Stock history cleared.");
    }
  };

  const handleSearchBuyer = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    let dataToFilter = allBuyersData;
    
    if (dataToFilter.length === 0) {
      try {
        const res = await fetch('/api/buyers_data');
        dataToFilter = await res.json();
        setAllBuyersData(dataToFilter);
      } catch (err) {
        console.error("Error loading buyers:", err);
        setIsSearching(false);
        return;
      }
    }

    const loc = searchLocation.toLowerCase();
    const filtered = dataToFilter.filter(b => 
      b.location.toLowerCase().includes(loc) && b.crops.toLowerCase() === searchCrop.toLowerCase()
    );

    // Inject matching real-time Buyer Requests into search results
    const savedBuyerRequests = JSON.parse(localStorage.getItem('buyerRequests')) || [];
    const formattedRequests = savedBuyerRequests
      .filter(req => req.crop.toLowerCase().includes(searchCrop.toLowerCase()))
      .map(req => ({
        name: "Direct Buyer (New Request)",
        crops: req.crop,
        rate: req.budget,
        location: loc ? searchLocation : (currentUser.location || 'Unknown'),
        rating: "New"
      }));

    // Limit to 50 results to prevent browser lag from rendering too many 3D cards, prioritizing live requests
    setBuyers([...formattedRequests, ...filtered].slice(0, 50));
    setSearchTitle(loc ? `Results in ${searchLocation} for ${searchCrop}` : `Results for ${searchCrop}`);
    setIsSearching(false);
  };

  return (
    <>
      
      {/* Fixed Premium Navbar */}
      <nav className="navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-decoration-none" to="/seller">
            <i className="fas fa-seedling me-2"></i>Kishan<span>Market</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => setIsBidsModalOpen(true)} title="Live Bids Received">
              <i className="fas fa-gavel fa-lg text-warning"></i>
              {receivedBids.filter(b => b.status === 'pending').length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                  {receivedBids.filter(b => b.status === 'pending').length}
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
              <i className="fas fa-user-circle fa-2x profile-icon" id="profileIcon" style={{ cursor: 'pointer' }} onClick={toggleProfile}></i>
              <div className="profile-dropdown" id="profileDropdown" style={{ display: isProfileOpen ? 'block' : 'none' }}>
                <div className="dropdown-user-info">
                  <h6 className="m-0 fw-bold" id="sellerProfileName">{currentUser.name}</h6>
                  <small className="text-muted">Customer ID: {currentUser.user_id || 'KM-S-1001'}</small>
                </div>
                <ul className="dropdown-links-list">
                  <li><Link to="/profile/seller"><i className="fas fa-user"></i> My Profile</Link></li>
                  <li><a href="#live-bids" onClick={handleOpenLiveBids}><i className="fas fa-gavel text-warning"></i> Live Bids <span className="badge bg-danger ms-2 rounded-pill">New</span></a></li>
                  <li className="dropdown-divider"></li>
                  <li><a href="#" className="logout-item" onClick={handleLogout} style={{ color: '#000000' }}><i className="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container pb-5">
        {/* Live Mandi Rates Ticker */}
        <div className="trending-ticker-container shadow-sm">
          <div className="ticker-header">
            <div className="live-dot"></div>
            <span>LIVE MANDI RATES</span>
          </div>
          <div className="ticker-content">
            {mandiTicker.map((item, i) => (
              <div className="rate-item" key={i}>
                <span className="crop-name">{item.name}</span>
                <span className="crop-price">₹{item.rate}/q</span>
                <span className={(item.trend || '').includes('-') ? "price-down" : "price-up"}>
                  <i className={(item.trend || '').includes('-') ? "fas fa-caret-down" : "fas fa-caret-up"}></i> {item.trend || 'Stable'}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* Upload & Inventory Grid */}
        <div className="row g-4 mb-5 mt-3">
          <div className="col-md-6">
            <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
              <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-upload me-2"></i> Upload Crop Listing</h5>
              <form id="uploadForm" onSubmit={handleUploadCrop} style={{ transform: 'translateZ(20px)' }}>
                <div className="mb-3">
                  <label className="form-label">Crop Name</label>
                  <select className="form-select custom-input input-premium" value={cropName} onChange={(e) => setCropName(e.target.value)} required>
                    <option value="" disabled>Fasal Chunein (Select Crop)</option>
                    <option value="Gehu">Gehu (Wheat)</option>
                    <option value="Dhan">Dhan (Rice)</option>
                    <option value="Makka">Makka (Maize)</option>
                    <option value="Mustard">Mustard (Sarson)</option>
                    <option value="Cotton">Cotton (Kapas)</option>
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 mb-4">
                    <label className="form-label">Weight (Quintals)</label>
                    <input type="number" className="form-control custom-input input-premium" placeholder="0" value={cropWeight} onChange={(e) => setCropWeight(e.target.value)} required />
                  </div>
                  <div className="col-6 mb-4">
                    <label className="form-label">Target Rate (₹/q)</label>
                    <input type="number" className="form-control custom-input input-premium" placeholder="₹" value={cropRate} onChange={(e) => setCropRate(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary-dark w-100 btn-premium-hover">Publish Listing</button>
              </form>
            </div>
          </div>

          <div className="col-md-6">
            <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
              <div className="d-flex justify-content-between align-items-center section-title" style={{ paddingBottom: '9px', marginBottom: '20px', transform: 'translateZ(30px)' }}>
                <h5 className="m-0 p-0 border-0"><i className="fas fa-warehouse me-2"></i> Your Active Listings</h5>
                <button className="btn btn-sm btn-outline-danger btn-premium-hover" title="Clear History" onClick={handleClearAll} style={{ borderRadius: 'var(--radius-md)' }}><i className="fas fa-trash"></i></button>
              </div>
              <div id="cropListContainer" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px', transform: 'translateZ(20px)' }}>
                {crops.filter(c => c.status !== 'sold' && c.status !== 'pending').length === 0 ? (
                  <p className="text-muted text-center p-3 small">Koi history nahi hai.</p>
                ) : (
                  crops.map((crop, idx) => {
                    if (crop.status === 'sold' || crop.status === 'pending') return null;
                    const cropRoomId = `room_${currentUser.name || crop.seller}_${crop.name}`.toLowerCase().replace(/\s+/g, '_');
                    const unreadCount = unreadCounts[cropRoomId] || 0;
                    return (
                      <div className="inventory-item shadow-sm d-flex justify-content-between align-items-center p-2 mb-2" key={idx}>
                        <div className="d-flex align-items-center flex-grow-1">
                          <div className="wheat-bar me-2"></div>
                          <div><p className="m-0 small"><strong>{crop.weight}q {crop.name}</strong> @ ₹{crop.rate}/q</p></div>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <button onClick={() => openChatForCrop(crop)} className="btn btn-sm btn-outline-success py-0 px-2 position-relative" style={{fontSize:'0.75rem', borderRadius:'10px'}}>
                            <i className="fas fa-comments me-1"></i> Chat
                            {unreadCount > 0 && (
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          <button onClick={() => handleEditCrop(idx)} className="btn btn-sm btn-outline-primary py-0 px-2" style={{fontSize:'0.75rem', borderRadius:'10px'}}>Edit</button>
                          <button onClick={() => handleMarkSold(idx)} className="btn btn-sm btn-success py-0 px-2" style={{fontSize:'0.75rem', borderRadius:'10px'}}>Sell</button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Local Weather & Farming Widget */}
        <div className="row mb-4 mt-4">
          <div className="col-12">
            <div className="weather-card">
              <div className="weather-info">
                <h3>{liveTemp}°C</h3>
                <p className="d-flex align-items-center">
                  {weatherLocation}
                  <button className="btn btn-sm btn-outline-light ms-3 py-0 px-2" onClick={handleChangeLocation} style={{ fontSize: '0.8rem', borderRadius: '15px' }}>
                    <i className="fas fa-edit me-1"></i> Change
                  </button>
                </p>
                <div className="weather-details">
                  <span><i className="fas fa-tint me-1"></i> Condition: {weatherCondition}</span>
                  <span><i className="fas fa-wind me-1"></i> Wind: {liveWind} km/h</span>
                  <span><i className="fas fa-cloud-sun me-1"></i> Advisory: {advisoryText}</span>
                </div>
              </div>
              <div className="weather-icon-container">
                <i className="fas fa-sun"></i>
              </div>
            </div>
          </div>
        </div>



        {/* Dashboard Tools Section */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <WeatherDashboard locationKey={weatherLocation} />
          </div>
          <div className="col-md-3">
            <AIAssessor onApplyRate={(rate, name) => {
              setCropRate(rate.toString());
              if (name) setCropName(name);
            }} />
          </div>
          <div className="col-md-3">
            <LogisticsCalculator />
          </div>
          <div className="col-md-3">
            <ColdStorageFinder />
          </div>
        </div>


        {/* Khareedar Dhundein Box */}
        <div className="glass-card-premium p-4 mt-4 mb-4" style={{ transformStyle: 'preserve-3d' }}>
          <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-search me-2"></i> Find Buyers</h5>
          <form id="searchBuyerForm" className="row g-3" onSubmit={handleSearchBuyer} style={{ transform: 'translateZ(20px)' }}>
            <div className="col-md-5">
              <label className="form-label">Location</label>
              <input type="text" className="form-control custom-input input-premium" placeholder="e.g. Punjab, Delhi" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} />
            </div>
            <div className="col-md-5">
              <label className="form-label">Select Crop</label>
              <select className="form-select custom-input input-premium" value={searchCrop} onChange={(e) => setSearchCrop(e.target.value)}>
                <option value="Gehu">Gehu</option>
                <option value="Dhan">Dhan</option>
                <option value="Makka">Makka</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn-accent w-100 btn-premium-hover" disabled={isSearching}>
                {isSearching ? <><i className="fas fa-spinner fa-spin me-2"></i>Searching</> : <><i className="fas fa-search me-2"></i>Search</>}
              </button>
            </div>
          </form>
        </div>

        {/* Interactive Map */}
        <InteractiveMarketMap 
          userLocation={weatherLocation || currentUser.location || 'Karnal, Haryana'} 
          userRole="seller" 
          items={buyers} 
          title="Live Buyers Near You" 
        />

        {/* Buyers Grid */}
        <div className="buyer-header-box d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 fw-bold" style={{ color: '#000000' }}>{searchTitle}</h4>
          <span className="badge" style={{ background: 'var(--accent-gold)', color: '#fff', padding: '8px 15px', borderRadius: '50px', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE DEALS</span>
        </div>

        <div className="row g-4" id="buyersGrid">
          {buyers.length === 0 ? (
            <div className="col-12 text-center p-5 text-white"><h5>Khareedar nahi mila.</h5></div>
          ) : (
            buyers.map((buyer, idx) => {
              const isHovered = hoveredCardIndex === idx;
              return (
                <div className="col-md-4" key={`${buyer.name}-${buyer.crops}-${idx}`}>
                  <div 
                    className="glass-card-premium p-4 h-100 d-flex flex-column align-items-center text-center shadow-lg" 
                    style={{ 
                      background: isHovered ? '#2e4a35' : '', 
                      borderRadius: '20px', 
                      color: isHovered ? 'white' : 'inherit',
                      transformStyle: 'preserve-3d', 
                      transition: 'background 0.4s ease, color 0.4s ease'
                    }} 
                    onMouseEnter={() => setHoveredCardIndex(idx)} 
                    onMouseLeave={() => setHoveredCardIndex(null)}
                  >
                    <span style={{ 
                      background: isHovered ? '#5a8264' : 'rgba(82, 183, 136, 0.15)', 
                      color: isHovered ? 'white' : 'var(--primary)',
                      padding: '4px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', 
                      transform: 'translateZ(20px)', transition: 'all 0.4s ease' 
                    }}>{buyer.location}</span>
                    
                    <h3 className={`fw-bold mb-2 text-lowercase ${isHovered ? 'text-white' : 'text-success'}`} style={{ transform: 'translateZ(30px)', transition: 'all 0.4s ease' }}>
                      {buyer.crops}
                    </h3>
                    
                    <p className="mb-1" style={{ fontSize: '0.95rem', color: isHovered ? '#e0ebd5' : 'var(--text-muted)', transform: 'translateZ(20px)', transition: 'all 0.4s ease' }}>
                      Buyer: <strong className={isHovered ? "text-white" : "text-dark"}>{buyer.name}</strong>
                    </p>
                    
                    <p className="mb-2" style={{ fontSize: '0.95rem', color: isHovered ? '#e0ebd5' : 'var(--text-muted)', transform: 'translateZ(20px)', transition: 'all 0.4s ease' }}>
                      Rating: {buyer.rating} ⭐
                    </p>
                    
                    <h4 className={`fw-bold mb-4 mt-2 ${isHovered ? 'text-white' : 'text-success'}`} style={{ transform: 'translateZ(30px)', transition: 'all 0.4s ease' }}>
                      Rate: ₹{buyer.rate}/q
                    </h4>
                    <div className="d-flex gap-2 w-100 mt-auto">
                      <button 
                        className="btn fw-bold w-50 btn-premium-hover" 
                        onClick={() => {
                          const sellerKey = (currentUser.mobile || currentUser.name || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                          const buyerKey = (buyer.mobile || buyer.name || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                          const cropKey = (buyer.crops || 'crop').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                          const roomId = `room_${sellerKey}_${buyerKey}_${cropKey}`;
                          setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
                          setActiveChat({
                            name: buyer.crops,
                            weight: "Bulk",
                            rate: buyer.rate,
                            seller: currentUser.name,
                            seller_mobile: currentUser.mobile,
                            buyer: buyer.name,
                            buyerMobile: buyer.mobile,
                            roomId
                          });
                        }}
                        style={{ 
                          background: isHovered ? 'transparent' : 'transparent', 
                          border: isHovered ? '2px solid #f8f9fa' : '2px solid var(--primary)',
                          color: isHovered ? '#f8f9fa' : 'var(--primary)', 
                          borderRadius: '10px', padding: '10px 0', 
                          transform: 'translateZ(30px)', transition: 'all 0.4s ease' 
                        }}>
                        Contact
                      </button>
                      <button 
                        className="btn fw-bold w-50 btn-premium-hover" 
                        onClick={() => handleDirectSell(buyer, idx)}
                        style={{ 
                          background: isHovered ? '#f8f9fa' : 'var(--primary)', 
                          color: isHovered ? '#2e4a35' : 'white', 
                          borderRadius: '10px', padding: '10px 0', 
                          boxShadow: isHovered ? '0 4px 6px rgba(0,0,0,0.1)' : 'none', 
                          transform: 'translateZ(30px)', transition: 'all 0.4s ease' 
                        }}>
                        Sell Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
      
      <LiveBiddingToasts isModalOpen={isLiveBidsOpen} onClose={() => setIsLiveBidsOpen(false)} />
      <NegotiationChat chatData={activeChat} onClose={() => setActiveChat(null)} />

      {/* Edit Crop Modal */}
      {editModalData.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card-premium p-4" style={{ width: '90%', maxWidth: '400px', background: 'white' }}>
            <h4 className="fw-bold mb-3">Edit {editModalData.name}</h4>
            <form onSubmit={confirmEditCrop}>
              <div className="mb-3">
                <label className="form-label">Weight (Quintals)</label>
                <input type="number" className="form-control" value={editModalData.weight} onChange={e => setEditModalData({...editModalData, weight: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Rate (₹/q)</label>
                <input type="number" className="form-control" value={editModalData.rate} onChange={e => setEditModalData({...editModalData, rate: e.target.value})} required />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => setEditModalData({open: false})}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Crop Modal */}
      {sellModalData.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card-premium p-4" style={{ width: '90%', maxWidth: '500px', background: 'white' }}>
            <h4 className="fw-bold mb-3 text-success"><i className="fas fa-handshake me-2"></i>Dispatch & Sell {sellModalData.cropName}</h4>
            <form onSubmit={confirmMarkSold}>
              <div className="mb-3">
                <label className="form-label">Buyer's Name / Company</label>
                <input type="text" className="form-control custom-input" placeholder="e.g. Ramesh Trading Co." value={sellModalData.buyerName} onChange={e => setSellModalData({...sellModalData, buyerName: e.target.value})} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Buyer's Mobile Number (To link purchase)</label>
                <input type="text" className="form-control custom-input" placeholder="e.g. 9876543210" value={sellModalData.buyerMobile} onChange={e => setSellModalData({...sellModalData, buyerMobile: e.target.value})} required />
              </div>
              
              <div className="mb-3">
                <label className="form-label d-flex justify-content-between">
                  <span>Amount to Sell (Quintals)</span>
                  <span className="text-muted">Available Stock: {sellModalData.maxWeight}q</span>
                </label>
                <input type="number" className="form-control custom-input" placeholder="e.g. 50" min="1" value={sellModalData.weight} onChange={e => setSellModalData({...sellModalData, weight: e.target.value})} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Selling Rate (₹/q)</label>
                <input type="number" className="form-control custom-input" placeholder="e.g. 2450" min="1" value={sellModalData.rate} onChange={e => setSellModalData({...sellModalData, rate: e.target.value})} required />
              </div>

              <div className="mb-3">
                <label className="form-label d-flex justify-content-between">
                  <span>Distance to Buyer</span>
                  <span className="fw-bold text-success">{sellModalData.distance} km</span>
                </label>
                <input type="range" className="form-range" min="0" max="500" step="10" value={sellModalData.distance} onChange={(e) => setSellModalData({...sellModalData, distance: e.target.value})} />
                <small className="text-muted d-block mt-1">₹25 per quintal per 10km</small>
              </div>

              <div className="p-3 bg-light rounded border mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Gross Revenue:</span>
                  <span>₹{(sellModalData.rate * sellModalData.weight).toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Transport Cost:</span>
                  <span className="text-danger">- ₹{((sellModalData.distance / 10) * 25 * sellModalData.weight).toLocaleString('en-IN')}</span>
                </div>
                <hr className="my-2"/>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Net Take-Home Profit:</span>
                  <span className="text-success fs-5">₹{((sellModalData.rate * sellModalData.weight) - ((sellModalData.distance / 10) * 25 * sellModalData.weight)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment & Delivery Status</label>
                <select className="form-select custom-input" value={sellModalData.paymentStatus} onChange={e => setSellModalData({...sellModalData, paymentStatus: e.target.value})}>
                  <option value="pending">Awaiting Payment/Transport (Pending)</option>
                  <option value="sold">Delivered & Paid (Completed)</option>
                </select>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => setSellModalData({open: false})}>Cancel</button>
                <button type="submit" className="btn btn-success fw-bold px-4">Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Received Bids Modal */}
      {isBidsModalOpen && (
        <div className="dynamic-modal-overlay active">
          <div className="dynamic-modal text-start p-4" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark m-0"><i className="fas fa-gavel text-warning me-2"></i> Live Received Boli (Bids)</h5>
              <button className="btn-close" onClick={() => setIsBidsModalOpen(false)}></button>
            </div>
            {receivedBids.length === 0 ? (
              <p className="text-muted text-center py-4">Abhi tak koi boli prapt nahi hui hai.</p>
            ) : (
              <div className="row g-3">
                {receivedBids.map((b, i) => (
                  <div className="col-12" key={i}>
                    <div className="p-3 bg-white rounded border border-warning shadow-sm d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-warning text-dark mb-1">New Boli</span>
                        <h6 className="m-0 fw-bold">{b.crop_name || 'Crop'} ({b.weight || 0}q)</h6>
                        <small className="text-muted">Buyer: <strong>{b.buyer_name || 'Buyer'}</strong> ({b.buyer_mobile || 'N/A'})</small>
                        <div className="mt-1">
                          <span className="text-decoration-line-through text-muted small me-2">Asking: ₹{b.asking_rate || 0}/q</span>
                          <span className="fw-bold text-success fs-6">Bid: ₹{b.bid_rate || 0}/q</span>
                        </div>
                      </div>
                      <div>
                        {(!b.status || b.status === 'pending') ? (
                          <div className="d-flex flex-column gap-2 align-items-end">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-success fw-bold py-1 px-3" onClick={() => { setIsBidsModalOpen(false); handleAcceptBid(b); }}>Accept</button>
                              <button className="btn btn-sm btn-outline-danger py-1 px-3" onClick={() => handleRejectBid(b.id)}>Reject</button>
                              <button className="btn btn-sm btn-outline-primary py-1 px-2" onClick={() => {
                                setIsBidsModalOpen(false);
                                const sellerKey = (currentUser.mobile || currentUser.name || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                                const buyerKey = (b.buyer_mobile || b.buyer_name || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                                const cropKey = (b.crop_name || 'crop').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                                const roomId = `room_${sellerKey}_${buyerKey}_${cropKey}`;
                                setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
                                setActiveChat({
                                  name: b.crop_name,
                                  weight: b.weight,
                                  rate: b.bid_rate,
                                  seller: currentUser.name,
                                  seller_mobile: currentUser.mobile,
                                  buyer: b.buyer_name,
                                  buyerMobile: b.buyer_mobile,
                                  roomId
                                });
                              }}>
                                <i className="fas fa-comments me-1"></i> Chat
                              </button>
                            </div>
                            <div className="d-flex gap-1 mt-1">
                              <input 
                                type="number" 
                                className="form-control form-control-sm py-0 px-2" 
                                style={{ width: '95px', fontSize: '0.8rem' }} 
                                placeholder="Counter ₹" 
                                value={counterInputMap[b.id] || ''} 
                                onChange={e => setCounterInputMap({ ...counterInputMap, [b.id]: e.target.value })} 
                              />
                              <button className="btn btn-sm btn-warning fw-bold py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => handleCounterBid(b.id)}>Counter</button>
                            </div>
                          </div>
                        ) : (
                          <span className={`badge ${b.status === 'accepted' ? 'bg-success' : b.status === 'counter_offered' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{(b.status || 'pending').toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SellerPage;
