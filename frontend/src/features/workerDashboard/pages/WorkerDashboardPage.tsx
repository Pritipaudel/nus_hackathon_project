import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';
import type { CommunityPost, HealthWorker, WorkerDashboardSection } from '@shared/types';
import { PATIENT_CATEGORY_COLOR } from '@shared/constants';
import { useHealthWorkers, useMyMeetings } from '@features/workers/hooks/useWorkers';
import { useWorkerDashboardStats } from '@features/dashboard/hooks/useDashboard';
import { useCommunityPosts } from '@features/community/hooks/useCommunity';
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

const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const WorkerAvatarSmall = ({
  worker,
  photoClass,
  avatarClass,
}: {
  worker: HealthWorker;
  photoClass: string;
  avatarClass: string;
}) => {
  const initials = worker.username
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (worker.photo_url) {
    return (
      <img
        src={worker.photo_url}
        alt={worker.username}
        className={photoClass}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return <div className={avatarClass}>{initials}</div>;
};

interface PatientRow {
  userId: string;
  username: string;
  postCount: number;
  latestPostAt: string;
  posts: CommunityPost[];
}

const buildPatientRows = (posts: CommunityPost[]): PatientRow[] => {
  const map = new Map<string, PatientRow>();
  for (const post of posts) {
    const existing = map.get(post.user_id);
    if (existing) {
      existing.postCount += 1;
      existing.posts.push(post);
      if (post.created_at > existing.latestPostAt) {
        existing.latestPostAt = post.created_at;
      }
    } else {
      map.set(post.user_id, {
        userId: post.user_id,
        username: post.username,
        postCount: 1,
        latestPostAt: post.created_at,
        posts: [post],
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestPostAt).getTime() - new Date(a.latestPostAt).getTime(),
  );
};

const OverviewSection = () => {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const { data: stats, isLoading: loadingStats } = useWorkerDashboardStats();
  const { data: meetings = [], isLoading: loadingMeetings } = useMyMeetings();
  const { data: workers = [], isLoading: loadingWorkers } = useHealthWorkers();
  const { data: posts = [], isLoading: loadingPosts } = useCommunityPosts({ limit: 100 });

  const patientRows = buildPatientRows(posts);

  const statCards = [
    {
      label: 'Health workers',
      value: loadingStats ? '—' : String(stats?.total_health_workers ?? 0),
      sub: 'in the platform',
      color: 'wd-stat-card--green',
    },
    {
      label: 'Upcoming meetings',
      value: loadingStats ? '—' : String(stats?.upcoming_meetings_count ?? 0),
      sub: `${meetings.length} assigned to you`,
      color: 'wd-stat-card--blue',
    },
    {
      label: 'Active community members',
      value: loadingPosts ? '—' : String(patientRows.length),
      sub: 'users posting in community',
      color: 'wd-stat-card--amber',
    },
    {
      label: 'Total community posts',
      value: loadingStats ? '—' : String(stats?.total_community_posts ?? 0),
      sub: 'across all groups',
      color: 'wd-stat-card--red',
    },
  ];

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Good morning, {user?.first_name}</h1>
        <p className="wd-section__subtitle">{today}</p>
      </div>

      <div className="wd-stats-grid">
        {statCards.map((s) => (
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
          {loadingMeetings && <p className="wd-empty">Loading...</p>}
          {!loadingMeetings && meetings.length === 0 && (
            <p className="wd-empty">No upcoming sessions</p>
          )}
          {meetings.map((m) => {
            const workerObj = workers.find((w) => w.id === m.health_worker_id);
            const initials =
              workerObj?.username
                .split(' ')
                .map((n) => n[0] ?? '')
                .join('')
                .slice(0, 2)
                .toUpperCase() ?? 'HW';
            return (
              <div key={m.id} className="wd-session-row">
                <div className="wd-session-row__avatar-wrap">
                  {workerObj?.photo_url ? (
                    <img
                      src={workerObj.photo_url}
                      alt={workerObj.username}
                      className="wd-session-row__photo"
                    />
                  ) : (
                    <div className="wd-session-row__avatar">{initials}</div>
                  )}
                </div>
                <div className="wd-session-row__info">
                  <p className="wd-session-row__name">{workerObj?.username ?? 'Health Worker'}</p>
                  <p className="wd-session-row__time">{formatDate(m.scheduled_at)}</p>
                </div>
                <span className="wd-badge wd-badge--scheduled">{m.status}</span>
              </div>
            );
          })}
        </div>

        <div className="wd-panel wd-panel--flex1">
          <h3 className="wd-panel__title">Recent community activity</h3>
          {loadingPosts && <p className="wd-empty">Loading...</p>}
          {!loadingPosts && patientRows.length === 0 && (
            <p className="wd-empty">No community activity yet.</p>
          )}
          {patientRows.slice(0, 5).map((row) => {
            const initials = row.username
              .replace('anonymous-', '')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={row.userId} className="wd-progress-row">
                <div className="wd-progress-row__avatar-wrap">
                  <div className="wd-progress-row__initials">{initials}</div>
                </div>
                <div className="wd-progress-row__meta">
                  <p className="wd-progress-row__name">{row.username}</p>
                  <p className="wd-progress-row__program">{row.postCount} post{row.postCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="wd-badge wd-badge--active">
                  {formatRelative(row.latestPostAt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wd-panel">
        <h3 className="wd-panel__title">Your colleagues</h3>
        {loadingWorkers && <p className="wd-empty">Loading...</p>}
        <div className="wd-colleagues-grid">
          {workers.slice(0, 4).map((w) => (
            <div key={w.id} className="wd-colleague-card">
              <div className="wd-colleague-card__avatar-wrap">
                <WorkerAvatarSmall
                  worker={w}
                  photoClass="wd-colleague-card__photo"
                  avatarClass="wd-colleague-card__avatar"
                />
              </div>
              <p className="wd-colleague-card__name">{w.username}</p>
              <p className="wd-colleague-card__org">{w.organization}</p>
              <div className="wd-colleague-card__tags">
                {w.specialties.slice(0, 2).map((sp) => (
                  <span key={sp} className="wd-tag">{sp}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PatientPostDetail = ({
  row,
  onBack,
}: {
  row: PatientRow;
  onBack: () => void;
}) => {
  const initials = row.username.replace('anonymous-', '').slice(0, 2).toUpperCase();

  return (
    <div className="pt-detail">
      <button type="button" className="wd-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to patients
      </button>

      <div className="pt-hero">
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#16a34a,#15803d)',
          color: '#fff', fontSize: 24, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div className="pt-hero__info">
          <div className="pt-hero__top">
            <h2 className="pt-hero__name">{row.username}</h2>
            <span className="wd-badge wd-badge--active">Active</span>
          </div>
          <p className="pt-hero__meta">Last active {formatRelative(row.latestPostAt)}</p>
        </div>
        <div className="pt-hero__stats">
          {([
            { label: 'Posts', value: row.postCount },
            { label: 'Reactions', value: row.posts.reduce((s, p) => s + p.reaction_count, 0) },
            { label: 'Groups', value: new Set(row.posts.map((p) => p.community_group?.id)).size },
          ] as { label: string; value: number }[]).map((s) => (
            <div key={s.label} className="pt-hero__stat">
              <p className="pt-hero__stat-val">{s.value}</p>
              <p className="pt-hero__stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-row">
        <div className="pt-card pt-card--posts" style={{ flex: 1 }}>
          <p className="pt-card__title">Community posts</p>
          {row.posts.length === 0 && <p className="wd-empty">No community posts yet.</p>}
          {row.posts.map((post) => {
            const [bg, fg] = (PATIENT_CATEGORY_COLOR[post.category] ?? '#f3f4f6|#374151').split('|');
            return (
              <div key={post.id} className="pt-post">
                <div className="pt-post__meta">
                  <span className="pt-cat-chip" style={{ background: bg, color: fg }}>
                    {post.category.charAt(0) + post.category.slice(1).toLowerCase()}
                  </span>
                  {post.community_group && (
                    <span className="pt-post__group">{post.community_group.name}</span>
                  )}
                  <span className="pt-post__time">{formatRelative(post.created_at)}</span>
                </div>
                <p className="pt-post__text">{post.content}</p>
                <div className="pt-post__footer">
                  <span className="pt-post__stat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {post.reaction_count}
                  </span>
                  <span className="pt-post__stat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                    </svg>
                    {post.flag_count} flags
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-card pt-card--notes" style={{ flex: 1 }}>
          <p className="pt-card__title">Mood breakdown by category</p>
          {Array.from(new Set(row.posts.map((p) => p.category))).map((cat) => {
            const count = row.posts.filter((p) => p.category === cat).length;
            const [bg, fg] = (PATIENT_CATEGORY_COLOR[cat] ?? '#f3f4f6|#374151').split('|');
            return (
              <div key={cat} className="pt-note" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="pt-cat-chip" style={{ background: bg, color: fg }}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 999 }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      width: `${(count / row.postCount) * 100}%`,
                      background: fg,
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', minWidth: 24 }}>{count}</span>
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
  const [selected, setSelected] = useState<PatientRow | null>(null);

  const { data: posts = [], isLoading } = useCommunityPosts({ limit: 200 });
  const patientRows = buildPatientRows(posts);

  const filtered = patientRows.filter(
    (r) =>
      r.username.toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    return (
      <div className="wd-section wd-section--wide">
        <PatientPostDetail row={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Patients</h1>
        <p className="wd-section__subtitle">Community members and their engagement activity</p>
      </div>

      <div className="wd-panel">
        <div className="wd-search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="wd-search-bar__input"
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="wd-empty">Loading...</p>
        ) : (
          <table className="wd-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Posts</th>
                <th>Categories</th>
                <th>Last active</th>
                <th>Reactions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const initials = row.username.replace('anonymous-', '').slice(0, 2).toUpperCase();
                const categories = Array.from(new Set(row.posts.map((p) => p.category)));
                const totalReactions = row.posts.reduce((s, p) => s + p.reaction_count, 0);
                return (
                  <tr
                    key={row.userId}
                    className="wd-table__row--clickable"
                    onClick={() => setSelected(row)}
                  >
                    <td>
                      <div className="wd-table__patient">
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#16a34a,#15803d)',
                          color: '#fff', fontSize: 13, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {initials}
                        </div>
                        <div>
                          <p className="wd-table__name">{row.username}</p>
                          <p className="wd-table__sub">{row.postCount} post{row.postCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="wd-table__program">{row.postCount}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {categories.slice(0, 2).map((cat) => {
                          const [bg, fg] = (PATIENT_CATEGORY_COLOR[cat] ?? '#f3f4f6|#374151').split('|');
                          return (
                            <span key={cat} className="pt-cat-chip" style={{ background: bg, color: fg, fontSize: 11 }}>
                              {cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="wd-table__muted">{formatRelative(row.latestPostAt)}</td>
                    <td className="wd-table__muted">{totalReactions}</td>
                    <td>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="wd-table__empty">
                    {isLoading ? 'Loading...' : 'No community members found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const MeetingsSection = () => {
  const { data: meetings = [], isLoading } = useMyMeetings();
  const { data: workers = [] } = useHealthWorkers();

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Meetings</h1>
        <p className="wd-section__subtitle">Scheduled and past sessions</p>
      </div>

      <div className="wd-panel">
        <h3 className="wd-panel__title">Upcoming</h3>
        {isLoading && <p className="wd-empty">Loading...</p>}
        {!isLoading && meetings.length === 0 && (
          <p className="wd-empty">No upcoming sessions scheduled.</p>
        )}
        {meetings.map((m) => {
          const workerObj = workers.find((w) => w.id === m.health_worker_id);
          const initials =
            workerObj?.username
              .split(' ')
              .map((n) => n[0] ?? '')
              .join('')
              .slice(0, 2)
              .toUpperCase() ?? 'HW';
          return (
            <div key={m.id} className="wd-session-row wd-session-row--card">
              <div className="wd-session-row__avatar-wrap">
                {workerObj?.photo_url ? (
                  <img
                    src={workerObj.photo_url}
                    alt={workerObj.username}
                    className="wd-session-row__photo"
                  />
                ) : (
                  <div className="wd-session-row__avatar">{initials}</div>
                )}
              </div>
              <div className="wd-session-row__info">
                <p className="wd-session-row__name">{workerObj?.username ?? 'Health Worker'}</p>
                <p className="wd-session-row__time">{formatDate(m.scheduled_at)}</p>
              </div>
              <div className="wd-session-row__actions">
                <a
                  href={m.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Join session
                </a>
                <span className="wd-badge wd-badge--scheduled">{m.status}</span>
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
};

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
