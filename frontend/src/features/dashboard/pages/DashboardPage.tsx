import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';
import { useMe } from '@features/auth/hooks/useMe';
import { useMyDashboard } from '@features/dashboard/hooks/useDashboard';
import IcbtPage from '@features/icbt/pages/IcbtPage';
import CommunityPage from '@features/community/pages/CommunityPage';
import HealthWorkersPage from '@features/workers/pages/HealthWorkersPage';
import TrainingPage from '@features/training/pages/TrainingPage';
import CommunityHubPage from '@features/communityHub/pages/CommunityHubPage';

type Section = 'home' | 'programs' | 'community' | 'community-hub' | 'workers' | 'training';

/** Home (stats overview) is not in the nav — only opened via the profile block. */
const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'community', label: 'Community Feed' },
  { id: 'community-hub', label: 'My Community' },
  { id: 'programs', label: 'iCBT Programmes' },
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

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const StatIcon = ({ type }: { type: 'progress' | 'programs' | 'meetings' | 'certs' }) => {
  if (type === 'progress')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    );
  if (type === 'programs')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  if (type === 'meetings')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
};

const DashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  /** Default: Community Feed after load/refresh. Profile → Home overview. */
  const [section, setSection] = useState<Section>('community');

  useMe();

  const { data: dash, isLoading } = useMyDashboard();

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
          <button
            type="button"
            className="ds-sidebar__user ds-sidebar__user--nav-home"
            onClick={() => setSection('home')}
            aria-label="Open Home — your overview and stats"
          >
            <div className="ds-sidebar__avatar">{initials}</div>
            <div className="ds-sidebar__userinfo">
              <span className="ds-sidebar__username">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="ds-sidebar__email">{user?.email}</span>
            </div>
          </button>
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

            {isLoading ? (
              <div className="dh-loading">
                <div className="spinner" />
              </div>
            ) : (
              <>
                <div className="dh-stats">
                  <div className="dh-stat dh-stat--green">
                    <div className="dh-stat__icon"><StatIcon type="progress" /></div>
                    <div>
                      <p className="dh-stat__label">Overall progress</p>
                      <p className="dh-stat__value">{dash?.overall_progress ?? 0}%</p>
                    </div>
                  </div>
                  <div className="dh-stat dh-stat--blue">
                    <div className="dh-stat__icon"><StatIcon type="programs" /></div>
                    <div>
                      <p className="dh-stat__label">Programmes enrolled</p>
                      <p className="dh-stat__value">{dash?.programmes_enrolled ?? 0}</p>
                    </div>
                  </div>
                  <div className="dh-stat dh-stat--amber">
                    <div className="dh-stat__icon"><StatIcon type="meetings" /></div>
                    <div>
                      <p className="dh-stat__label">Upcoming meetings</p>
                      <p className="dh-stat__value">{dash?.upcoming_meetings_count ?? 0}</p>
                    </div>
                  </div>
                  <div className="dh-stat dh-stat--purple">
                    <div className="dh-stat__icon"><StatIcon type="certs" /></div>
                    <div>
                      <p className="dh-stat__label">Certifications</p>
                      <p className="dh-stat__value">{dash?.certifications_count ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="dh-row">
                  <div className="dh-panel dh-panel--flex2">
                    <div className="dh-panel__head">
                      <span className="dh-panel__title">Active programmes</span>
                      <button type="button" className="dh-panel__link" onClick={() => setSection('programs')}>View all</button>
                    </div>
                    <div className="dh-prog-list">
                      {dash?.active_programmes.length === 0 && dash?.completed_programmes.length === 0 && (
                        <p className="dh-empty">No programmes yet. <button type="button" className="dh-panel__link" onClick={() => setSection('programs')}>Browse programmes</button></p>
                      )}
                      {dash?.active_programmes.map((p) => (
                        <div key={p.program_id} className="dh-prog-item">
                          <div className="dh-prog-item__info">
                            <p className="dh-prog-item__name">{p.title}</p>
                            <p className="dh-prog-item__meta">
                              {p.duration_days ? `${p.duration_days} days` : ''}{p.difficulty_level ? ` · ${p.difficulty_level}` : ''}
                            </p>
                          </div>
                          <div className="dh-prog-item__right">
                            <span className="dh-prog-item__pct">{p.progress_percent}%</span>
                            <div className="dh-prog-bar">
                              <div className="dh-prog-bar__fill dh-prog-bar__fill--green" style={{ width: `${p.progress_percent}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {dash?.completed_programmes.map((p) => (
                        <div key={p.program_id} className="dh-prog-item">
                          <div className="dh-prog-item__info">
                            <p className="dh-prog-item__name">{p.title}</p>
                            <p className="dh-prog-item__meta">Completed{p.difficulty_level ? ` · ${p.difficulty_level}` : ''}</p>
                          </div>
                          <div className="dh-prog-item__right">
                            <span className="dh-prog-item__pct dh-prog-item__pct--done">Done</span>
                            <div className="dh-prog-bar">
                              <div className="dh-prog-bar__fill dh-prog-bar__fill--green" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {dash && dash.active_programmes.length === 0 && (
                        <div className="dh-prog-item dh-prog-item--recommended">
                          <div className="dh-prog-item__info">
                            <p className="dh-prog-item__name">Managing Low Mood</p>
                            <p className="dh-prog-item__meta">Recommended · Beginner · 30 days</p>
                          </div>
                          <div className="dh-prog-item__right">
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setSection('programs')}>Start</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dh-panel dh-panel--flex1">
                    <div className="dh-panel__head">
                      <span className="dh-panel__title">Progress overview</span>
                    </div>
                    <div className="dh-prog-overview">
                      <div className="dh-prog-ring">
                        <svg viewBox="0 0 80 80" width="80" height="80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                          <circle
                            cx="40" cy="40" r="32" fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 32}`}
                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - (dash?.overall_progress ?? 0) / 100)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 40 40)"
                          />
                          <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">{dash?.overall_progress ?? 0}%</text>
                        </svg>
                      </div>
                      <div className="dh-prog-overview__stats">
                        <div className="dh-prog-overview__row">
                          <span className="dh-prog-overview__dot dh-prog-overview__dot--active" />
                          <span>{dash?.programmes_enrolled ?? 0} enrolled</span>
                        </div>
                        <div className="dh-prog-overview__row">
                          <span className="dh-prog-overview__dot dh-prog-overview__dot--done" />
                          <span>{dash?.programmes_completed ?? 0} completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dh-row">
                  <div className="dh-panel dh-panel--flex1">
                    <div className="dh-panel__head">
                      <span className="dh-panel__title">Upcoming meetings</span>
                      <button type="button" className="dh-panel__link" onClick={() => setSection('workers')}>Book session</button>
                    </div>
                    {!dash?.upcoming_meetings.length ? (
                      <p className="dh-empty">No meetings scheduled.</p>
                    ) : (
                      <div className="dh-meeting-list">
                        {dash.upcoming_meetings.map((m) => {
                          const initials = m.worker_name
                            ? m.worker_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                            : 'HW';
                          return (
                            <div key={m.id} className="dh-meeting-row">
                              <div className="dh-meeting-row__avatar">{initials}</div>
                              <div className="dh-meeting-row__info">
                                <p className="dh-meeting-row__name">{m.worker_name ?? 'Health Worker'}</p>
                                <p className="dh-meeting-row__time">{formatMeetingDate(m.scheduled_at)}</p>
                              </div>
                              <span className="dh-meeting-row__badge">{m.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="dh-panel dh-panel--flex1">
                    <div className="dh-panel__head">
                      <span className="dh-panel__title">Recent activity</span>
                    </div>
                    <div className="dh-activity-list">
                      {dash?.completed_programmes.map((p) => (
                        <div key={`comp-${p.program_id}`} className="dh-activity-row">
                          <div className="dh-activity-row__dot dh-activity-row__dot--complete" />
                          <div className="dh-activity-row__body">
                            <p className="dh-activity-row__label">Completed — {p.title}</p>
                            <p className="dh-activity-row__time">{p.completed_at ? formatRelative(p.completed_at) : ''}</p>
                          </div>
                        </div>
                      ))}
                      {dash?.upcoming_meetings.map((m) => (
                        <div key={`meet-${m.id}`} className="dh-activity-row">
                          <div className="dh-activity-row__dot dh-activity-row__dot--meeting" />
                          <div className="dh-activity-row__body">
                            <p className="dh-activity-row__label">Meeting scheduled</p>
                            <p className="dh-activity-row__time">{formatMeetingDate(m.scheduled_at)}</p>
                          </div>
                        </div>
                      ))}
                      {dash?.latest_certification && (
                        <div className="dh-activity-row">
                          <div className="dh-activity-row__dot dh-activity-row__dot--cert" />
                          <div className="dh-activity-row__body">
                            <p className="dh-activity-row__label">Earned certificate — {dash.latest_certification.title}</p>
                            <p className="dh-activity-row__time">{formatRelative(dash.latest_certification.issued_at)}</p>
                          </div>
                        </div>
                      )}
                      {(!dash || (
                        dash.completed_programmes.length === 0 &&
                        dash.upcoming_meetings.length === 0 &&
                        !dash.latest_certification
                      )) && (
                        <p className="dh-empty">No recent activity yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="dh-panel dh-panel--flex1">
                    <div className="dh-panel__head">
                      <span className="dh-panel__title">Latest certificate</span>
                      <button type="button" className="dh-panel__link" onClick={() => setSection('training')}>View all</button>
                    </div>
                    {dash?.latest_certification ? (
                      <div className="dh-cert-card">
                        <div className="dh-cert-card__icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                        </div>
                        <p className="dh-cert-card__name">{dash.latest_certification.title}</p>
                        <p className="dh-cert-card__org">
                          Issued by {dash.latest_certification.organization} · {new Date(dash.latest_certification.issued_at).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}
                        </p>
                        {dash.latest_certification.verified && (
                          <span className="dh-cert-card__badge">Verified</span>
                        )}
                      </div>
                    ) : (
                      <p className="dh-empty">No certificates yet. <button type="button" className="dh-panel__link" onClick={() => setSection('training')}>Explore training</button></p>
                    )}
                  </div>
                </div>

                <div className="dh-panel">
                  <div className="dh-panel__head">
                    <span className="dh-panel__title">Quick actions</span>
                  </div>
                  <div className="dh-actions">
                    {(
                      [
                        {
                          label: 'Continue programme',
                          sub: dash?.active_programmes[0]?.title
                            ? `${dash.active_programmes[0].title} — ${dash.active_programmes[0].progress_percent}%`
                            : 'Browse iCBT programmes',
                          section: 'programs' as Section,
                        },
                        {
                          label: 'Community Feed',
                          sub: 'Posts, anonymous problems & trending support',
                          section: 'community' as Section,
                        },
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
              </>
            )}
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
