import React, { useState } from 'react';
import { decryptSalary } from '../lib/api';

function EmployeeView() {
  const [walletAddress, setWalletAddress] = useState('');
  const [viewKey, setViewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletAddress || !viewKey) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await decryptSalary(walletAddress, viewKey);
      setResult(response);
    } catch (err) {
      setError("Salary not found or view key is incorrect. Check with your employer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      {!result ? (
        <form onSubmit={handleSubmit} className="card">
          <h2 className="card-title">View Your Salary</h2>
          
          <div className="form-group">
            <label>Your Stellar Wallet Address</label>
            <input 
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="G..."
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label>Your View Key (provided by your employer)</label>
            <div className="input-with-action">
              <input 
                type={showKey ? 'text' : 'password'}
                value={viewKey}
                onChange={(e) => setViewKey(e.target.value)}
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
            disabled={!walletAddress || !viewKey || loading}
          >
            {loading ? (
              <span className="loader-container">
                <span className="spinner"></span>
                Decrypting your salary...
              </span>
            ) : 'Decrypt My Salary'}
          </button>
        </form>
      ) : (
        <div className="salary-display card fade-in">
          <p className="label">Your Salary</p>
          <h2 className="amount">{result.salary_display}</h2>
          <p className="cents">({result.salary_usdc_cents.toLocaleString()} cents)</p>
          
          <div className="verification">
            <div className="verified-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Payment verified on Stellar testnet
            </div>
            <a href="#" className="text-link">View on Explorer →</a>
          </div>

          <button onClick={() => setResult(null)} className="secondary-btn" style={{ marginTop: '32px' }}>Back</button>
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
          padding: 32px;
        }
        .card-title {
          margin: 0 0 24px 0;
          font-size: 18px;
          font-weight: 600;
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
        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .salary-display {
          text-align: center;
          padding: 48px 32px;
        }
        .salary-display .label {
          color: #64748B;
          font-size: 16px;
          margin: 0 0 16px 0;
        }
        .salary-display .amount {
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #F1F5F9;
        }
        .salary-display .cents {
          color: #64748B;
          font-size: 14px;
          margin: 0 0 32px 0;
        }
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.1);
          color: #22C55E;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        .text-link {
          display: block;
          color: #7C6AF7;
          font-size: 14px;
          text-decoration: none;
        }
        .secondary-btn {
          background: none;
          border: 1px solid #1E2028;
          color: #F1F5F9;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
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

export default EmployeeView;
