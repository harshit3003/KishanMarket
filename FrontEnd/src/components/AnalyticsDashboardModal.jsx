import React, { useState, useEffect } from 'react';

const AnalyticsDashboardModal = ({ isOpen, onClose, currentUser }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSeller = currentUser?.role === 'seller' || currentUser?.role === 'farmer';

  useEffect(() => {
    if (isOpen && currentUser && currentUser.mobile) {
      fetchAnalytics();
    }
  }, [isOpen, currentUser]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const endpoint = isSeller ? `/api/analytics/farmer?mobile=${encodeURIComponent(currentUser.mobile)}` : `/api/analytics/buyer?mobile=${encodeURIComponent(currentUser.mobile)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const summary = data?.summary || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const topCrops = data?.topCrops || [];
  const aiInsights = data?.aiInsights || [];

  const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue), 1000);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '94%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-chart-line text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">{isSeller ? 'Farmer Performance & AI Analytics' : 'Buyer Procurement Analytics'}</h5>
              <small className="text-muted">Real-time revenue, volume metrics, & AI pricing intelligence</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Computing business performance metrics...</p>
          </div>
        ) : (
          <div>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="p-3 bg-success bg-opacity-10 border border-success rounded text-center">
                  <small className="text-muted fw-bold d-block">{isSeller ? 'TOTAL REVENUE' : 'TOTAL EXPENDITURE'}</small>
                  <span className="fs-4 fw-bold text-success">
                    ₹{(summary.totalRevenue || summary.totalSpent || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="p-3 bg-primary bg-opacity-10 border border-primary rounded text-center">
                  <small className="text-muted fw-bold d-block">VOLUME TRADED</small>
                  <span className="fs-4 fw-bold text-primary">
                    {(summary.totalVolume || 0).toLocaleString()} <small className="fs-6">Quintals</small>
                  </span>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="p-3 bg-info bg-opacity-10 border border-info rounded text-center">
                  <small className="text-muted fw-bold d-block">BEST SELLING CROP</small>
                  <span className="fs-6 fw-bold text-dark text-truncate d-block mt-1">
                    {summary.bestSellingCrop || summary.topProcuredCrop || 'Wheat'}
                  </span>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded text-center">
                  <small className="text-muted fw-bold d-block">TOTAL DEALS</small>
                  <span className="fs-4 fw-bold text-dark">
                    {summary.totalOrders || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Smart Recommendations Banner */}
            <div className="p-3 bg-dark text-white rounded-3 shadow-sm mb-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="fas fa-brain text-warning fs-4"></i>
                <h6 className="fw-bold text-warning m-0">KishanMarket AI Intelligence Signals</h6>
              </div>
              <div className="d-flex flex-column gap-2">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="small text-light bg-white bg-opacity-10 p-2 rounded">
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Revenue Trend Visualizer */}
            {isSeller && monthlyTrend.length > 0 && (
              <div className="p-3 bg-light border rounded-3 mb-4">
                <h6 className="fw-bold text-dark mb-3"><i className="fas fa-chart-column text-success me-1"></i> Monthly Revenue Trend (2026)</h6>
                <div className="d-flex align-items-end justify-content-between pt-4 pb-2 px-2" style={{ height: '180px', borderBottom: '2px solid #cbd5e1' }}>
                  {monthlyTrend.map((item, idx) => {
                    const barHeightPct = Math.max(10, Math.round((item.revenue / maxRevenue) * 100));
                    return (
                      <div key={idx} className="d-flex flex-column align-items-center flex-fill mx-1">
                        <small className="text-muted fw-bold mb-1" style={{ fontSize: '0.65rem' }}>
                          {item.revenue > 0 ? `₹${(item.revenue/1000).toFixed(1)}k` : ''}
                        </small>
                        <div 
                          className="w-100 rounded-top"
                          style={{
                            height: `${barHeightPct}%`,
                            background: item.revenue > 0 ? 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' : '#e2e8f0',
                            transition: 'height 0.5s ease'
                          }}
                          title={`${item.month}: ₹${item.revenue.toLocaleString()}`}
                        ></div>
                        <span className="small text-muted fw-bold mt-2" style={{ fontSize: '0.72rem' }}>{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Crops Breakdown */}
            <div className="p-3 bg-white border rounded-3">
              <h6 className="fw-bold text-dark mb-3"><i className="fas fa-wheat-awn text-warning me-1"></i> Crop Revenue & Volume Share</h6>
              {topCrops.length === 0 ? (
                <div className="text-center py-3 text-muted small">No completed sales recorded yet.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {topCrops.map((crop, idx) => {
                    const val = crop.revenue || crop.amount || 0;
                    const maxVal = topCrops[0]?.revenue || topCrops[0]?.amount || 1;
                    const pct = Math.round((val / maxVal) * 100);

                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark small">{crop.name}</strong>
                          <span className="fw-bold text-success small">₹{val.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-success"
                            role="progressbar" 
                            style={{ width: `${pct}%` }} 
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end pt-3 border-top mt-4">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close Analytics</button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardModal;
