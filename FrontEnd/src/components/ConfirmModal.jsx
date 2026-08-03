import React, { useEffect } from 'react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  isLoading = false,
  hasInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = 'Enter text...'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

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
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000000,
        animation: 'fadeInModal 0.25s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content border-0 rounded-4 shadow-lg overflow-hidden"
          style={{
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <span className={`badge ${getBadgeColor()} p-2 rounded-circle`}>
                <i className={`fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-white`}></i>
              </span>
              {title || 'Confirmation Required'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              disabled={isLoading}
              onClick={onCancel}
            ></button>
          </div>

          <div className="modal-body py-4 px-4">
            {message && <p className="m-0 fs-6 mb-3" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{message}</p>}
            
            {hasInput && (
              <div className="mt-2">
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary rounded-3 py-2 px-3 shadow-inner"
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => onInputChange && onInputChange(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0 pb-4 px-4 gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 px-4 fw-semibold text-white border-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            
            <button
              type="button"
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-emerald'} rounded-3 px-4 fw-bold shadow-sm d-flex align-items-center gap-2`}
              style={type !== 'danger' ? { background: '#059669', color: '#ffffff', border: 'none' } : {}}
              onClick={() => onConfirm(hasInput ? inputValue : undefined)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
