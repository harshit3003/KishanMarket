import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const TRANSPORTER_PRESETS = [
  "VRL Logistics Agri Truck",
  "Delhivery Produce Fleet",
  "TCI Freight Logistics",
  "Local Mandi Tractor / Truck",
  "Other Transport Company"
];

const ShipmentUpdateModal = ({ isOpen, onClose, order, onShipmentDispatched }) => {
  const [transporterName, setTransporterName] = useState(TRANSPORTER_PRESETS[0]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [estDeliveryDate, setEstDeliveryDate] = useState('2-3 Business Days');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/shipment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_name: transporterName,
          vehicle_no: vehicleNo || 'UP 78 BT 4521',
          tracking_id: trackingId || `LR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          driver_phone: driverPhone || '9876543210',
          est_delivery_date: estDeliveryDate
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`🚚 Order #${order.id} dispatched! Vehicle ${data.order.vehicle_no} assigned.`);
        if (onShipmentDispatched) onShipmentDispatched(data.order);
        onClose();
      } else {
        toast.error(data.error || "Failed to update shipment details.");
      }
    } catch (err) {
      toast.error("Network error dispatching shipment.");
    }
    setIsSubmitting(false);
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '500px', background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-truck-fast text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Dispatch Order #{order.id}</h5>
              <small className="text-muted">Item: {order.crop_name} ({order.quantity})</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Select Transport / Freight Company</label>
            <select 
              className="form-select form-select-sm"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
            >
              {TRANSPORTER_PRESETS.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Vehicle Reg. Number</label>
              <input 
                type="text"
                className="form-control form-control-sm text-uppercase"
                placeholder="e.g. UP 78 BT 4521"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Tracking / LR Receipt ID</label>
              <input 
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. LR-98765"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Driver Contact Number</label>
              <input 
                type="tel"
                className="form-control form-control-sm"
                placeholder="e.g. 9876543210"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Est. Delivery Date</label>
              <input 
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. 2 Days / 30 July"
                value={estDeliveryDate}
                onChange={(e) => setEstDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-success fw-bold px-4" disabled={isSubmitting}>
              {isSubmitting ? 'Dispatching...' : 'Mark Order Shipped 🚚'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ShipmentUpdateModal;
