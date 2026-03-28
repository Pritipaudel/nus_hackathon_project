import { useState } from 'react';

import type { HealthWorker, Meeting } from '@shared/types';

import {
  WORKER_SPECIALTIES,
  WORKER_LANGUAGES,
  WORKER_AVATARS,
  WORKER_PHOTOS,
  WORKER_AVAILABILITY,
  WORKER_BIO,
  WORKER_STATUS_LABEL,
  WORKER_TIME_SLOTS,
  MOCK_WORKERS,
  MOCK_MEETINGS as INITIAL_MEETINGS,
} from '@shared/constants';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });

const HealthWorkersPage = () => {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<(typeof MOCK_WORKERS)[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [meetings, setMeetings] = useState<(Meeting & { worker_name: string; worker_id?: string })[]>(INITIAL_MEETINGS);
  const [bookingDone, setBookingDone] = useState(false);
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'workers' | 'meetings'>('workers');

  const filtered = MOCK_WORKERS.filter(
    (w) =>
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      w.organization.toLowerCase().includes(search.toLowerCase()) ||
      WORKER_SPECIALTIES[w.id]?.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );

  const openBooking = (w: (typeof MOCK_WORKERS)[0]) => {
    setSelectedWorker(w);
    setSelectedDate('');
    setSelectedSlot('');
    setBookingDone(false);
  };

  const confirmBooking = () => {
    if (!selectedWorker || !selectedDate || !selectedSlot) return;
    setBooking(true);
    setTimeout(() => {
      const iso = new Date(`${selectedDate}T${selectedSlot}:00Z`).toISOString();
      setMeetings((prev) => [
        ...prev,
        {
          id: `m${Date.now()}`,
          scheduled_at: iso,
          status: 'SCHEDULED',
          worker_name: selectedWorker.username,
          worker_id: selectedWorker.id,
        },
      ]);
      setBookingDone(true);
      setBooking(false);
    }, 800);
  };

  const closeModal = () => setSelectedWorker(null);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="hw-page">
      <div className="hw-page__header">
        <div>
          <h1 className="hw-page__title">Health Workers</h1>
          <p className="hw-page__subtitle">Connect with trained and verified community mental health professionals.</p>
        </div>
        <div className="hw-tab-bar">
          <button
            type="button"
            className={`hw-tab ${activeTab === 'workers' ? 'hw-tab--active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            Find a worker
          </button>
          <button
            type="button"
            className={`hw-tab ${activeTab === 'meetings' ? 'hw-tab--active' : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            My meetings
            {meetings.length > 0 && <span className="hw-tab__badge">{meetings.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'workers' && (
        <>
          <div className="hw-search-row">
            <div className="hw-search">
              <svg className="hw-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="hw-search__input"
                placeholder="Search by name, organisation, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="hw-search__clear" onClick={() => setSearch('')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <span className="hw-result-count">{filtered.length} workers</span>
          </div>

          {filtered.length === 0 ? (
            <div className="hw-empty">
              <p>No workers match your search.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Clear search</button>
            </div>
          ) : (
            <div className="hw-grid">
              {filtered.map((w) => {
                const avail = WORKER_AVAILABILITY[w.id] ?? 'available';
                return (
                  <div key={w.id} className="hw-card">
                    <div className="hw-card__top">
                      <div className="hw-card__avatar-wrap">
                        {WORKER_PHOTOS[w.id] ? (
                          <img
                            src={WORKER_PHOTOS[w.id]}
                            alt={w.username}
                            className="hw-card__avatar hw-card__avatar--photo"
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.style.display = 'none';
                              const fallback = el.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="hw-card__avatar"
                          style={{ display: WORKER_PHOTOS[w.id] ? 'none' : 'flex' }}
                        >
                          {WORKER_AVATARS[w.id]}
                        </div>
                        <span className={`hw-card__avail-dot hw-card__avail-dot--${avail}`} title={WORKER_STATUS_LABEL[avail]} />
                      </div>
                      <div className="hw-card__identity">
                        <div className="hw-card__name-row">
                          <span className="hw-card__name">{w.username}</span>
                          {w.is_verified && (
                            <span className="hw-card__verified">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="hw-card__title">{w.title}</span>
                        <span className="hw-card__org">{w.organization}</span>
                      </div>
                    </div>

                    <p className="hw-card__bio">{WORKER_BIO[w.id]}</p>

                    <div className="hw-card__tags">
                      {WORKER_SPECIALTIES[w.id]?.map((s) => (
                        <span key={s} className="hw-tag">{s}</span>
                      ))}
                    </div>

                    <div className="hw-card__langs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {WORKER_LANGUAGES[w.id]?.join(' · ')}
                    </div>

                    <div className="hw-card__footer">
                      <div className="hw-card__meta">
                        <span className={`hw-avail-badge hw-avail-badge--${avail}`}>{WORKER_STATUS_LABEL[avail]}</span>
                        <span className="hw-card__sessions">{w.sessions} sessions</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={avail === 'busy'}
                        onClick={() => openBooking(w)}
                      >
                        {avail === 'busy' ? 'Unavailable' : 'Book session'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'meetings' && (
        <div className="hw-meetings">
          {meetings.length === 0 ? (
            <div className="hw-empty">
              <p>No meetings scheduled yet.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('workers')}>
                Find a health worker
              </button>
            </div>
          ) : (
            <div className="hw-meeting-list">
              {meetings.map((m) => (
                <div key={m.id} className="hw-meeting-card">
                  {m.worker_id && WORKER_PHOTOS[m.worker_id] ? (
                    <img
                      src={WORKER_PHOTOS[m.worker_id]}
                      alt={m.worker_name}
                      className="hw-meeting-card__avatar hw-meeting-card__avatar--photo"
                    />
                  ) : (
                    <div className="hw-meeting-card__avatar">
                      {m.worker_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div className="hw-meeting-card__info">
                    <p className="hw-meeting-card__name">{m.worker_name}</p>
                    <p className="hw-meeting-card__time">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {formatDate(m.scheduled_at)} at {formatTime(m.scheduled_at)}
                    </p>
                  </div>
                  <div className="hw-meeting-card__right">
                    <span className="hw-avail-badge hw-avail-badge--available">{m.status}</span>
                    <a
                      href="#"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => e.preventDefault()}
                    >
                      Join session
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedWorker && (
        <div className="hw-modal-overlay" onClick={closeModal}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal__header">
              <div className="hw-modal__worker">
                {WORKER_PHOTOS[selectedWorker.id] ? (
                  <img
                    src={WORKER_PHOTOS[selectedWorker.id]}
                    alt={selectedWorker.username}
                    className="hw-modal__avatar hw-modal__avatar--photo"
                  />
                ) : (
                  <div className="hw-modal__avatar">{WORKER_AVATARS[selectedWorker.id]}</div>
                )}
                <div>
                  <p className="hw-modal__name">{selectedWorker.username}</p>
                  <p className="hw-modal__org">{selectedWorker.organization}</p>
                </div>
              </div>
              <button type="button" className="hw-modal__close" onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {bookingDone ? (
              <div className="hw-modal__success">
                <div className="hw-modal__success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="hw-modal__success-title">Session booked</p>
                <p className="hw-modal__success-sub">Your session with {selectedWorker.username} is confirmed for {selectedDate} at {selectedSlot}.</p>
                <div className="hw-modal__success-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Close</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => { closeModal(); setActiveTab('meetings'); }}>
                    View meetings
                  </button>
                </div>
              </div>
            ) : (
              <div className="hw-modal__body">
                <p className="hw-modal__label">Select a date</p>
                <input
                  type="date"
                  className="hw-modal__date-input"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                />

                {selectedDate && (
                  <>
                    <p className="hw-modal__label">Select a time slot</p>
                    <div className="hw-modal__slots">
                      {WORKER_TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`hw-slot ${selectedSlot === slot ? 'hw-slot--active' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="hw-modal__anon">
                  Sessions are confidential. Your identity is not shared with the health worker until you choose to disclose it.
                </p>

                <div className="hw-modal__footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!selectedDate || !selectedSlot || booking}
                    onClick={confirmBooking}
                  >
                    {booking && <span className="btn-spinner" />}
                    {booking ? 'Booking...' : 'Confirm booking'}
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

export default HealthWorkersPage;
