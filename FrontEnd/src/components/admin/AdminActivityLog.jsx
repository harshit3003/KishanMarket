import React from 'react';

const AdminActivityLog = () => {
  const sampleLogs = [
    { time: 'Just now', type: 'SYSTEM', event: 'MongoDB Cloud Atlas sync batch complete (18x speedup)' },
    { time: '2 mins ago', type: 'USER', event: 'SuperAdmin session authenticated securely' },
    { time: '5 mins ago', type: 'SECURITY', event: 'Rate Limiter active: 0 malicious IP blocks in last hour' },
    { time: '12 mins ago', type: 'ORDER', event: 'Order #1024 confirmed for 50 Quintals Dhan (Rice)' },
    { time: '25 mins ago', type: 'CROP', event: 'New crop listing Wheat (Gehu) posted in Banda, UP' }
  ];

  return (
    <div className="admin-panel-card mt-4">
      <h6 className="admin-panel-heading d-flex align-items-center justify-content-between">
        <span><i className="fas fa-clock-rotate-left me-2 text-warning"></i> Platform Activity Timeline & System Audit Logs</span>
        <span className="badge bg-emerald-500 text-white" style={{ background: '#10b981' }}>Live Feed</span>
      </h6>
      <div className="list-group list-group-flush bg-transparent">
        {sampleLogs.map((log, idx) => (
          <div key={idx} className="list-group-item bg-transparent text-white border-secondary px-0 py-2 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${log.type === 'SYSTEM' ? 'bg-primary' : log.type === 'SECURITY' ? 'bg-danger' : log.type === 'ORDER' ? 'bg-success' : 'bg-info'}`} style={{ fontSize: '0.7rem' }}>
                {log.type}
              </span>
              <span className="small text-muted-light">{log.event}</span>
            </div>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{log.time}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminActivityLog;
