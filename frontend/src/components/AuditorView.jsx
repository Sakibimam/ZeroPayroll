import React, { useState } from 'react';
import { auditPayroll } from '../lib/api';
import { truncateAddress, formatSalary } from '../lib/crypto';

function AuditorView() {
  const [employerAddress, setEmployerAddress] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employerAddress || !masterKey) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await auditPayroll(employerAddress, masterKey);
      setResult(response.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedPayments = React.useMemo(() => {
    if (!result) return [];
    let sortableItems = [...result];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [result, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = ['Employee ID', 'Wallet Address', 'Salary (cents)', 'Salary (USDC)', 'TX Hash', 'Timestamp'];
    const rows = result.map(p => [
      p.employee_id,
      p.wallet_address,
      p.salary_usdc_cents,
      formatSalary(p.salary_usdc_cents),
      p.tx_hash,
      new Date(p.timestamp * 1000).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_audit_${employerAddress.slice(0, 8)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPayroll = result ? result.reduce((sum, p) => sum + p.salary_usdc_cents, 0) : 0;

  return (
    <div className="view-container">
      {!result ? (
        <form onSubmit={handleSubmit} className="card">
          <h2 className="card-title">Audit Employer Payroll</h2>
          
          <div className="form-group">
            <label>Employer Stellar Address</label>
            <input 
              type="text"
              value={employerAddress}
              onChange={(e) => setEmployerAddress(e.target.value)}
              placeholder="G..."
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label>Master View Key</label>
            <div className="input-with-action">
              <input 
                type={showKey ? 'text' : 'password'}
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="64-character hex key"
                className="input-field"
                required
              />
              <button 
                type="button" 
                className="toggle-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button 
            type="submit" 
            className="primary-btn"
            disabled={!employerAddress || !masterKey || loading}
          >
            {loading ? (
              <span className="loader-container">
                <span className="spinner"></span>
                Fetching and decrypting payroll...
              </span>
            ) : 'Decrypt Payroll'}
          </button>
        </form>
      ) : (
        <div className="audit-results fade-in">
          <div className="summary-bar">
            <div className="summary-item">
              <span className="label">Total Payroll</span>
              <span className="value">{formatSalary(totalPayroll)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span className="label">Employees</span>
              <span className="value">{result.length}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span className="label">Status</span>
              <span className="value-green">Verified</span>
            </div>
          </div>

          <div className="card table-card">
            <div className="table-header">
              <h3 className="card-title" style={{ margin: 0 }}>Decrypted Payroll Table</h3>
              <button onClick={exportCSV} className="export-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export as CSV
              </button>
            </div>
            
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('employee_id')}>ID {sortConfig.key === 'employee_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('wallet_address')}>Wallet {sortConfig.key === 'wallet_address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('salary_usdc_cents')}>Salary {sortConfig.key === 'salary_usdc_cents' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('timestamp')}>Date {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th>TX</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map((p, i) => (
                    <tr key={i}>
                      <td className="mono">{p.employee_id}</td>
                      <td>
                        <div className="addr-cell">
                          {truncateAddress(p.wallet_address)}
                          <button className="small-copy" onClick={() => navigator.clipboard.writeText(p.wallet_address)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                        </div>
                      </td>
                      <td className="amount-cell">{formatSalary(p.salary_usdc_cents)}</td>
                      <td className="secondary-text">{new Date(p.timestamp * 1000).toLocaleDateString()}</td>
                      <td>
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${p.tx_hash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="tx-link"
                        >
                          {p.tx_hash.slice(0, 4)}...{p.tx_hash.slice(-4)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={() => setResult(null)} className="secondary-btn">New Audit</button>
        </div>
      )}

      <style>{`
        .view-container {
          width: 100%;
        }
        .card {
          background: #111318;
          border: 1px solid #1E2028;
          border-radius: 12px;
          padding: 24px;
        }
        .table-card {
          padding: 0;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .table-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1E2028;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #64748B;
        }
        .input-field {
          width: 100%;
          background: #0A0B0D;
          border: 1px solid #1E2028;
          border-radius: 8px;
          padding: 12px 16px;
          color: #F1F5F9;
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }
        .input-field:focus {
          outline: none;
          border-color: #7C6AF7;
        }
        .input-with-action {
          display: flex;
          gap: 8px;
        }
        .toggle-btn {
          background: #1E2028;
          border: none;
          color: #64748B;
          padding: 0 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn {
          width: 100%;
          background: #7C6AF7;
          border: none;
          color: white;
          padding: 14px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .secondary-btn {
          background: none;
          border: 1px solid #1E2028;
          color: #F1F5F9;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .summary-bar {
          display: flex;
          align-items: center;
          background: #111318;
          border: 1px solid #1E2028;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
          justify-content: space-between;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .summary-item .label {
          font-size: 12px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-item .value {
          font-size: 18px;
          font-weight: 700;
        }
        .summary-item .value-green {
          font-size: 18px;
          font-weight: 700;
          color: #22C55E;
        }
        .summary-divider {
          width: 1px;
          height: 32px;
          background: #1E2028;
        }
        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(124, 106, 247, 0.1);
          border: 1px solid rgba(124, 106, 247, 0.2);
          color: #7C6AF7;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .export-btn:hover {
          background: rgba(124, 106, 247, 0.2);
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table th {
          text-align: left;
          padding: 12px 24px;
          background: #111318;
          color: #64748B;
          font-weight: 500;
          border-bottom: 1px solid #1E2028;
          cursor: pointer;
          user-select: none;
        }
        .data-table th:hover {
          color: #F1F5F9;
        }
        .data-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #1E2028;
        }
        .mono {
          font-family: monospace;
          color: #64748B;
        }
        .addr-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .small-copy {
          background: none;
          border: none;
          color: #64748B;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .small-copy:hover {
          background: #1E2028;
          color: #F1F5F9;
        }
        .amount-cell {
          font-weight: 600;
          color: #F1F5F9;
        }
        .secondary-text {
          color: #64748B;
        }
        .tx-link {
          color: #7C6AF7;
          text-decoration: none;
          font-family: monospace;
        }
        .tx-link:hover {
          text-decoration: underline;
        }
        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuditorView;
