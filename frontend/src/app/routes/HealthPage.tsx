import { useEffect, useState } from 'react';

import { healthApi } from '@shared/api';
import type { HealthStatus } from '@shared/types';

export const HealthPage = () => {
  const [status, setStatus] = useState<HealthStatus>('loading');
  const [checkedAt, setCheckedAt] = useState<string>('');

  useEffect(() => {
    healthApi
      .check()
      .then(() => {
        setStatus('ok');
        setCheckedAt(new Date().toLocaleTimeString());
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar__inner">
          <div className="navbar__brand">
            <div className="navbar__logo-icon">N</div>
            <span className="navbar__name">NUS Hackathon</span>
            <span className="navbar__badge">2026</span>
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="page-inner">
          <section className="hero">
            <div className="hero__eyebrow">
              <span className="hero__dot" />
              System Status
            </div>
            <h1 className="hero__title">
              Welcome to <span>NUS Hackathon</span>
            </h1>
            <p className="hero__subtitle">
              Real-time health monitoring for the application backend. All systems are
              checked automatically on load.
            </p>
          </section>

          <div className="status-card">
            <div className="status-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="status-card__body">
              <p className="status-card__label">Backend API</p>
              <p className={`status-card__value status-card__value--${status === 'loading' ? '' : status}`}>
                {status === 'loading' && 'Checking...'}
                {status === 'ok' && 'Healthy'}
                {status === 'error' && 'Unreachable'}
              </p>
            </div>
            <div className={`status-card__indicator${status === 'error' ? ' status-card__indicator--error' : ''}`}>
              <span className={`indicator-dot${status === 'ok' ? ' indicator-dot--live' : ''}`} />
              {status === 'loading' && 'Connecting'}
              {status === 'ok' && 'Live'}
              {status === 'error' && 'Down'}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-tile">
              <p className="info-tile__label">Environment</p>
              <p className="info-tile__value info-tile__value--green">Development</p>
            </div>
            <div className="info-tile">
              <p className="info-tile__label">API Base URL</p>
              <p className="info-tile__value">localhost:8000</p>
            </div>
            <div className="info-tile">
              <p className="info-tile__label">Last Checked</p>
              <p className="info-tile__value">{checkedAt || '—'}</p>
            </div>
            <div className="info-tile">
              <p className="info-tile__label">Endpoint</p>
              <p className="info-tile__value">/health</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        NUS Hackathon 2026 — Built with React + FastAPI
      </footer>
    </div>
  );
};
