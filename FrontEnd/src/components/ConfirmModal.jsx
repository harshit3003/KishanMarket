import React from 'react';

const ConfirmModal = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, type = 'danger' }) => {
  if (!isOpen) return null;

  const getBadgeColor = () => {
    switch (type) {
      case 'danger': return 'bg-danger';
      case 'warning': return 'bg-warning text-dark';
      case 'info': return 'bg-primary';
      default: return 'bg-success';
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <span className={`badge ${getBadgeColor()} p-2 rounded-circle`}>
                <i className={`fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-white`}></i>
              </span>
              {title || 'Confirmation Required'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body py-4 px-4">
            <p className="m-0 fs-6" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0 pb-4 px-4 gap-2">
            <button type="button" className="btn btn-outline-secondary rounded-3 px-4 fw-semibold text-white border-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-emerald'} rounded-3 px-4 fw-bold shadow-sm`}
              style={type !== 'danger' ? { background: '#059669', color: '#ffffff', border: 'none' } : {}}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
