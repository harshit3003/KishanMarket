import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const TaxInvoiceModal = ({ isOpen, onClose, orderId }) => {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchInvoice();
    }
  }, [isOpen, orderId]);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (res.ok) {
        setInvoice(await res.json());
      } else {
        toast.error("Failed to generate tax invoice.");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      toast.error("Network error fetching invoice.");
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '92%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {isLoading || !invoice ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Generating B2B Tax Invoice...</p>
          </div>
        ) : (
          <div id="printableInvoiceArea">
            {/* Invoice Header */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
              <div>
                <h4 className="fw-bold text-success m-0"><i className="fas fa-wheat-awn me-2"></i>KISHANMARKET</h4>
                <small className="text-muted fw-bold d-block">TAX INVOICE / B2B BILL OF SUPPLY</small>
                <small className="text-secondary">GSTIN: {invoice.seller.gstin}</small>
              </div>
              <div className="text-end">
                <span className="badge bg-success fs-6 mb-1">{invoice.invoiceNumber}</span>
                <small className="text-muted d-block">Date: {invoice.invoiceDate}</small>
                <small className="text-muted d-block">Order ID: #{invoice.orderId}</small>
              </div>
            </div>

            {/* B2B Party Info */}
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="small text-muted fw-bold mb-1">SELLER DETAILS (FARMER / VENDOR)</div>
                  <strong className="text-dark d-block">{invoice.seller.name}</strong>
                  {invoice.seller.businessName && <div className="small text-secondary fw-bold">{invoice.seller.businessName}</div>}
                  <small className="text-muted d-block">{invoice.seller.address}, {invoice.seller.district} - {invoice.seller.pincode}</small>
                  <small className="text-muted d-block">Mobile: +91 {invoice.seller.mobile}</small>
                </div>
              </div>

              <div className="col-6">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="small text-muted fw-bold mb-1">BUYER DETAILS (TRADER / PURCHASER)</div>
                  <strong className="text-dark d-block">{invoice.buyer.name}</strong>
                  {invoice.buyer.businessName && <div className="small text-secondary fw-bold">{invoice.buyer.businessName}</div>}
                  <small className="text-muted d-block">{invoice.buyer.address}, {invoice.buyer.district} - {invoice.buyer.pincode}</small>
                  <small className="text-muted d-block">Mobile: +91 {invoice.buyer.mobile}</small>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="table-responsive mb-3 border rounded">
              <table className="table table-bordered m-0 align-middle small">
                <thead className="table-success">
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center">HSN/SAC</th>
                    <th className="text-end">Qty (Quintals)</th>
                    <th className="text-end">Rate (₹/q)</th>
                    <th className="text-end">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong className="text-dark">{invoice.cropName}</strong>
                      <small className="text-muted d-block">Agricultural Produce (A-Grade Quality)</small>
                    </td>
                    <td className="text-center">1001</td>
                    <td className="text-end fw-bold">{invoice.quantityQuintals} q</td>
                    <td className="text-end">₹{invoice.ratePerQuintal.toLocaleString('en-IN')}</td>
                    <td className="text-end fw-bold text-dark">₹{invoice.financials.subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax & Financial Breakdown */}
            <div className="row justify-content-end mb-4">
              <div className="col-md-6">
                <table className="table table-sm border m-0 small">
                  <tbody>
                    <tr>
                      <td className="text-muted">Taxable Produce Value:</td>
                      <td className="text-end fw-bold">₹{invoice.financials.taxableValue.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">CGST (2.5%):</td>
                      <td className="text-end">₹{invoice.financials.cgst.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">SGST (2.5%):</td>
                      <td className="text-end">₹{invoice.financials.sgst.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="table-success fw-bold">
                      <td className="text-success fs-6">Grand Total:</td>
                      <td className="text-end text-success fs-6">₹{invoice.financials.grandTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Digital Stamp Footer */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
              <div>
                <small className="text-success fw-bold d-block"><i className="fas fa-shield-check me-1"></i> Digitally Signed & Verified</small>
                <small className="text-muted font-monospace">{invoice.verificationSeal}</small>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                  <i className="fas fa-print me-1"></i> Print / Download PDF
                </button>
                <button className="btn btn-sm btn-success fw-bold px-4" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TaxInvoiceModal;
