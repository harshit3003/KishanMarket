import React from 'react';

const AdminUserTable = ({ users, searchFilter, setSearchFilter, handleUserToggleStatus }) => {
  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (u.mobile || '').includes(searchFilter) ||
    (u.role || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-white m-0"><i className="fas fa-users text-info me-2"></i> Registered Platform Users</h5>
        <input
          type="text"
          className="form-control form-control-sm bg-dark text-white border-secondary w-auto"
          placeholder="Filter users..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
        />
      </div>
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="table table-dark table-hover table-bordered align-middle small mb-0">
          <thead className="table-secondary text-dark sticky-top">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No matching users found</td></tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const isSuspended = u.account_status === 'suspended';
                return (
                  <tr key={u.user_id || u.mobile || idx}>
                    <td><code>{u.user_id || `KM-U-${idx+1}`}</code></td>
                    <td className="fw-bold">{u.name}</td>
                    <td>{u.mobile}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : u.role === 'seller' ? 'bg-success' : 'bg-info'}`}>
                        {u.role ? u.role.toUpperCase() : 'USER'}
                      </span>
                    </td>
                    <td>{u.location || 'India'}</td>
                    <td>
                      <span className={`badge ${isSuspended ? 'bg-danger' : 'bg-emerald-500'}`} style={!isSuspended ? { background: '#10b981' } : {}}>
                        {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${isSuspended ? 'btn-outline-success' : 'btn-outline-danger'}`}
                          onClick={() => handleUserToggleStatus(u.mobile, isSuspended)}
                        >
                          {isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserTable;
