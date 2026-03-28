import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';
import { useTrainingPrograms, useMyTrainingCertifications, useEnrollTraining } from '../hooks/useTraining';

type Tab = 'browse' | 'my-training' | 'certifications';

const formatIssuedDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

const TrainingPage = () => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: programs = [], isLoading: loadingPrograms } = useTrainingPrograms();
  const { data: certifications = [], isLoading: loadingCerts } = useMyTrainingCertifications(user?.id ?? '');
  const enrollMutation = useEnrollTraining();

  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const certProgramIds = new Set(certifications.map((c) => c.certification_id));

  const myPrograms = programs.filter((p) => enrolledIds.has(p.id));

  const filtered = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleEnroll = (programId: string) => {
    enrollMutation.mutate(
      { program_id: programId },
      {
        onSuccess: () => {
          setEnrolledIds((prev) => new Set([...prev, programId]));
        },
      },
    );
  };

  const detailProgram = detailId ? programs.find((p) => p.id === detailId) : null;

  if (loadingPrograms) {
    return (
      <div className="tr-page">
        <div className="tr-empty">
          <span className="btn-spinner" />
          <p>Loading programmes...</p>
        </div>
      </div>
    );
  }

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
            {myPrograms.length > 0 && <span className="tr-tab__badge">{myPrograms.length}</span>}
          </button>
          <button
            type="button"
            className={`tr-tab ${tab === 'certifications' ? 'tr-tab--active' : ''}`}
            onClick={() => setTab('certifications')}
          >
            Certifications
            {certifications.length > 0 && <span className="tr-tab__badge">{certifications.length}</span>}
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
          </div>

          {filtered.length === 0 ? (
            <div className="tr-empty">
              <p>No programmes match your search.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Clear filters</button>
            </div>
          ) : (
            <div className="tr-grid">
              {filtered.map((p) => {
                const isEnrolled = enrolledIds.has(p.id);
                const isEnrolling = enrollMutation.isPending && enrollMutation.variables?.program_id === p.id;
                const hasCert = certProgramIds.has(p.id);
                return (
                  <div key={p.id} className={`tr-card ${isEnrolled ? 'tr-card--enrolled' : ''}`}>
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
                        <div className="tr-card__badges">
                          {hasCert && <span className="tr-badge tr-badge--cert">Certified</span>}
                          {isEnrolled && !hasCert && <span className="tr-badge tr-badge--enrolled">Enrolled</span>}
                        </div>
                      </div>

                      <h3 className="tr-card__title">{p.title}</h3>
                      {p.description && <p className="tr-card__desc">{p.description}</p>}

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
                          <button type="button" className="btn btn-secondary btn-sm" disabled>
                            Enrolled
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
                const hasCert = certProgramIds.has(p.id);
                return (
                  <div key={p.id} className="tr-my__card">
                    <div className="tr-my__info">
                      <span className="tr-my__org">{p.organization}</span>
                      <p className="tr-my__title">{p.title}</p>
                      {p.description && <p className="tr-my__desc">{p.description}</p>}
                      <div className="tr-my__progress-bar">
                        <div className="tr-my__progress-fill" style={{ width: hasCert ? '100%' : '40%' }} />
                      </div>
                      <span className="tr-my__progress-label">{hasCert ? 'Complete' : 'In progress'}</span>
                    </div>
                    <div className="tr-my__actions">
                      <span className={`tr-badge ${hasCert ? 'tr-badge--cert' : 'tr-badge--inprogress'}`}>
                        {hasCert ? 'Completed' : 'In progress'}
                      </span>
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
          {loadingCerts ? (
            <div className="tr-empty">
              <span className="btn-spinner" />
              <p>Loading certifications...</p>
            </div>
          ) : certifications.length === 0 ? (
            <div className="tr-empty">
              <p>No certifications yet. Complete a programme to earn one.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('browse')}>
                Browse programmes
              </button>
            </div>
          ) : (
            <div className="tr-cert-grid">
              {certifications.map((c) => (
                <div key={c.id} className="tr-cert-card">
                  <div className="tr-cert-card__ribbon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <div className="tr-cert-card__body">
                    <p className="tr-cert-card__label">Certificate of Completion</p>
                    <p className="tr-cert-card__title">{c.certification.title}</p>
                    <p className="tr-cert-card__date">Issued {formatIssuedDate(c.issued_at)}</p>
                    <p className="tr-cert-card__org">{c.certification.organization}</p>
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
            <div className="tr-modal__body">
              <div className="tr-modal__meta">
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
              {detailProgram.description && <p className="tr-modal__desc">{detailProgram.description}</p>}
              <div className="tr-modal__stats">
                <div className="tr-modal__stat">
                  <span className="tr-modal__stat-label">Certificate</span>
                  <span className="tr-modal__stat-value">{detailProgram.is_verified ? 'Verified' : 'Standard'}</span>
                </div>
              </div>
              <div className="tr-modal__footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDetailId(null)}>
                  Close
                </button>
                {!enrolledIds.has(detailProgram.id) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={enrollMutation.isPending}
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
