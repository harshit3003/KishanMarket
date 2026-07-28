import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NearbyFarmersSection = ({ currentUser, onSelectChat, onViewProfile }) => {
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState(currentUser?.location || 'Banda');
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    fetchNearbyFarmers(searchLocation, userCoords);
  }, []);

  const fetchNearbyFarmers = async (locStr, coordsObj) => {
    setIsLoading(true);
    try {
      let url = '/api/farmers/nearby?';
      if (coordsObj && coordsObj.lat && coordsObj.lng) {
        url += `lat=${coordsObj.lat}&lng=${coordsObj.lng}&`;
      } else {
        url += `location=${encodeURIComponent(locStr || 'Banda')}&`;
      }

      const res = await fetch(url);
      if (res.ok) {
        setFarmers(await res.json());
      } else {
        toast.error("Failed to fetch nearby farmers");
      }
    } catch (err) {
      console.error("Error fetching nearby farmers:", err);
    }
    setIsLoading(false);
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      toast.loading("Detecting your GPS location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.dismiss();
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          toast.success("GPS location locked! Calculating nearby farmers...");
          fetchNearbyFarmers('', coords);
        },
        () => {
          toast.dismiss();
          toast.error("GPS access denied. Enter your city or pincode manually.");
        }
      );
    } else {
      toast.error("GPS location is not supported by your browser.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setUserCoords(null);
    fetchNearbyFarmers(searchLocation, null);
  };

  return (
    <div className="glass-card-premium p-4 mb-5 shadow-sm border-accent text-start" style={{ background: '#ffffff', borderRadius: '18px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-3 mb-4">
        <div>
          <h4 className="fw-bold text-success m-0 d-flex align-items-center gap-2">
            <i className="fas fa-location-crosshairs text-danger"></i> Nearby Farmers (Pass ke Kisan)
          </h4>
          <small className="text-muted">Sorted by exact transport distance to minimize logistics cost</small>
        </div>

        {/* Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2 align-items-center flex-wrap ms-auto">
          <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
            <span className="input-group-text bg-light text-muted"><i className="fas fa-map-marker-alt"></i></span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="City, District or Pincode..." 
              value={searchLocation} 
              onChange={(e) => setSearchLocation(e.target.value)} 
            />
            <button type="submit" className="btn btn-success fw-bold">Search</button>
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary fw-bold" onClick={handleUseGPS} title="Use Live GPS Location">
            <i className="fas fa-crosshairs me-1"></i> Use GPS
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="small text-muted mt-2">Calculating spatial distances and searching local farmers...</p>
        </div>
      ) : farmers.length === 0 ? (
        <div className="text-center py-4 bg-light rounded border">
          <i className="fas fa-tractor text-muted fa-2x mb-2 opacity-50"></i>
          <div className="fw-bold text-dark">No nearby farmers found within this range.</div>
          <small className="text-muted">Try searching another nearby district or state.</small>
        </div>
      ) : (
        <div className="row g-3">
          {farmers.map((farmer, idx) => (
            <div key={farmer.id || idx} className="col-md-6 col-lg-4">
              <div className="p-3 bg-white border rounded-3 shadow-sm h-100 d-flex flex-column justify-content-between position-relative" style={{ transition: 'transform 0.2s ease-in-out' }}>
                <div>
                  {/* Distance Badge */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-danger text-white fw-bold px-2 py-1 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      <i className="fas fa-route me-1"></i> {farmer.distance} km away
                    </span>
                    <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.75rem' }}>
                      ⭐ {farmer.avg_rating ? parseFloat(farmer.avg_rating).toFixed(1) : '5.0'}
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden',
                      backgroundColor: '#dcfce7', color: '#15803d', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {farmer.profile_photo ? (
                        <img src={farmer.profile_photo} alt={farmer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="fas fa-tractor fa-lg"></i>
                      )}
                    </div>

                    <div>
                      <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-1">
                        {farmer.name}
                        <i className="fas fa-check-circle text-primary" style={{ fontSize: '0.85rem' }}></i>
                      </h6>
                      {farmer.business_name && <small className="text-secondary fw-bold d-block">{farmer.business_name}</small>}
                      <small className="text-muted"><i className="fas fa-location-dot me-1 text-danger"></i>{farmer.location || 'Local Farm'}</small>
                    </div>
                  </div>

                  {/* Crops Inventory */}
                  <div className="p-2 bg-light rounded border mb-3">
                    <small className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.7rem' }}>CULTIVATED & AVAILABLE CROPS</small>
                    {farmer.crops && farmer.crops.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {farmer.crops.map((c, i) => (
                          <span key={i} className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1" style={{ fontSize: '0.7rem' }}>
                            {c.name} (₹{c.rate}/q - {c.weight}q)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="small text-muted font-italic">{farmer.crops_specialty || 'Wheat, Rice, Mustard'}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 pt-2 border-top">
                  <button 
                    className="btn btn-sm btn-outline-secondary w-50 fw-bold"
                    onClick={() => onViewProfile(farmer.mobile || farmer.name)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="btn btn-sm btn-success w-50 fw-bold"
                    onClick={() => {
                      const cropItem = farmer.crops && farmer.crops[0];
                      const cropName = cropItem ? cropItem.name : 'Gehu';
                      const sellerKey = (farmer.mobile || farmer.name).toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                      const buyerKey = (currentUser.mobile || currentUser.name).toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                      const cropKey = cropName.toLowerCase().replace(/[^a-z0-9]/g, '');

                      onSelectChat({
                        name: cropName,
                        weight: cropItem ? `${cropItem.weight}q` : "Bulk",
                        rate: cropItem ? cropItem.rate : "Market Rate",
                        seller: farmer.name,
                        seller_mobile: farmer.mobile,
                        buyer: currentUser.name,
                        buyerMobile: currentUser.mobile,
                        roomId: `room_${sellerKey}_${buyerKey}_${cropKey}`
                      });
                    }}
                  >
                    <i className="fas fa-comments me-1"></i> Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyFarmersSection;
