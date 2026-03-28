import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';

import { useMe } from '@features/auth/hooks/useMe';
import IcbtPage from '@features/icbt/pages/IcbtPage';
import CommunityPage from '@features/community/pages/CommunityPage';

type Section = 'home' | 'programs' | 'community' | 'workers' | 'meetings';

const MOCK_PROGRAMS = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'A structured iCBT programme to identify anxiety triggers and build coping strategies using cognitive restructuring techniques.',
    difficulty_level: 'Beginner',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/anxiety',
  },
  {
    id: '2',
    title: 'Managing Low Mood',
    description: 'Evidence-based modules targeting negative thought patterns associated with depression and persistent low mood.',
    difficulty_level: 'Beginner',
    duration_days: 30,
    url: 'https://mindbridge.app/programs/low-mood',
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    description: 'Cognitive and behavioural techniques specifically designed to address sleep disturbances and restore healthy sleep patterns.',
    difficulty_level: 'Intermediate',
    duration_days: 14,
    url: 'https://mindbridge.app/programs/sleep',
  },
  {
    id: '4',
    title: 'Stress & Burnout Reset',
    description: 'A focused programme on identifying workplace and personal stressors, setting boundaries, and building resilience.',
    difficulty_level: 'Intermediate',
    duration_days: 28,
    url: 'https://mindbridge.app/programs/burnout',
  },
];

const MOCK_POSTS = [
  {
    id: '1',
    username: 'anonymous_841',
    content: 'Started the anxiety programme last week. The thought records are harder than I expected but I can already see patterns I never noticed before.',
    category: 'ANXIETY',
    is_verified: false,
    created_at: '2026-03-27T09:14:00Z',
  },
  {
    id: '2',
    username: 'anonymous_293',
    content: 'Family pressure around career choices is making everything heavier. Good to see others here navigate the same cultural expectations.',
    category: 'STRESS',
    is_verified: false,
    created_at: '2026-03-27T11:40:00Z',
  },
  {
    id: '3',
    username: 'worker_12',
    content: 'Reminder that sleep hygiene is foundational. Before anything else, protect your rest. The programmes build on it.',
    category: 'SLEEP',
    is_verified: true,
    created_at: '2026-03-26T18:22:00Z',
  },
];

const MOCK_WORKERS = [
  { id: '1', username: 'Dr. Priya Nair', organization: 'IMH Singapore', is_verified: true },
  { id: '2', username: 'Ahmad Farouk', organization: 'SAMH', is_verified: true },
  { id: '3', username: 'Chen Wei', organization: 'Fei Yue Community Services', is_verified: true },
];

const MOCK_MEETINGS = [
  { id: '1', worker: 'Dr. Priya Nair', scheduled_at: '2026-03-30T10:00:00Z', status: 'SCHEDULED' },
  { id: '2', worker: 'Ahmad Farouk', scheduled_at: '2026-04-02T14:00:00Z', status: 'SCHEDULED' },
];

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'programs', label: 'iCBT Programmes' },
  { id: 'community', label: 'Community' },
  { id: 'workers', label: 'Health Workers' },
  { id: 'meetings', label: 'Meetings' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const DashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  const [section, setSection] = useState<Section>('home');

  useMe();

  const handleSignOut = () => {
    clearAuth();
    window.location.replace('/login');
  };

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : '?';

  const joinedDate = user
    ? new Date(user.created_at).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="ds-shell">
      <aside className="ds-sidebar">
        <div className="ds-sidebar__brand">
          <div className="ds-sidebar__logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span>MindBridge</span>
        </div>

        <nav className="ds-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ds-nav__item ${section === item.id ? 'ds-nav__item--active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ds-sidebar__footer">
          <div className="ds-sidebar__user">
            <div className="ds-sidebar__avatar">{initials}</div>
            <div className="ds-sidebar__userinfo">
              <span className="ds-sidebar__username">{user?.first_name} {user?.last_name}</span>
              <span className="ds-sidebar__email">{user?.email}</span>
            </div>
          </div>
          <button type="button" className="ds-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="ds-main">
        {section === 'home' && (
          <div className="ds-section">
            <div className="ds-page-header">
              <h1>Welcome back, {user?.first_name}</h1>
              <p>Here is your overview for today.</p>
            </div>

            <div className="ds-stat-grid">
              <div className="ds-stat">
                <p className="ds-stat__label">Account</p>
                <p className="ds-stat__value ds-stat__value--green">Active</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat__label">Member since</p>
                <p className="ds-stat__value">{joinedDate}</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat__label">Programmes enrolled</p>
                <p className="ds-stat__value">0</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat__label">Upcoming meetings</p>
                <p className="ds-stat__value">{MOCK_MEETINGS.length}</p>
              </div>
            </div>

            <div className="ds-row">
              <div className="ds-panel ds-panel--flex1">
                <h3 className="ds-panel__title">Recommended for you</h3>
                <div className="ds-program-list">
                  {MOCK_PROGRAMS.slice(0, 2).map((p) => (
                    <div key={p.id} className="ds-program-row">
                      <div className="ds-program-row__info">
                        <span className="ds-program-row__title">{p.title}</span>
                        <span className="ds-program-row__meta">{p.duration_days} days · {p.difficulty_level}</span>
                      </div>
                      <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ds-panel ds-panel--flex1">
                <h3 className="ds-panel__title">Upcoming meetings</h3>
                {MOCK_MEETINGS.length === 0 ? (
                  <p className="ds-empty">No meetings scheduled.</p>
                ) : (
                  <div className="ds-meeting-list">
                    {MOCK_MEETINGS.map((m) => (
                      <div key={m.id} className="ds-meeting-row">
                        <div>
                          <p className="ds-meeting-row__worker">{m.worker}</p>
                          <p className="ds-meeting-row__time">{formatDate(m.scheduled_at)}</p>
                        </div>
                        <span className="ds-badge ds-badge--green">{m.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {section === 'programs' && <IcbtPage />}

        {section === 'community' && <CommunityPage />}

        {section === 'workers' && (
          <div className="ds-section">
            <div className="ds-page-header">
              <h1>Health Workers</h1>
              <p>Connect with trained and verified community health workers.</p>
            </div>
            <div className="ds-worker-grid">
              {MOCK_WORKERS.map((w) => (
                <div key={w.id} className="ds-worker-card">
                  <div className="ds-worker-card__avatar">{w.username.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                  <div className="ds-worker-card__info">
                    <p className="ds-worker-card__name">{w.username}</p>
                    <p className="ds-worker-card__org">{w.organization}</p>
                    {w.is_verified && <span className="ds-badge ds-badge--green">Verified</span>}
                  </div>
                  <button type="button" className="btn btn-primary btn-sm ds-worker-card__cta">
                    Book session
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'meetings' && (
          <div className="ds-section">
            <div className="ds-page-header">
              <h1>Meetings</h1>
              <p>Your scheduled sessions with health workers.</p>
            </div>
            <div className="ds-meeting-table">
              {MOCK_MEETINGS.length === 0 ? (
                <p className="ds-empty">No meetings yet. Book a session from the Health Workers tab.</p>
              ) : (
                MOCK_MEETINGS.map((m) => (
                  <div key={m.id} className="ds-meeting-card">
                    <div className="ds-meeting-card__info">
                      <p className="ds-meeting-card__worker">{m.worker}</p>
                      <p className="ds-meeting-card__time">{formatDate(m.scheduled_at)}</p>
                    </div>
                    <div className="ds-meeting-card__right">
                      <span className="ds-badge ds-badge--green">{m.status}</span>
                      <button type="button" className="btn btn-secondary btn-sm">Join</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
