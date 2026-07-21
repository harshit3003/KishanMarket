import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getInstantCoords } from '../utils/geoUtils';

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
  const userCoordsInstant = getInstantCoords(userLocation);
  const [mapCenter, setMapCenter] = useState(userCoordsInstant);
  const [userCoords, setUserCoords] = useState(userCoordsInstant);

  // Instant zero-latency marker calculation
  const geocodedMarkers = (items || []).map((item, idx) => {
    const locName = item.loc || item.location || item.buyer_location || 'India';
    const coords = getInstantCoords(locName);
    return {
      ...item,
      coords: coords,
      lat: coords[0] + ((idx % 3) * 0.005), // Subtle jitter to avoid overlapping pins
      lng: coords[1] + ((idx % 2) * 0.005),
      markerType: item.budget || item.buyer_mobile ? 'buyer' : 'seller'
    };
  });

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
