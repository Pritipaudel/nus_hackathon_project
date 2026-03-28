import { useState } from 'react';

import type { Certification } from '@shared/types';

import {
  TRAINING_COVERS,
  TRAINING_DURATION,
  TRAINING_MODULES,
  TRAINING_LEVEL,
  TRAINING_DESCRIPTION,
  TRAINING_LEVEL_COLOR,
  MOCK_TRAINING_PROGRAMS,
  MOCK_CERTIFICATIONS,
} from '@shared/constants';

type Tab = 'browse' | 'my-training' | 'certifications';

const formatIssuedDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const TrainingPage = () => {
  const [tab, setTab] = useState<Tab>('browse');
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set(['1']));
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [certs, setCerts] = useState(MOCK_CERTIFICATIONS);
  const [completing, setCompleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);

  const myPrograms = MOCK_TRAINING_PROGRAMS.filter((p) => enrolled.has(p.id));

  const filtered = MOCK_TRAINING_PROGRAMS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || TRAINING_LEVEL[p.id] === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleEnroll = (programId: string) => {
    setEnrolling(programId);
    setTimeout(() => {
      setEnrolled((prev) => new Set([...prev, programId]));
      setEnrolling(null);
    }, 700);
  };

  const handleComplete = (programId: string) => {
    setCompleting(programId);
    setTimeout(() => {
      const program = MOCK_TRAINING_PROGRAMS.find((p) => p.id === programId);
      if (program && !certs.find((c) => c.program_id === programId)) {
        setCerts((prev) => [
          ...prev,
          {
            id: `c${Date.now()}`,
            program_id: programId,
            program_title: program.title,
            issued_at: new Date().toISOString(),
            verified: program.is_verified,
          },
        ]);
      }
      setCompleting(null);
      setTab('certifications');
    }, 900);
  };

  const detailProgram = detailId ? MOCK_TRAINING_PROGRAMS.find((p) => p.id === detailId) : null;

  return (
    <div className="tr-page">
      <div className="tr-page__header">
        <div>
          <h1 className="tr-page__title">Training</h1>
          <p className="tr-page__subtitle">
            Build skills, earn certifications, and grow as a mental health advocate.
          </p>
        </div>
        <div className="tr-tab-bar">
          <button
            type="button"
            className={`tr-tab ${tab === 'browse' ? 'tr-tab--active' : ''}`}
            onClick={() => setTab('browse')}
          >
            Browse programmes
          </button>
          <button
            type="button"
            className={`tr-tab ${tab === 'my-training' ? 'tr-tab--active' : ''}`}
            onClick={() => setTab('my-training')}
          >
            My training
            {myPrograms.length > 0 && (
              <span className="tr-tab__badge">{myPrograms.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`tr-tab ${tab === 'certifications' ? 'tr-tab--active' : ''}`}
            onClick={() => setTab('certifications')}
          >
            Certifications
            {certs.length > 0 && (
              <span className="tr-tab__badge">{certs.length}</span>
            )}
          </button>
        </div>
      </div>

      {tab === 'browse' && (
        <>
          <div className="tr-filters">
            <div className="tr-search">
              <svg className="tr-search__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="tr-search__input"
                placeholder="Search programmes or organisations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="tr-search__clear" onClick={() => setSearch('')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="tr-level-pills">
              {['ALL', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`tr-pill ${levelFilter === l ? 'tr-pill--active' : ''}`}
                  onClick={() => setLevelFilter(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="tr-empty">
              <p>No programmes match your search.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setLevelFilter('ALL'); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="tr-grid">
              {filtered.map((p) => {
                const isEnrolled = enrolled.has(p.id);
                const isEnrolling = enrolling === p.id;
                const hasCert = certs.some((c) => c.program_id === p.id);
                return (
                  <div key={p.id} className={`tr-card ${isEnrolled ? 'tr-card--enrolled' : ''}`}>
                    <div className="tr-card__cover-wrap">
                      <img
                        src={TRAINING_COVERS[p.id]}
                        alt={p.title}
                        className="tr-card__cover"
                        loading="lazy"
                      />
                      <div className="tr-card__cover-overlay">
                        <span className={`tr-badge ${TRAINING_LEVEL_COLOR[TRAINING_LEVEL[p.id]]}`}>{TRAINING_LEVEL[p.id]}</span>
                        {hasCert && <span className="tr-badge tr-badge--cert">Certified</span>}
                        {isEnrolled && !hasCert && <span className="tr-badge tr-badge--enrolled">Enrolled</span>}
                      </div>
                    </div>

                    <div className="tr-card__body">
                      <div className="tr-card__meta-row">
                        <span className="tr-card__org">
                          {p.is_verified && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="tr-card__org-check">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {p.organization}
                        </span>
                        <span className="tr-card__stats">
                          {TRAINING_MODULES[p.id]} modules · {TRAINING_DURATION[p.id]}
                        </span>
                      </div>

                      <h3 className="tr-card__title">{p.title}</h3>
                      <p className="tr-card__desc">{TRAINING_DESCRIPTION[p.id]}</p>

                      <div className="tr-card__footer">
                        <button
                          type="button"
                          className="tr-card__detail-link"
                          onClick={() => setDetailId(p.id)}
                        >
                          View details
                        </button>
                        {hasCert ? (
                          <button type="button" className="btn btn-secondary btn-sm" disabled>
                            Completed
                          </button>
                        ) : isEnrolled ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={completing === p.id}
                            onClick={() => handleComplete(p.id)}
                          >
                            {completing === p.id && <span className="btn-spinner" />}
                            {completing === p.id ? 'Completing...' : 'Mark complete'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isEnrolling}
                            onClick={() => handleEnroll(p.id)}
                          >
                            {isEnrolling && <span className="btn-spinner" />}
                            {isEnrolling ? 'Enrolling...' : 'Enroll now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'my-training' && (
        <div className="tr-my">
          {myPrograms.length === 0 ? (
            <div className="tr-empty">
              <p>You have not enrolled in any programmes yet.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('browse')}>
                Browse programmes
              </button>
            </div>
          ) : (
            <div className="tr-my__list">
              {myPrograms.map((p) => {
                const hasCert = certs.some((c) => c.program_id === p.id);
                return (
                  <div key={p.id} className="tr-my__card">
                    <img
                      src={TRAINING_COVERS[p.id]}
                      alt={p.title}
                      className="tr-my__cover"
                      loading="lazy"
                    />
                    <div className="tr-my__info">
                      <div className="tr-my__top">
                        <span className="tr-my__org">{p.organization}</span>
                        <span className={`tr-badge ${TRAINING_LEVEL_COLOR[TRAINING_LEVEL[p.id]]}`}>{TRAINING_LEVEL[p.id]}</span>
                      </div>
                      <p className="tr-my__title">{p.title}</p>
                      <p className="tr-my__desc">{TRAINING_DESCRIPTION[p.id]}</p>
                      <div className="tr-my__meta">
                        <span>{TRAINING_MODULES[p.id]} modules</span>
                        <span>·</span>
                        <span>{TRAINING_DURATION[p.id]}</span>
                      </div>

                      <div className="tr-my__progress-bar">
                        <div
                          className="tr-my__progress-fill"
                          style={{ width: hasCert ? '100%' : '40%' }}
                        />
                      </div>
                      <span className="tr-my__progress-label">
                        {hasCert ? 'Complete' : '40% complete'}
                      </span>
                    </div>
                    <div className="tr-my__actions">
                      {hasCert ? (
                        <button type="button" className="btn btn-secondary btn-sm" disabled>
                          Completed
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={completing === p.id}
                          onClick={() => handleComplete(p.id)}
                        >
                          {completing === p.id && <span className="btn-spinner" />}
                          {completing === p.id ? 'Completing...' : 'Mark complete'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'certifications' && (
        <div className="tr-certs">
          {certs.length === 0 ? (
            <div className="tr-empty">
              <p>No certifications yet. Complete a programme to earn one.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('browse')}>
                Browse programmes
              </button>
            </div>
          ) : (
            <div className="tr-cert-grid">
              {certs.map((c) => (
                <div key={c.id} className="tr-cert-card">
                  <div className="tr-cert-card__ribbon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <div className="tr-cert-card__body">
                    <p className="tr-cert-card__label">Certificate of Completion</p>
                    <p className="tr-cert-card__title">{c.program_title}</p>
                    <p className="tr-cert-card__date">Issued {formatIssuedDate(c.issued_at)}</p>
                    {c.verified && (
                      <span className="tr-cert-card__verified">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verified by issuing organisation
                      </span>
                    )}
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm tr-cert-card__download">
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {detailProgram && (
        <div className="tr-modal-overlay" onClick={() => setDetailId(null)}>
          <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tr-modal__close" onClick={() => setDetailId(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={TRAINING_COVERS[detailProgram.id]} alt={detailProgram.title} className="tr-modal__cover" />
            <div className="tr-modal__body">
              <div className="tr-modal__meta">
                <span className={`tr-badge ${TRAINING_LEVEL_COLOR[TRAINING_LEVEL[detailProgram.id]]}`}>{TRAINING_LEVEL[detailProgram.id]}</span>
                <span className="tr-modal__org">
                  {detailProgram.is_verified && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="tr-card__org-check">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {detailProgram.organization}
                </span>
              </div>
              <h2 className="tr-modal__title">{detailProgram.title}</h2>
              <p className="tr-modal__desc">{TRAINING_DESCRIPTION[detailProgram.id]}</p>
              <div className="tr-modal__stats">
                <div className="tr-modal__stat">
                  <span className="tr-modal__stat-label">Modules</span>
                  <span className="tr-modal__stat-value">{TRAINING_MODULES[detailProgram.id]}</span>
                </div>
                <div className="tr-modal__stat">
                  <span className="tr-modal__stat-label">Duration</span>
                  <span className="tr-modal__stat-value">{TRAINING_DURATION[detailProgram.id]}</span>
                </div>
                <div className="tr-modal__stat">
                  <span className="tr-modal__stat-label">Level</span>
                  <span className="tr-modal__stat-value">{TRAINING_LEVEL[detailProgram.id]}</span>
                </div>
                <div className="tr-modal__stat">
                  <span className="tr-modal__stat-label">Certificate</span>
                  <span className="tr-modal__stat-value">{detailProgram.is_verified ? 'Verified' : 'Standard'}</span>
                </div>
              </div>
              <div className="tr-modal__footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDetailId(null)}>
                  Close
                </button>
                {!enrolled.has(detailProgram.id) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={enrolling === detailProgram.id}
                    onClick={() => { handleEnroll(detailProgram.id); setDetailId(null); }}
                  >
                    Enroll now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
