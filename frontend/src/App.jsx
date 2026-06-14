import React, { useState } from 'react';
import EmployerView from './components/EmployerView';
import EmployeeView from './components/EmployeeView';
import AuditorView from './components/AuditorView';

function App() {
  const [activeTab, setActiveTab] = useState('employer');

  const tabs = [
    { id: 'employer', label: 'Employer' },
    { id: 'employee', label: 'Employee' },
    { id: 'auditor', label: 'Auditor' },
  ];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-section">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C6AF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h1>Confidential Payroll</h1>
          <span className="badge">Testnet</span>
        </div>
      </header>

      <nav className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        <div className="fade-in" key={activeTab}>
          {activeTab === 'employer' && <EmployerView />}
          {activeTab === 'employee' && <EmployeeView />}
          {activeTab === 'auditor' && <AuditorView />}
        </div>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .header {
          width: 100%;
          padding: 24px 0;
          display: flex;
          justify-content: center;
          border-bottom: 1px solid #1E2028;
          background: #0A0B0D;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-section h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #F1F5F9;
        }
        .badge {
          background: rgba(124, 106, 247, 0.15);
          color: #7C6AF7;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tabs-nav {
          display: flex;
          gap: 32px;
          margin-top: 32px;
          border-bottom: 1px solid #1E2028;
          width: 100%;
          max-width: 720px;
          justify-content: center;
        }
        .tab-btn {
          background: none;
          border: none;
          color: #64748B;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          padding: 12px 4px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
        }
        .tab-btn:hover {
          color: #F1F5F9;
        }
        .tab-btn.active {
          color: #7C6AF7;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #7C6AF7;
        }
        .main-content {
          width: 100%;
          max-width: 720px;
          padding: 40px 20px;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
