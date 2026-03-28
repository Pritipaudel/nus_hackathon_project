import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';
import type { WorkerDashboardSection, WorkerPatient } from '@shared/types';
import {
  MOCK_MEETINGS,
  MOCK_WORKERS,
  MOCK_WORKER_PATIENTS,
  PATIENT_CATEGORY_COLOR,
  PATIENT_MOOD_COLOR,
  PATIENT_MOOD_LABEL,
  WORKER_AVATARS,
  WORKER_OVERVIEW_STATS,
  WORKER_PHOTOS,
  WORKER_SPECIALTIES,
} from '@shared/constants';
import CommunityPage from '@features/community/pages/CommunityPage';

const NAV: { id: WorkerDashboardSection; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

const PatientAvatar = ({ p, size = 40 }: { p: WorkerPatient; size?: number }) => (
  <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
    <img
      src={p.photo}
      alt={p.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.14)', display: 'block' }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('style');
      }}
    />
    <div style={{
      display: 'none', width: size, height: size, borderRadius: '50%', position: 'absolute', top: 0, left: 0,
      background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff',
      fontSize: size * 0.3, fontWeight: 700, alignItems: 'center', justifyContent: 'center',
    }}>{p.initials}</div>
  </div>
);

const MoodBar = ({ score, day }: { score: number; day: string }) => (
  <div className="pt-mood-col">
    <span className="pt-mood-col__score">{score}</span>
    <div className="pt-mood-col__track">
      <div className="pt-mood-col__fill" style={{ height: `${(score / 5) * 100}%`, background: PATIENT_MOOD_COLOR[score] ?? '#22c55e' }} />
    </div>
    <span className="pt-mood-col__day">{day}</span>
  </div>
);

const WeeklyBar = ({ week, pct }: { week: string; pct: number }) => (
  <div className="pt-weekly-col">
    <span className="pt-weekly-col__pct">{pct}%</span>
    <div className="pt-weekly-col__track">
      <div className="pt-weekly-col__fill" style={{ height: `${pct}%` }} />
    </div>
    <span className="pt-weekly-col__label">{week}</span>
  </div>
);

const PatientDetail = ({ p, onBack }: { p: WorkerPatient; onBack: () => void }) => (
  <div className="pt-detail">
    <button type="button" className="wd-back-btn" onClick={onBack}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back to patients
    </button>

    <div className="pt-hero">
      <PatientAvatar p={p} size={72} />
      <div className="pt-hero__info">
        <div className="pt-hero__top">
          <h2 className="pt-hero__name">{p.name}</h2>
          <span className={`wd-badge ${p.status === 'active' ? 'wd-badge--active' : 'wd-badge--inactive'}`}>
            {p.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="pt-hero__prog">{p.program}</p>
        <p className="pt-hero__meta">Joined {p.joined} · Last active {p.lastActive}</p>
      </div>
      <div className="pt-hero__stats">
        {([
          { label: 'Sessions',     value: p.sessions },
          { label: 'Modules done', value: `${p.modulesCompleted}/${p.totalModules}` },
          { label: 'Day streak',   value: p.streak },
        ] as { label: string; value: string | number }[]).map((s) => (
          <div key={s.label} className="pt-hero__stat">
            <p className="pt-hero__stat-val">{s.value}</p>
            <p className="pt-hero__stat-label">{s.label}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="pt-grid">
      <div className="pt-card pt-card--progress">
        <p className="pt-card__title">Programme progress</p>
        <div className="pt-progress-ring-wrap">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f0fdf4" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - p.progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="50" textAnchor="middle" dy="0.35em" fontSize="18" fontWeight="700" fill="#16a34a">{p.progress}%</text>
          </svg>
        </div>
        <div className="pt-modules-bar">
          <div className="pt-modules-bar__fill" style={{ width: `${(p.modulesCompleted / p.totalModules) * 100}%` }} />
        </div>
        <p className="pt-card__sub">{p.modulesCompleted} of {p.totalModules} modules completed</p>
      </div>

      <div className="pt-card pt-card--mood">
        <p className="pt-card__title">Mood this week</p>
        <div className="pt-mood-chart">
          {p.mood.map((m) => <MoodBar key={m.day} score={m.score} day={m.day} />)}
        </div>
        <div className="pt-mood-legend">
          {([5, 4, 3, 2, 1] as const).map((n) => (
            <span key={n} className="pt-mood-legend__item">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PATIENT_MOOD_COLOR[n], display: 'inline-block' }} />
              {PATIENT_MOOD_LABEL[n]}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-card pt-card--weekly">
        <p className="pt-card__title">Weekly progress</p>
        <div className="pt-weekly-chart">
          {p.weeklyProgress.map((w) => <WeeklyBar key={w.week} week={w.week} pct={w.pct} />)}
        </div>
      </div>
    </div>

    <div className="pt-row">
      <div className="pt-card pt-card--posts">
        <p className="pt-card__title">Community posts</p>
        {p.posts.length === 0 && <p className="wd-empty">No community posts yet.</p>}
        {p.posts.map((post, i) => {
          const [bg, fg] = (PATIENT_CATEGORY_COLOR[post.category] ?? '#f3f4f6|#374151').split('|');
          return (
            <div key={i} className="pt-post">
              <div className="pt-post__meta">
                <span className="pt-cat-chip" style={{ background: bg, color: fg }}>
                  {post.category.charAt(0) + post.category.slice(1).toLowerCase()}
                </span>
                <span className="pt-post__time">{post.time}</span>
              </div>
              <p className="pt-post__text">{post.text}</p>
              <div className="pt-post__footer">
                <span className="pt-post__stat">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {post.likes}
                </span>
                <span className="pt-post__stat">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {post.comments}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-card pt-card--notes">
        <p className="pt-card__title">Session notes</p>
        {p.notes.map((n, i) => (
          <div key={i} className="pt-note">
            <p className="pt-note__date">{n.date}</p>
            <p className="pt-note__text">{n.note}</p>
          </div>
        ))}
        <button type="button" className="pt-add-note-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add note
        </button>
      </div>
    </div>
  </div>
);

const OverviewSection = () => {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Good morning, {user?.first_name}</h1>
        <p className="wd-section__subtitle">{today}</p>
      </div>

      <div className="wd-stats-grid">
        {WORKER_OVERVIEW_STATS.map((s) => (
          <div key={s.label} className={`wd-stat-card ${s.color}`}>
            <p className="wd-stat-card__value">{s.value}</p>
            <p className="wd-stat-card__label">{s.label}</p>
            <p className="wd-stat-card__sub">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="wd-row">
        <div className="wd-panel wd-panel--flex2">
          <h3 className="wd-panel__title">Upcoming sessions</h3>
          {MOCK_MEETINGS.length === 0 && <p className="wd-empty">No upcoming sessions</p>}
          {MOCK_MEETINGS.map((m) => {
            const photo = WORKER_PHOTOS[m.worker_id ?? ''];
            const avatar = WORKER_AVATARS[m.worker_id ?? ''];
            return (
              <div key={m.id} className="wd-session-row">
                <div className="wd-session-row__avatar-wrap">
                  {photo ? (
                    <img src={photo} alt={m.worker_name} className="wd-session-row__photo" />
                  ) : (
                    <div className="wd-session-row__avatar">{avatar ?? 'HW'}</div>
                  )}
                </div>
                <div className="wd-session-row__info">
                  <p className="wd-session-row__name">{m.worker_name}</p>
                  <p className="wd-session-row__time">{formatDate(m.scheduled_at)}</p>
                </div>
                <span className="wd-badge wd-badge--scheduled">{m.status}</span>
              </div>
            );
          })}
        </div>

        <div className="wd-panel wd-panel--flex1">
          <h3 className="wd-panel__title">Patient progress</h3>
          {MOCK_WORKER_PATIENTS.slice(0, 4).map((p) => (
            <div key={p.id} className="wd-progress-row">
              <div className="wd-progress-row__avatar-wrap">
                <img
                  src={p.photo}
                  alt={p.name}
                  className="wd-progress-row__photo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('style');
                  }}
                />
                <div className="wd-progress-row__initials" style={{ display: 'none' }}>{p.initials}</div>
              </div>
              <div className="wd-progress-row__meta">
                <p className="wd-progress-row__name">{p.name}</p>
                <p className="wd-progress-row__program">{p.program}</p>
              </div>
              <div className="wd-progress-bar-wrap">
                <div className="wd-progress-bar">
                  <div className="wd-progress-bar__fill" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="wd-progress-row__pct">{p.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wd-panel">
        <h3 className="wd-panel__title">Your colleagues</h3>
        <div className="wd-colleagues-grid">
          {MOCK_WORKERS.slice(0, 4).map((w) => {
            const photo = WORKER_PHOTOS[w.id];
            const avatar = WORKER_AVATARS[w.id];
            const specs = WORKER_SPECIALTIES[w.id] ?? [];
            return (
              <div key={w.id} className="wd-colleague-card">
                <div className="wd-colleague-card__avatar-wrap">
                  {photo ? (
                    <img src={photo} alt={w.username} className="wd-colleague-card__photo" />
                  ) : (
                    <div className="wd-colleague-card__avatar">{avatar}</div>
                  )}
                </div>
                <p className="wd-colleague-card__name">{w.username}</p>
                <p className="wd-colleague-card__org">{w.organization}</p>
                <div className="wd-colleague-card__tags">
                  {specs.slice(0, 2).map((sp) => (
                    <span key={sp} className="wd-tag">{sp}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PatientsSection = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WorkerPatient | null>(null);

  const filtered = MOCK_WORKER_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.program.toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    return (
      <div className="wd-section wd-section--wide">
        <PatientDetail p={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Patients</h1>
        <p className="wd-section__subtitle">Monitor patient progress and programme engagement</p>
      </div>

      <div className="wd-panel">
        <div className="wd-search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="wd-search-bar__input"
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="wd-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Programme</th>
              <th>Progress</th>
              <th>Last active</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="wd-table__row--clickable" onClick={() => setSelected(p)}>
                <td>
                  <div className="wd-table__patient">
                    <PatientAvatar p={p} size={36} />
                    <div>
                      <p className="wd-table__name">{p.name}</p>
                      <p className="wd-table__sub">{p.sessions} sessions · {p.streak}d streak</p>
                    </div>
                  </div>
                </td>
                <td className="wd-table__program">{p.program}</td>
                <td>
                  <div className="wd-table-progress">
                    <div className="wd-progress-bar wd-progress-bar--sm">
                      <div className="wd-progress-bar__fill" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="wd-progress-row__pct">{p.progress}%</span>
                  </div>
                </td>
                <td className="wd-table__muted">{p.lastActive}</td>
                <td>
                  <span className={`wd-badge ${p.status === 'active' ? 'wd-badge--active' : 'wd-badge--inactive'}`}>
                    {p.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="wd-table__empty">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MeetingsSection = () => (
  <div className="wd-section">
    <div className="wd-section__header">
      <h1 className="wd-section__title">Meetings</h1>
      <p className="wd-section__subtitle">Scheduled and past sessions</p>
    </div>

    <div className="wd-panel">
      <h3 className="wd-panel__title">Upcoming</h3>
      {MOCK_MEETINGS.map((m) => {
        const photo = WORKER_PHOTOS[m.worker_id ?? ''];
        const avatar = WORKER_AVATARS[m.worker_id ?? ''];
        return (
          <div key={m.id} className="wd-session-row wd-session-row--card">
            <div className="wd-session-row__avatar-wrap">
              {photo ? (
                <img src={photo} alt={m.worker_name} className="wd-session-row__photo" />
              ) : (
                <div className="wd-session-row__avatar">{avatar ?? 'HW'}</div>
              )}
            </div>
            <div className="wd-session-row__info">
              <p className="wd-session-row__name">{m.worker_name}</p>
              <p className="wd-session-row__time">{formatDate(m.scheduled_at)}</p>
            </div>
            <div className="wd-session-row__actions">
              <button type="button" className="btn btn-primary btn-sm">Join session</button>
              <button type="button" className="btn btn-outline btn-sm">Reschedule</button>
            </div>
          </div>
        );
      })}
    </div>

    <div className="wd-panel">
      <h3 className="wd-panel__title">Past sessions</h3>
      <p className="wd-empty">No past sessions to display.</p>
    </div>
  </div>
);

const WorkerDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [section, setSection] = useState<WorkerDashboardSection>('overview');

  const handleLogout = () => {
    clearAuth();
    window.location.replace('/login');
  };

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : 'HW';

  return (
    <div className="wd-shell">
      <aside className="wd-sidebar">
        <div className="wd-sidebar__brand">
          <div className="wd-sidebar__logo">N</div>
          <div>
            <p className="wd-sidebar__brand-name">NUS MindCare</p>
            <p className="wd-sidebar__brand-role">Health Worker Portal</p>
          </div>
        </div>

        <nav className="wd-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`wd-nav__item ${section === item.id ? 'wd-nav__item--active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span className="wd-nav__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="wd-sidebar__footer">
          <div className="wd-user-pill">
            <div className="wd-user-pill__avatar">{initials}</div>
            <div className="wd-user-pill__info">
              <p className="wd-user-pill__name">{user?.first_name} {user?.last_name}</p>
              <p className="wd-user-pill__role">Health Worker</p>
            </div>
          </div>
          <button type="button" className="wd-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <main className="wd-main">
        {section === 'overview'  && <OverviewSection />}
        {section === 'patients'  && <PatientsSection />}
        {section === 'meetings'  && <MeetingsSection />}
        {section === 'community' && (
          <div className="wd-section wd-section--wide">
            <div className="wd-section__header">
              <h1 className="wd-section__title">Community</h1>
              <p className="wd-section__subtitle">Same feed your patients see — post, like and comment alongside them</p>
            </div>
            <CommunityPage />
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerDashboardPage;
