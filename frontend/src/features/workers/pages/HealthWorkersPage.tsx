import { useState } from 'react';

import type { HealthWorker } from '@shared/types';
import { useHealthWorkers, useMyMeetings, useScheduleMeeting } from '../hooks/useWorkers';

const WORKER_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });

const WorkerAvatar = ({
  worker,
  className = 'hw-card__avatar',
}: {
  worker: HealthWorker;
  className?: string;
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
        className={`${className} ${className}--photo`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          const sib = e.currentTarget.nextSibling as HTMLElement | null;
          if (sib) sib.style.display = 'flex';
        }}
      />
    );
  }

  return <div className={className}>{initials}</div>;
};

const HealthWorkersPage = () => {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<HealthWorker | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'workers' | 'meetings'>('workers');

  const { data: workers = [], isLoading: loadingWorkers } = useHealthWorkers();
  const { data: meetings = [], isLoading: loadingMeetings } = useMyMeetings();
  const scheduleMutation = useScheduleMeeting();

  const filtered = workers.filter(
    (w) =>
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      w.organization.toLowerCase().includes(search.toLowerCase()),
  );

  const openBooking = (w: HealthWorker) => {
    setSelectedWorker(w);
    setSelectedDate('');
    setSelectedSlot('');
    setBookingDone(false);
  };

  const closeModal = () => setSelectedWorker(null);

  const confirmBooking = () => {
    if (!selectedWorker || !selectedDate || !selectedSlot) return;
    const iso = new Date(`${selectedDate}T${selectedSlot}:00Z`).toISOString();
    scheduleMutation.mutate(
      { health_worker_id: selectedWorker.id, scheduled_at: iso },
      { onSuccess: () => setBookingDone(true) },
    );
  };

  const today = new Date().toISOString().split('T')[0] ?? '';

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
                placeholder="Search by name or organisation..."
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

          {loadingWorkers ? (
            <div className="hw-empty">
              <span className="btn-spinner" />
              <p>Loading health workers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="hw-empty">
              <p>{search ? 'No workers match your search.' : 'No health workers available.'}</p>
              {search && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Clear search</button>
              )}
            </div>
          ) : (
            <div className="hw-grid">
              {filtered.map((w) => {
                const availClass =
                  w.availability === 'busy' ? 'hw-avail-badge--busy'
                  : w.availability === 'away' ? 'hw-avail-badge--away'
                  : 'hw-avail-badge--available';
                const availLabel =
                  w.availability === 'busy' ? 'Busy today'
                  : w.availability === 'away' ? 'Away'
                  : 'Available';
                return (
                  <div key={w.id} className="hw-card">
                    <div className="hw-card__top">
                      <div className="hw-card__avatar-wrap">
                        <WorkerAvatar worker={w} className="hw-card__avatar" />
                        {w.photo_url && (
                          <div className="hw-card__avatar" style={{ display: 'none' }}>
                            {w.username.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
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
                        {w.title && <span className="hw-card__role">{w.title}</span>}
                        <span className="hw-card__org">{w.organization}</span>
                      </div>
                    </div>

                    {w.bio && <p className="hw-card__bio">{w.bio}</p>}

                    {w.specialties.length > 0 && (
                      <div className="hw-card__tags">
                        {w.specialties.map((s) => (
                          <span key={s} className="hw-card__tag">{s}</span>
                        ))}
                      </div>
                    )}

                    {w.languages.length > 0 && (
                      <p className="hw-card__langs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {w.languages.join(' · ')}
                      </p>
                    )}

                    <div className="hw-card__footer">
                      <div className="hw-card__footer-left">
                        <span className={`hw-avail-badge ${availClass}`}>{availLabel}</span>
                        {w.sessions_count > 0 && (
                          <span className="hw-card__sessions">{w.sessions_count} sessions</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={w.availability === 'away'}
                        onClick={() => openBooking(w)}
                      >
                        Book session
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
          {loadingMeetings ? (
            <div className="hw-empty">
              <span className="btn-spinner" />
              <p>Loading meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="hw-empty">
              <p>No meetings scheduled yet.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('workers')}>
                Find a health worker
              </button>
            </div>
          ) : (
            <div className="hw-meeting-list">
              {meetings.map((m) => {
                const worker = workers.find((w) => w.id === m.health_worker_id);
                const initials = worker?.username.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase() ?? 'HW';
                return (
                  <div key={m.id} className="hw-meeting-card">
                    {worker?.photo_url ? (
                      <img
                        src={worker.photo_url}
                        alt={worker.username}
                        className="hw-meeting-card__avatar hw-meeting-card__avatar--photo"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="hw-meeting-card__avatar">{initials}</div>
                    )}
                    <div className="hw-meeting-card__info">
                      <p className="hw-meeting-card__name">{worker?.username ?? 'Health Worker'}</p>
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
                        href={m.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Join session
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedWorker && (
        <div className="hw-modal-overlay" onClick={closeModal}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal__header">
              <div className="hw-modal__worker">
                <WorkerAvatar worker={selectedWorker} className="hw-modal__avatar" />
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
                    disabled={!selectedDate || !selectedSlot || scheduleMutation.isPending}
                    onClick={confirmBooking}
                  >
                    {scheduleMutation.isPending && <span className="btn-spinner" />}
                    {scheduleMutation.isPending ? 'Booking...' : 'Confirm booking'}
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
