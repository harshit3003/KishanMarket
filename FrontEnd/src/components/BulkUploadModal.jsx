import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const BulkUploadModal = ({ isOpen, onClose, currentUser, onUploadSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      toast.error("File is empty or contains only headers.");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length >= 3) {
        items.push({
          name: parts[0] || 'Crop',
          weight: parseFloat(parts[1]) || 50,
          rate: parseFloat(parts[2]) || 2000,
          loc: parts[3] || currentUser?.location || 'Local Mandi'
        });
      }
    }

    setParsedRows(items);
    if (items.length > 0) {
      toast.success(`Parsed ${items.length} crop entries from CSV.`);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.includes(',')) {
      parseCSV(text);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) {
      toast.error("Please log in to upload bulk listings.");
      return;
    }

    if (parsedRows.length === 0) {
      toast.error("No valid crop rows to upload. Please upload or paste a valid CSV.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/listings/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_mobile: currentUser.mobile,
          seller_name: currentUser.name || 'Farmer',
          default_location: currentUser.location || 'Local Mandi',
          items: parsedRows
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`🎉 ${data.insertedCount} crop listings published in bulk!`);
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to process bulk upload.");
      }
    } catch (err) {
      toast.error("Network error during bulk upload.");
    }
    setIsSubmitting(false);
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 10000000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-file-csv text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Bulk Crop Listing Upload</h5>
              <small className="text-muted">Upload multiple crop varieties at once using CSV</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="p-3 bg-light rounded border mb-3 text-start">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold text-dark small"><i className="fas fa-download me-1 text-primary"></i> Sample CSV Template</span>
            <a href="/api/listings/bulk-template" download className="btn btn-sm btn-outline-success fw-bold">
              Download CSV Template
            </a>
          </div>
          <small className="text-muted d-block">
            Format: <code>Crop Name, Weight (Quintals), Rate (Rs/q), Location</code>
          </small>
        </div>

        <form onSubmit={handleUploadSubmit}>
          {/* File Selector */}
          <div className="mb-3">
            <label className="form-label small fw-bold">Select CSV File</label>
            <input 
              type="file" 
              accept=".csv, .txt" 
              className="form-control form-control-sm"
              onChange={handleFileChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Or Paste CSV Data Directly</label>
            <textarea
              className="form-control form-control-sm font-monospace"
              rows="4"
              placeholder={`Crop Name, Weight, Rate, Location\nGehu (Wheat), 100, 2450, Banda\nBasmati Dhan, 80, 3100, Karnal`}
              value={csvText}
              onChange={handleTextChange}
            ></textarea>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="mb-3">
              <label className="form-label small fw-bold text-success">
                <i className="fas fa-check-circle me-1"></i> Preview ({parsedRows.length} Crop Listings Ready)
              </label>
              <div className="table-responsive border rounded" style={{ maxHeight: '160px' }}>
                <table className="table table-sm table-striped m-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Crop Name</th>
                      <th>Weight</th>
                      <th>Rate</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold text-success">{r.name}</td>
                        <td>{r.weight}q</td>
                        <td>₹{r.rate}/q</td>
                        <td>{r.loc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-success fw-bold px-4" disabled={isSubmitting || parsedRows.length === 0}>
              {isSubmitting ? 'Uploading Listings...' : `Publish ${parsedRows.length} Listings`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default BulkUploadModal;
