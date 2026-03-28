import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';
import type { Certification, CommunityPost, HealthWorker, WorkerDashboardSection } from '@shared/types';
import {
  useAllCertifications,
  useAssignCertification,
  useCreateCertification,
  useHealthWorkers,
  useMyPatients,
  useMyWorkerMeetings,
  useUploadWorkerPhoto,
  useWorkerPatientProfile,
} from '@features/workers/hooks/useWorkers';
import type { WorkerPatient } from '@features/workers/api/workersApi';
import { PATIENT_CATEGORY_COLOR } from '@shared/constants/workerDashboard';
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
    id: 'certifications',
    label: 'Certifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
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
  const [imgFailed, setImgFailed] = useState(false);
  const initials = worker.username
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const photo = worker.photo_url?.trim();
  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={worker.username}
        className={photoClass}
        onError={() => setImgFailed(true)}
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
  const { data: meetings = [], isLoading: loadingMeetings } = useMyWorkerMeetings();
  const { data: workers = [], isLoading: loadingWorkers } = useHealthWorkers();
  const { data: posts = [], isLoading: loadingPosts } = useCommunityPosts({ limit: 100 });
  void loadingWorkers;

  const patientRows = buildPatientRows(posts);

  const upcomingMeetings = meetings.filter((m) => new Date(m.scheduled_at) >= new Date());

  const statCards = [
    {
      label: 'Health workers',
      value: loadingStats ? '—' : String(stats?.total_health_workers ?? 0),
      sub: 'in the platform',
      color: 'wd-stat-card--green',
    },
    {
      label: 'Upcoming meetings',
      value: loadingMeetings ? '—' : String(upcomingMeetings.length),
      sub: 'sessions with your patients',
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
          {!loadingMeetings && upcomingMeetings.length === 0 && (
            <p className="wd-empty">No upcoming sessions</p>
          )}
          {upcomingMeetings.slice(0, 5).map((m) => {
            const initials = m.user_id
              ? m.user_id.slice(0, 2).toUpperCase()
              : 'PT';
            return (
              <div key={m.id} className="wd-session-row">
                <div className="wd-session-row__avatar-wrap">
                  <div className="wd-session-row__avatar" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>
                    {initials}
                  </div>
                </div>
                <div className="wd-session-row__info">
                  <p className="wd-session-row__name">Session with patient</p>
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


const formatCategoryLabel = (cat: string) =>
  cat.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

const PatientProfilePanel = ({
  patient,
  onBack,
  onAssignCert,
}: {
  patient: WorkerPatient;
  onBack: () => void;
  onAssignCert: (p: WorkerPatient) => void;
}) => {
  const { data, isLoading, isError, error } = useWorkerPatientProfile(patient.user_id);
  const initials = `${patient.first_name[0] ?? ''}${patient.last_name[0] ?? ''}`.toUpperCase();

  return (
    <div className="wd-section wd-section--wide">
      <button type="button" className="wd-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to patients
      </button>

      <div className="pt-hero" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg,#16a34a,#15803d)',
          color: '#fff', fontSize: 28, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 className="wd-section__title" style={{ marginBottom: 4 }}>
            {patient.first_name} {patient.last_name}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>@{patient.anonymous_username}</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{patient.email}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => onAssignCert(patient)}
          >
            Assign certification
          </button>
        </div>
        {data?.overall_icbt_progress_percent != null && (
          <div style={{
            padding: '16px 24px', borderRadius: 12, border: '1px solid var(--color-border)',
            textAlign: 'center', background: '#f8fafc',
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#16a34a', margin: 0 }}>
              {data.overall_icbt_progress_percent}%
            </p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Avg. iCBT progress</p>
          </div>
        )}
      </div>

      {isLoading && <p className="wd-empty" style={{ marginTop: 24 }}>Loading profile...</p>}
      {isError && (
        <p className="wd-empty" style={{ marginTop: 24, color: '#dc2626' }}>
          {(error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Could not load profile.'}
        </p>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
          <div className="wd-panel" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <h3 className="wd-panel__title">Mood & engagement</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#166534', lineHeight: 1.5 }}>
              {data.mood_summary ?? 'Summary unavailable.'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b7280' }}>
              {data.posts_count} community post{data.posts_count !== 1 ? 's' : ''} — post categories are used as mood / theme signals.
            </p>
          </div>

          <div className="wd-panel">
            <h3 className="wd-panel__title">Community groups</h3>
            {data.community_groups.length === 0 ? (
              <p className="wd-empty">Not active in any community groups yet (or no posts / iCBT community link).</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.community_groups.map((g) => (
                  <span
                    key={g.community_group_id}
                    className="wd-tag"
                    style={{ fontSize: 13, padding: '6px 12px' }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="wd-panel">
            <h3 className="wd-panel__title">Post themes (mood signals)</h3>
            {data.mood_by_category.length === 0 ? (
              <p className="wd-empty">No tagged posts yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.mood_by_category.map((m) => {
                  const total = data.mood_by_category.reduce((s, x) => s + x.count, 0);
                  const pct = total ? (m.count / total) * 100 : 0;
                  const [bg, fg] = (PATIENT_CATEGORY_COLOR[m.category] ?? '#f3f4f6|#374151').split('|');
                  return (
                    <div key={m.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          background: bg, color: fg, fontSize: 11, fontWeight: 600,
                          padding: '4px 10px', borderRadius: 999, minWidth: 100, textAlign: 'center',
                        }}
                      >
                        {formatCategoryLabel(m.category)}
                      </span>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 999 }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: fg }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 28 }}>{m.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="wd-panel">
            <h3 className="wd-panel__title">iCBT programme progress</h3>
            {data.icbt_programs.length === 0 ? (
              <p className="wd-empty">Not enrolled in any iCBT programmes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.icbt_programs.map((prog) => (
                  <div key={prog.program_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{prog.title}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {prog.status === 'COMPLETED' ? 'Completed' : 'In progress'}
                        {prog.community_name ? ` · ${prog.community_name}` : ''}
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999 }}>
                      <div
                        style={{
                          width: `${prog.progress_percent}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: prog.status === 'COMPLETED' ? '#16a34a' : '#3b82f6',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{prog.progress_percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AssignCertModal = ({
  patient,
  certifications,
  onClose,
}: {
  patient: WorkerPatient;
  certifications: Certification[];
  onClose: () => void;
}) => {
  const [selectedCertId, setSelectedCertId] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const assignMutation = useAssignCertification();

  const submit = () => {
    if (!selectedCertId) return;
    setError('');
    assignMutation.mutate(
      { user_id: patient.user_id, certification_id: selectedCertId, verified: true },
      {
        onSuccess: () => setDone(true),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setError(msg ?? 'Failed to assign certification.');
        },
      },
    );
  };

  return (
    <div className="hw-modal-overlay" onClick={onClose}>
      <div className="hw-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="hw-modal__header">
          <div className="hw-modal__worker">
            <div className="hw-modal__avatar" style={{ background: '#16a34a', color: '#fff', fontSize: '0.85rem' }}>
              {`${patient.first_name[0] ?? ''}${patient.last_name[0] ?? ''}`.toUpperCase()}
            </div>
            <div>
              <p className="hw-modal__name">Assign certification</p>
              <p className="hw-modal__org">{patient.first_name} {patient.last_name}</p>
            </div>
          </div>
          <button type="button" className="hw-modal__close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="hw-modal__success">
            <div className="hw-modal__success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="hw-modal__success-title">Certification assigned</p>
            <p className="hw-modal__success-sub">Successfully issued to {patient.first_name} {patient.last_name}.</p>
            <div className="hw-modal__success-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <div className="hw-modal__body">
            <p className="hw-modal__label">Select certification <span style={{ color: 'red' }}>*</span></p>
            {certifications.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No certifications available. Create one in the Certifications section first.</p>
            ) : (
              <select
                className="hw-modal__date-input"
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Choose a certification...</option>
                {certifications.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} — {c.organization}</option>
                ))}
              </select>
            )}
            {error && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            <div className="hw-modal__footer" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!selectedCertId || assignMutation.isPending || certifications.length === 0}
                onClick={submit}
              >
                {assignMutation.isPending && <span className="btn-spinner" />}
                {assignMutation.isPending ? 'Assigning...' : 'Assign certification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PatientsSection = () => {
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<WorkerPatient | null>(null);
  const [profilePatient, setProfilePatient] = useState<WorkerPatient | null>(null);

  const { data: patients = [], isLoading } = useMyPatients();
  const { data: certifications = [] } = useAllCertifications();

  const filtered = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      p.anonymous_username.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (profilePatient) {
    return (
      <>
        <PatientProfilePanel
          patient={profilePatient}
          onBack={() => setProfilePatient(null)}
          onAssignCert={(p) => setAssignTarget(p)}
        />
        {assignTarget && (
          <AssignCertModal
            patient={assignTarget}
            certifications={certifications}
            onClose={() => setAssignTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Patients</h1>
        <p className="wd-section__subtitle">Click a row to view profile — community groups, iCBT progress, and mood from posts</p>
      </div>

      <div className="wd-panel">
        <div className="wd-search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="wd-search-bar__input"
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="wd-empty">Loading patients...</p>
        ) : filtered.length === 0 ? (
          <p className="wd-empty">
            {search ? 'No patients match your search.' : 'No patients yet. Patients appear here when they book a session with you.'}
          </p>
        ) : (
          <table className="wd-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Username</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const initials = `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
                return (
                  <tr
                    key={p.user_id}
                    className="wd-table__row--clickable"
                    onClick={() => setProfilePatient(p)}
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
                          <p className="wd-table__name">{p.first_name} {p.last_name}</p>
                          <p className="wd-table__sub" style={{ fontSize: 11, color: '#9ca3af' }}>View profile</p>
                        </div>
                      </div>
                    </td>
                    <td className="wd-table__muted">@{p.anonymous_username}</td>
                    <td className="wd-table__muted">{p.email}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignTarget(p);
                        }}
                      >
                        Assign cert
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {assignTarget && (
        <AssignCertModal
          patient={assignTarget}
          certifications={certifications}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
};

const MeetingsSection = () => {
  const { data: meetings = [], isLoading } = useMyWorkerMeetings();
  const { data: patients = [] } = useMyPatients();

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduled_at) >= now);
  const past = meetings.filter((m) => new Date(m.scheduled_at) < now);

  const patientInitials = (userId: string) => {
    const p = patients.find((pt) => pt.user_id === userId);
    if (!p) return 'PT';
    return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
  };

  const patientName = (userId: string) => {
    const p = patients.find((pt) => pt.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}` : 'Patient';
  };

  const renderRow = (m: (typeof meetings)[0]) => (
    <div key={m.id} className="wd-session-row wd-session-row--card">
      <div className="wd-session-row__avatar-wrap">
        <div className="wd-session-row__avatar" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>
          {patientInitials(m.user_id ?? '')}
        </div>
      </div>
      <div className="wd-session-row__info">
        <p className="wd-session-row__name">{patientName(m.user_id ?? '')}</p>
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

  return (
    <div className="wd-section">
      <div className="wd-section__header">
        <h1 className="wd-section__title">Meetings</h1>
        <p className="wd-section__subtitle">Sessions booked with your patients</p>
      </div>

      <div className="wd-panel">
        <h3 className="wd-panel__title">Upcoming</h3>
        {isLoading && <p className="wd-empty">Loading...</p>}
        {!isLoading && upcoming.length === 0 && (
          <p className="wd-empty">No upcoming sessions scheduled.</p>
        )}
        {upcoming.map(renderRow)}
      </div>

      <div className="wd-panel">
        <h3 className="wd-panel__title">Past sessions</h3>
        {!isLoading && past.length === 0 && (
          <p className="wd-empty">No past sessions to display.</p>
        )}
        {past.map(renderRow)}
      </div>
    </div>
  );
};

const CertificationsSection = () => {
  const { data: certifications = [], isLoading: loadingCerts } = useAllCertifications();
  const { data: patients = [], isLoading: loadingPatients } = useMyPatients();

  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createOrg, setCreateOrg] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createDone, setCreateDone] = useState(false);
  const [createError, setCreateError] = useState('');

  const [assignCert, setAssignCert] = useState<Certification | null>(null);
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignDone, setAssignDone] = useState(false);
  const [assignError, setAssignError] = useState('');

  const createMutation = useCreateCertification();
  const assignMutation = useAssignCertification();

  const openCreate = () => {
    setCreateTitle(''); setCreateOrg(''); setCreateDesc('');
    setCreateDone(false); setCreateError('');
    setShowCreate(true);
  };

  const submitCreate = () => {
    if (!createTitle.trim() || !createOrg.trim()) return;
    setCreateError('');
    const desc = createDesc.trim();
    createMutation.mutate(
      { title: createTitle.trim(), organization: createOrg.trim(), ...(desc ? { description: desc } : {}) },
      {
        onSuccess: () => setCreateDone(true),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setCreateError(msg ?? 'Failed to create certification.');
        },
      },
    );
  };

  const openAssign = (cert: Certification) => {
    setAssignCert(cert);
    setAssignPatientId('');
    setAssignDone(false);
    setAssignError('');
  };

  const submitAssign = () => {
    if (!assignCert || !assignPatientId) return;
    setAssignError('');
    assignMutation.mutate(
      { user_id: assignPatientId, certification_id: assignCert.id, verified: true },
      {
        onSuccess: () => setAssignDone(true),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setAssignError(msg ?? 'Failed to assign certification.');
        },
      },
    );
  };

  return (
    <div className="wd-section">
      <div className="wd-section__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="wd-section__title">Certifications</h1>
          <p className="wd-section__subtitle">Create certifications and issue them to your patients</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '0.25rem' }} onClick={openCreate}>
          + Create certification
        </button>
      </div>

      <div className="wd-panel">
        {loadingCerts ? (
          <p className="wd-empty">Loading certifications...</p>
        ) : certifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p className="wd-empty">No certifications yet.</p>
            <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={openCreate}>
              Create your first certification
            </button>
          </div>
        ) : (
          <table className="wd-table">
            <thead>
              <tr>
                <th>Certification</th>
                <th>Organisation</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id}>
                  <td>
                    <div className="wd-table__patient">
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        letterSpacing: 0.5,
                      }}>
                        CERT
                      </div>
                      <p className="wd-table__name">{cert.title}</p>
                    </div>
                  </td>
                  <td className="wd-table__muted">{cert.organization}</td>
                  <td className="wd-table__muted" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cert.description ?? '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openAssign(cert)}
                    >
                      Assign to patient
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="hw-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="hw-modal__header">
              <div className="hw-modal__worker">
                <div className="hw-modal__avatar" style={{ background: '#6366f1', color: '#fff', fontSize: '0.75rem' }}>CERT</div>
                <div>
                  <p className="hw-modal__name">Create certification</p>
                  <p className="hw-modal__org">Add to the catalogue</p>
                </div>
              </div>
              <button type="button" className="hw-modal__close" onClick={() => setShowCreate(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {createDone ? (
              <div className="hw-modal__success">
                <div className="hw-modal__success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="hw-modal__success-title">Certification created</p>
                <p className="hw-modal__success-sub">"{createTitle}" has been added.</p>
                <div className="hw-modal__success-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(false)}>Done</button>
                </div>
              </div>
            ) : (
              <div className="hw-modal__body">
                <p className="hw-modal__label">Title <span style={{ color: 'red' }}>*</span></p>
                <input type="text" className="hw-modal__date-input" placeholder="e.g. Mental Health First Aid" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />

                <p className="hw-modal__label" style={{ marginTop: '1rem' }}>Issuing organisation <span style={{ color: 'red' }}>*</span></p>
                <input type="text" className="hw-modal__date-input" placeholder="e.g. WHO" value={createOrg} onChange={(e) => setCreateOrg(e.target.value)} />

                <p className="hw-modal__label" style={{ marginTop: '1rem' }}>Description (optional)</p>
                <textarea className="hw-modal__date-input" placeholder="Brief description..." rows={3} style={{ resize: 'vertical' }} value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />

                {createError && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>{createError}</p>}

                <div className="hw-modal__footer" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!createTitle.trim() || !createOrg.trim() || createMutation.isPending}
                    onClick={submitCreate}
                  >
                    {createMutation.isPending && <span className="btn-spinner" />}
                    {createMutation.isPending ? 'Creating...' : 'Create certification'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignCert && (
        <div className="hw-modal-overlay" onClick={() => setAssignCert(null)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="hw-modal__header">
              <div className="hw-modal__worker">
                <div className="hw-modal__avatar" style={{ background: '#16a34a', color: '#fff', fontSize: '0.75rem' }}>ASGN</div>
                <div>
                  <p className="hw-modal__name">Assign to patient</p>
                  <p className="hw-modal__org">{assignCert.title}</p>
                </div>
              </div>
              <button type="button" className="hw-modal__close" onClick={() => setAssignCert(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {assignDone ? (
              <div className="hw-modal__success">
                <div className="hw-modal__success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="hw-modal__success-title">Certification assigned</p>
                <p className="hw-modal__success-sub">Successfully issued to the patient.</p>
                <div className="hw-modal__success-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAssignCert(null)}>Done</button>
                </div>
              </div>
            ) : (
              <div className="hw-modal__body">
                <p className="hw-modal__label">Select patient <span style={{ color: 'red' }}>*</span></p>
                {loadingPatients ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading patients...</p>
                ) : patients.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No patients linked to your account yet.</p>
                ) : (
                  <select
                    className="hw-modal__date-input"
                    value={assignPatientId}
                    onChange={(e) => setAssignPatientId(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map((p) => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.first_name} {p.last_name} (@{p.anonymous_username})
                      </option>
                    ))}
                  </select>
                )}

                {assignError && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>{assignError}</p>}

                <div className="hw-modal__footer" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAssignCert(null)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!assignPatientId || assignMutation.isPending || patients.length === 0}
                    onClick={submitAssign}
                  >
                    {assignMutation.isPending && <span className="btn-spinner" />}
                    {assignMutation.isPending ? 'Assigning...' : 'Assign certification'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const WorkerDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [section, setSection] = useState<WorkerDashboardSection>('overview');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const uploadPhotoMutation = useUploadWorkerPhoto();

  const handleLogout = () => {
    clearAuth();
    window.location.replace('/login');
  };

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : 'HW';

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhotoMutation.mutate(file, {
      onSuccess: (url) => setPhotoUrl(url),
    });
    e.target.value = '';
  };

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
            {/* Avatar — shows uploaded photo or initials, click to upload */}
            <label
              htmlFor="worker-photo-upload"
              title="Click to upload profile photo"
              style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="wd-user-pill__avatar" style={{ position: 'relative' }}>
                  {uploadPhotoMutation.isPending ? (
                    <span className="btn-spinner" style={{ width: 14, height: 14 }} />
                  ) : (
                    initials
                  )}
                  {/* Camera overlay hint */}
                  <span style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </span>
                </div>
              )}
              <input
                id="worker-photo-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </label>

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
        {section === 'overview'        && <OverviewSection />}
        {section === 'patients'        && <PatientsSection />}
        {section === 'meetings'        && <MeetingsSection />}
        {section === 'certifications'  && <CertificationsSection />}
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
