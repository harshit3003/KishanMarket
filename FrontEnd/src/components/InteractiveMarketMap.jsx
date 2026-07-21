import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Leaflet Markers with distinct colors
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  user: createCustomIcon('green'),      // Logged in User Location
  seller: createCustomIcon('blue'),     // Crop Sellers
  buyer: createCustomIcon('gold')       // Buyer Requests
};

// Component to dynamically re-center map view
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 8);
    }
  }, [center, map]);
  return null;
};

const InteractiveMarketMap = ({ userLocation = 'Karnal, Haryana', userRole = 'seller', items = [], title = 'Live Market Map' }) => {
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default Delhi
  const [userCoords, setUserCoords] = useState(null);
  const [geocodedMarkers, setGeocodedMarkers] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // 1. Geocode current user's profile location
  useEffect(() => {
    if (!userLocation) return;
    
    const geocodeUser = async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(userLocation)}&count=1`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const lat = data.results[0].latitude;
          const lng = data.results[0].longitude;
          setMapCenter([lat, lng]);
          setUserCoords([lat, lng]);
        }
      } catch (err) {
        console.error("Geocoding user location failed", err);
      }
    };

    geocodeUser();
  }, [userLocation]);

  // 2. Geocode listings & buyer requests dynamically
  useEffect(() => {
    const geocodeItems = async () => {
      if (!items || items.length === 0) {
        setGeocodedMarkers([]);
        return;
      }
      
      setIsGeocoding(true);
      const results = [];
      const cache = {};

      for (let i = 0; i < Math.min(items.length, 12); i++) {
        const item = items[i];
        const locName = item.location || item.loc || userLocation;
        
        if (!locName) continue;

        let coords = cache[locName];
        if (!coords) {
          try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locName)}&count=1`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              // Add slight random offset so multiple items in same city don't overlap completely
              const offsetLat = (Math.random() - 0.5) * 0.05;
              const offsetLng = (Math.random() - 0.5) * 0.05;
              coords = [data.results[0].latitude + offsetLat, data.results[0].longitude + offsetLng];
              cache[locName] = coords;
            }
          } catch (e) {}
        }

        if (coords) {
          results.push({
            id: item.id || i,
            title: item.name || item.crop || item.crops || 'Market Listing',
            person: item.seller || item.name || item.buyer_name || 'Trader',
            rate: item.rate || item.budget || 'Negotiable',
            weight: item.weight ? `${item.weight}q` : '',
            location: locName,
            type: item.crops || item.buyer_mobile ? 'buyer' : 'seller',
            coords
          });
        }
      }

      setGeocodedMarkers(results);
      setIsGeocoding(false);
    };

    geocodeItems();
  }, [items, userLocation]);

  return (
    <div className="glass-card-premium p-0 overflow-hidden mb-4 rounded-3 shadow-lg" style={{ height: '420px', position: 'relative' }}>
      {/* Map Header Banner */}
      <div className="position-absolute top-0 start-0 w-100 p-3 d-flex justify-content-between align-items-center" style={{ zIndex: 400, background: 'linear-gradient(180deg, rgba(15,23,42,0.85), transparent)' }}>
        <div>
          <h5 className="text-white m-0 fw-bold d-flex align-items-center gap-2">
            <i className="fas fa-map-marked-alt text-warning"></i> {title}
          </h5>
          <small className="text-light opacity-75">
            <i className="fas fa-location-arrow text-success me-1"></i> Center: {userLocation}
          </small>
        </div>
        
        {/* Map Key Legend */}
        <div className="d-flex gap-2 bg-dark bg-opacity-75 p-2 rounded border border-secondary text-white small" style={{ fontSize: '0.75rem' }}>
          <span className="d-flex align-items-center"><i className="fas fa-map-marker-alt text-success me-1"></i> You ({userRole})</span>
          <span className="d-flex align-items-center"><i className="fas fa-map-marker-alt text-primary me-1"></i> Sellers</span>
          <span className="d-flex align-items-center"><i className="fas fa-map-marker-alt text-warning me-1"></i> Buyers</span>
        </div>
      </div>

      {isGeocoding && (
        <div className="position-absolute bottom-0 end-0 m-3 px-3 py-2 bg-dark text-white rounded-pill shadow small opacity-75" style={{ zIndex: 400 }}>
          <i className="fas fa-spinner fa-spin me-2 text-warning"></i> Geocoding live market pins...
        </div>
      )}

      <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
        <MapRecenter center={mapCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* User's Own Location Marker */}
        {userCoords && (
          <Marker position={userCoords} icon={icons.user}>
            <Popup>
              <div className="text-center p-1">
                <span className="badge bg-success mb-1">Your Registered Location</span>
                <h6 className="fw-bold m-0 text-dark">{userLocation}</h6>
                <small className="text-muted">Role: {userRole.toUpperCase()}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic Buyers & Sellers Markers */}
        {geocodedMarkers.map(m => (
          <Marker key={m.id} position={m.coords} icon={m.type === 'buyer' ? icons.buyer : icons.seller}>
            <Popup>
              <div className="text-center p-1">
                <span className={`badge ${m.type === 'buyer' ? 'bg-warning text-dark' : 'bg-primary'} mb-1`}>
                  {m.type === 'buyer' ? 'Active Buyer Request' : 'Active Listing'}
                </span>
                <h6 className="fw-bold text-dark m-0">{m.title} {m.weight}</h6>
                <p className="small text-muted mb-1">{m.type === 'buyer' ? 'Buyer' : 'Seller'}: <strong>{m.person}</strong></p>
                <p className="fw-bold text-success m-0">Rate: ₹{m.rate}/q</p>
                <small className="text-muted"><i className="fas fa-map-marker-alt me-1"></i>{m.location}</small>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default InteractiveMarketMap;
