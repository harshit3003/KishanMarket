import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught runtime UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '85vh', background: '#0f172a', color: '#f8fafc', padding: '20px' }}>
          <div className="card border-0 rounded-4 shadow-lg p-5 text-center" style={{ background: '#1e293b', border: '1px solid #334155', maxWidth: '520px' }}>
            <div className="mb-4">
              <span className="badge bg-danger p-3 rounded-circle fs-3 shadow-sm">
                <i className="fas fa-bug text-white"></i>
              </span>
            </div>
            <h3 className="fw-bold text-white mb-2">Something went wrong</h3>
            <p className="small mb-4" style={{ color: '#94a3b8' }}>
              An unexpected runtime error occurred in the application UI. The system has safely isolated the crash.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-emerald fw-bold px-4 py-2 rounded-3 shadow-sm"
                style={{ background: '#059669', color: '#ffffff', border: 'none' }}
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-rotate me-2"></i> Reload Application
              </button>
              <button
                className="btn btn-outline-secondary fw-semibold px-4 py-2 rounded-3 text-white border-secondary"
                onClick={() => window.location.href = '/'}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
