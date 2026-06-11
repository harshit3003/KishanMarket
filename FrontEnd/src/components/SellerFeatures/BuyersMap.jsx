import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon missing issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const buyers = [
  { id: 1, lat: 30.900965, lng: 75.857277, name: 'Reliance Agri', crop: 'Gehu', rate: '₹2,600/q' }, // Ludhiana
  { id: 2, lat: 29.685692, lng: 76.990482, name: 'ITC Limited', crop: 'Dhan', rate: '₹2,200/q' }, // Karnal
  { id: 3, lat: 31.326015, lng: 75.576180, name: 'Punjab Mandi', crop: 'Gehu', rate: '₹2,480/q' }, // Jalandhar
  { id: 4, lat: 28.895515, lng: 76.583099, name: 'Adani Wholesales', crop: 'Makka', rate: '₹2,510/q' }, // Rohtak
];

const BuyersMap = () => {
  return (
    <div className="glass-card p-0 overflow-hidden mb-4" style={{ height: '400px', position: 'relative' }}>
      <div className="position-absolute top-0 start-0 w-100 p-3" style={{ zIndex: 400, background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)' }}>
        <h5 className="text-white m-0 fw-bold"><i className="fas fa-map-marked-alt text-warning me-2"></i> Live Buyers Heatmap</h5>
      </div>
      <MapContainer center={[30.5, 76]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {buyers.map(b => (
          <Marker key={b.id} position={[b.lat, b.lng]}>
            <Popup>
              <div className="text-center">
                <h6 className="fw-bold text-success mb-1">{b.name}</h6>
                <span className="badge bg-warning text-dark mb-2">{b.crop}</span>
                <p className="m-0 fw-bold">Rate: {b.rate}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BuyersMap;
