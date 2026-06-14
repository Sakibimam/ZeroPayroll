import React, { useState, useRef } from 'react';
import { generateRandomViewKey, truncateAddress } from '../lib/crypto';
import { submitPayroll } from '../lib/api';

function EmployerView() {
  const [file, setFile] = useState(null);
  const [masterKey, setMasterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleGenerateKey = () => {
    setMasterKey(generateRandomViewKey());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !masterKey) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await submitPayroll(file, masterKey);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      {!result ? (
        <form onSubmit={handleSubmit} className="card">
          <h2 className="card-title">Upload Payroll</h2>
          
          <div className="form-group">
            <label>Payroll CSV File</label>
            <div 
              className={`upload-area ${file ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current.click()}
            >
              {file ? (
                <div className="file-info">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>{file.name}</span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <p>Click or drag CSV file to upload</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: 'none' }}
              />
            </div>
            <a href="/sample_payroll.csv" download className="text-link">Download sample CSV</a>
          </div>

          <div className="form-group">
            <label>Master View Key</label>
            <div className="input-with-action">
              <input 
                type={showKey ? 'text' : 'password'}
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="64-character hex key (keep this secret)"
                className="input-field"
              />
              <button 
                type="button" 
                className="toggle-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <button 
              type="button" 
              onClick={handleGenerateKey}
              className="secondary-btn"
            >
              Generate Random Key
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button 
            type="submit" 
            className="primary-btn"
            disabled={!file || !masterKey || loading}
          >
            {loading ? (
              <span className="loader-container">
                <span className="spinner"></span>
                Generating ZK proofs... (~20s)
              </span>
            ) : 'Submit Payroll'}
          </button>
        </form>
      ) : (
        <div className="results-container fade-in">
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {result.payments.length} payments submitted to Stellar testnet
          </div>

          <div className="card">
            <h3 className="card-title">Submission Records</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Wallet Address</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {result.payments.map((p, i) => (
                  <tr key={i}>
                    <td>{p.employee_id}</td>
                    <td>{truncateAddress(p.wallet_address)}</td>
                    <td className="status-success">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </td>
                    <td>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${p.tx_hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-link"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="view-keys-details">
            <summary className="card-title">Employee View Keys (Distribute these)</summary>
            <div className="view-keys-list">
              {result.payments.map((p, i) => (
                <div key={i} className="key-item">
                  <div className="key-label">
                    <span>{p.employee_id}</span>
                    <span className="secondary-text">{truncateAddress(p.wallet_address)}</span>
                  </div>
                  <div className="key-value-box">
                    <code>{p.commitment.slice(0, 16)}...</code>
                    <button className="copy-btn" onClick={() => navigator.clipboard.writeText(p.commitment)}>Copy Key</button>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <button onClick={() => setResult(null)} className="secondary-btn" style={{ marginTop: '24px' }}>Submit Another Payroll</button>
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
          margin-bottom: 24px;
        }
        .card-title {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #F1F5F9;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
        }
        .upload-area {
          border: 2px dashed #1E2028;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .upload-area:hover {
          border-color: #7C6AF7;
        }
        .upload-area.has-file {
          border-style: solid;
          border-color: #22C55E;
          background: rgba(34, 197, 94, 0.05);
        }
        .upload-placeholder p {
          margin: 12px 0 0 0;
          color: #64748B;
          font-size: 14px;
        }
        .file-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #F1F5F9;
          font-size: 15px;
        }
        .input-with-action {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .input-field {
          flex: 1;
          background: #0A0B0D;
          border: 1px solid #1E2028;
          border-radius: 8px;
          padding: 12px 16px;
          color: #F1F5F9;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        .input-field:focus {
          outline: none;
          border-color: #7C6AF7;
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
          transition: color 0.2s ease;
        }
        .toggle-btn:hover {
          color: #F1F5F9;
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
          transition: background 0.2s ease;
        }
        .primary-btn:hover:not(:disabled) {
          background: #6D59E6;
        }
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .secondary-btn {
          background: none;
          border: 1px solid #1E2028;
          color: #F1F5F9;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .secondary-btn:hover {
          border-color: #64748B;
        }
        .text-link {
          display: inline-block;
          margin-top: 8px;
          color: #7C6AF7;
          font-size: 13px;
          text-decoration: none;
        }
        .text-link:hover {
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
        .success-banner {
          background: rgba(34, 197, 94, 0.1);
          color: #22C55E;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 15px;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table th {
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid #1E2028;
          color: #64748B;
          font-weight: 500;
        }
        .data-table td {
          padding: 16px;
          border-bottom: 1px solid #1E2028;
          color: #F1F5F9;
        }
        .status-success {
          color: #22C55E;
        }
        .view-keys-details {
          margin-top: 24px;
          background: #111318;
          border: 1px solid #1E2028;
          border-radius: 12px;
        }
        .view-keys-details summary {
          padding: 24px;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .view-keys-details summary::-webkit-details-marker {
          display: none;
        }
        .view-keys-list {
          padding: 0 24px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #0A0B0D;
          border-radius: 8px;
        }
        .key-label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .secondary-text {
          font-size: 12px;
          color: #64748B;
        }
        .key-value-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .key-value-box code {
          background: #1E2028;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          color: #7C6AF7;
        }
        .copy-btn {
          background: none;
          border: none;
          color: #7C6AF7;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .copy-btn:hover {
          text-decoration: underline;
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

export default EmployerView;
