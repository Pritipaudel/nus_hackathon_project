import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';

import { useMe } from '@features/auth/hooks/useMe';
import IcbtPage from '@features/icbt/pages/IcbtPage';
import CommunityPage from '@features/community/pages/CommunityPage';
import HealthWorkersPage from '@features/workers/pages/HealthWorkersPage';
import TrainingPage from '@features/training/pages/TrainingPage';
import CommunityHubPage from '@features/communityHub/pages/CommunityHubPage';
import { DASHBOARD_UPCOMING_MEETINGS, WORKER_PHOTOS } from '@shared/constants';

const MEETING_WORKER_PHOTO: Record<string, string | undefined> = {
  'Dr. Priya Nair': WORKER_PHOTOS['1'],
  'Ahmad Farouk': WORKER_PHOTOS['2'],
};

type Section = 'home' | 'programs' | 'community' | 'community-hub' | 'workers' | 'training';

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'programs', label: 'iCBT Programmes' },
  { id: 'community', label: 'Community Feed' },
  { id: 'community-hub', label: 'My Community' },
  { id: 'workers', label: 'Health Workers' },
  { id: 'training', label: 'Training' },
];

const formatMeetingDate = (iso: string) =>
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
            <div className="dh-header">
              <div>
                <h1 className="dh-header__title">Welcome back, {user?.first_name}</h1>
                <p className="dh-header__sub">Here is your progress overview for today.</p>
              </div>
              <div className="dh-header__date">
                {new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>

            {/* Stat cards */}
            <div className="dh-stats">
              <div className="dh-stat dh-stat--green">
                <div className="dh-stat__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <p className="dh-stat__label">Overall progress</p>
                  <p className="dh-stat__value">62%</p>
                </div>
              </div>
              <div className="dh-stat dh-stat--blue">
                <div className="dh-stat__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div>
                  <p className="dh-stat__label">Programmes enrolled</p>
                  <p className="dh-stat__value">2</p>
                </div>
              </div>
              <div className="dh-stat dh-stat--amber">
                <div className="dh-stat__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="dh-stat__label">Upcoming meetings</p>
                  <p className="dh-stat__value">{DASHBOARD_UPCOMING_MEETINGS.length}</p>
                </div>
              </div>
              <div className="dh-stat dh-stat--purple">
                <div className="dh-stat__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                </div>
                <div>
                  <p className="dh-stat__label">Certifications</p>
                  <p className="dh-stat__value">1</p>
                </div>
              </div>
            </div>

            {/* Progress + mood row */}
            <div className="dh-row">
              {/* Active programmes */}
              <div className="dh-panel dh-panel--flex2">
                <div className="dh-panel__head">
                  <span className="dh-panel__title">Active programmes</span>
                  <button type="button" className="dh-panel__link" onClick={() => setSection('programs')}>View all</button>
                </div>
                <div className="dh-prog-list">
                  <div className="dh-prog-item">
                    <div className="dh-prog-item__info">
                      <p className="dh-prog-item__name">Understanding Anxiety</p>
                      <p className="dh-prog-item__meta">Day 10 of 21 · Beginner</p>
                    </div>
                    <div className="dh-prog-item__right">
                      <span className="dh-prog-item__pct">45%</span>
                      <div className="dh-prog-bar">
                        <div className="dh-prog-bar__fill dh-prog-bar__fill--green" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="dh-prog-item">
                    <div className="dh-prog-item__info">
                      <p className="dh-prog-item__name">Sleep &amp; Recovery</p>
                      <p className="dh-prog-item__meta">Completed · Intermediate</p>
                    </div>
                    <div className="dh-prog-item__right">
                      <span className="dh-prog-item__pct dh-prog-item__pct--done">Done</span>
                      <div className="dh-prog-bar">
                        <div className="dh-prog-bar__fill dh-prog-bar__fill--green" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="dh-prog-item dh-prog-item--recommended">
                    <div className="dh-prog-item__info">
                      <p className="dh-prog-item__name">Managing Low Mood</p>
                      <p className="dh-prog-item__meta">Recommended · Beginner · 30 days</p>
                    </div>
                    <div className="dh-prog-item__right">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setSection('programs')}>Start</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mood tracker */}
              <div className="dh-panel dh-panel--flex1">
                <div className="dh-panel__head">
                  <span className="dh-panel__title">Mood this week</span>
                </div>
                <div className="dh-mood-chart">
                  {[
                    { day: 'Mon', mood: 3, label: 'Okay' },
                    { day: 'Tue', mood: 4, label: 'Good' },
                    { day: 'Wed', mood: 2, label: 'Low' },
                    { day: 'Thu', mood: 4, label: 'Good' },
                    { day: 'Fri', mood: 5, label: 'Great' },
                    { day: 'Sat', mood: 3, label: 'Okay' },
                    { day: 'Sun', mood: 4, label: 'Good' },
                  ].map(({ day, mood, label }) => {
                    const colorClass = mood >= 4 ? 'high' : mood === 3 ? 'mid' : 'low';
                    const heightPct = (mood / 5) * 100;
                    return (
                      <div key={day} className="dh-mood-bar-col">
                        <span className="dh-mood-bar-col__pct">{label}</span>
                        <div className="dh-mood-bar-col__track">
                          <div
                            className={`dh-mood-bar-col__fill dh-mood-bar-col__fill--${colorClass}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="dh-mood-bar-col__day">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="dh-mood-legend">
                  <span className="dh-mood-legend__item dh-mood-legend__item--high">Great / Good</span>
                  <span className="dh-mood-legend__item dh-mood-legend__item--mid">Okay</span>
                  <span className="dh-mood-legend__item dh-mood-legend__item--low">Low</span>
                </div>
              </div>
            </div>

            {/* Meetings + activity row */}
            <div className="dh-row">
              {/* Upcoming meetings */}
              <div className="dh-panel dh-panel--flex1">
                <div className="dh-panel__head">
                  <span className="dh-panel__title">Upcoming meetings</span>
                  <button type="button" className="dh-panel__link" onClick={() => setSection('workers')}>Book session</button>
                </div>
                {DASHBOARD_UPCOMING_MEETINGS.length === 0 ? (
                  <p className="dh-empty">No meetings scheduled.</p>
                ) : (
                  <div className="dh-meeting-list">
                    {DASHBOARD_UPCOMING_MEETINGS.map((m) => {
                      const photo = MEETING_WORKER_PHOTO[m.worker];
                      return (
                        <div key={m.id} className="dh-meeting-row">
                          {photo ? (
                            <img src={photo} alt={m.worker} className="dh-meeting-row__avatar dh-meeting-row__avatar--photo" />
                          ) : (
                            <div className="dh-meeting-row__avatar">
                              {m.worker.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div className="dh-meeting-row__info">
                            <p className="dh-meeting-row__name">{m.worker}</p>
                            <p className="dh-meeting-row__time">{formatMeetingDate(m.scheduled_at)}</p>
                          </div>
                          <span className="dh-meeting-row__badge">{m.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="dh-panel dh-panel--flex1">
                <div className="dh-panel__head">
                  <span className="dh-panel__title">Recent activity</span>
                </div>
                <div className="dh-activity-list">
                  {[
                    { label: 'Completed module 5 — Anxiety programme', time: '2h ago', type: 'complete' },
                    { label: 'Posted in community — Anxiety', time: '5h ago', type: 'post' },
                    { label: 'Booked session with Dr. Priya Nair', time: '1d ago', type: 'meeting' },
                    { label: 'Earned certificate — Mental Health Awareness', time: '3d ago', type: 'cert' },
                  ].map((a, i) => (
                    <div key={i} className="dh-activity-row">
                      <div className={`dh-activity-row__dot dh-activity-row__dot--${a.type}`} />
                      <div className="dh-activity-row__body">
                        <p className="dh-activity-row__label">{a.label}</p>
                        <p className="dh-activity-row__time">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training certification */}
              <div className="dh-panel dh-panel--flex1">
                <div className="dh-panel__head">
                  <span className="dh-panel__title">Latest certificate</span>
                  <button type="button" className="dh-panel__link" onClick={() => setSection('training')}>View all</button>
                </div>
                <div className="dh-cert-card">
                  <div className="dh-cert-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <p className="dh-cert-card__name">Mental Health Awareness</p>
                  <p className="dh-cert-card__org">Issued by WHO · Nov 2025</p>
                  <span className="dh-cert-card__badge">Verified</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="dh-panel">
              <div className="dh-panel__head">
                <span className="dh-panel__title">Quick actions</span>
              </div>
              <div className="dh-actions">
                {(
                  [
                    { label: 'Continue programme', sub: 'Understanding Anxiety — Day 10', section: 'programs' as Section },
                    { label: 'My Community', sub: 'Chat, recommended programmes & engagement', section: 'community-hub' as Section },
                    { label: 'Find a health worker', sub: 'Book a session with a counsellor', section: 'workers' as Section },
                    { label: 'Explore training', sub: 'Earn a new certification', section: 'training' as Section },
                  ] as { label: string; sub: string; section: Section }[]
                ).map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className="dh-action-card"
                    onClick={() => setSection(a.section)}
                  >
                    <p className="dh-action-card__label">{a.label}</p>
                    <p className="dh-action-card__sub">{a.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'programs' && <IcbtPage />}

        {section === 'community' && <CommunityPage />}

        {section === 'community-hub' && <CommunityHubPage />}

        {section === 'workers' && <HealthWorkersPage />}

        {section === 'training' && <TrainingPage />}
      </main>
    </div>
  );
};

export default DashboardPage;
