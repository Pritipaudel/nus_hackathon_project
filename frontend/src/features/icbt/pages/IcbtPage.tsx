import { useState } from 'react';

import type { IcbtProgram, MyProgram } from '@shared/types';

const MOCK_PROGRAMS: IcbtProgram[] = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'Learn to identify anxiety triggers and apply cognitive restructuring. Covers thought records, behavioural experiments, and graded exposure.',
    difficulty_level: 'Beginner',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/anxiety',
  },
  {
    id: '2',
    title: 'Managing Low Mood',
    description: 'Targets negative thought patterns associated with depression. Uses behavioural activation, thought challenging, and self-compassion exercises.',
    difficulty_level: 'Beginner',
    duration_days: 30,
    url: 'https://mindbridge.app/programs/low-mood',
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    description: 'Addresses sleep disturbances through cognitive and behavioural techniques including sleep restriction, stimulus control, and relaxation training.',
    difficulty_level: 'Intermediate',
    duration_days: 14,
    url: 'https://mindbridge.app/programs/sleep',
  },
  {
    id: '4',
    title: 'Stress & Burnout Reset',
    description: 'Identifies workplace and personal stressors. Builds boundary-setting skills, cognitive flexibility, and sustainable coping routines.',
    difficulty_level: 'Intermediate',
    duration_days: 28,
    url: 'https://mindbridge.app/programs/burnout',
  },
  {
    id: '5',
    title: 'Trauma-Informed Stabilisation',
    description: 'A foundational programme for trauma survivors. Focuses on grounding, safety planning, and emotion regulation before deeper processing.',
    difficulty_level: 'Advanced',
    duration_days: 42,
    url: 'https://mindbridge.app/programs/trauma',
  },
  {
    id: '6',
    title: 'Self-Esteem & Identity',
    description: 'Explores core beliefs and schemas driving low self-worth. Includes values clarification, self-compassion practice, and assertiveness training.',
    difficulty_level: 'Intermediate',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/self-esteem',
  },
];

const MOCK_MY_PROGRAMS: MyProgram[] = [
  { program_id: '1', status: 'ACTIVE', progress_percent: 45 },
  { program_id: '3', status: 'COMPLETED', progress_percent: 100 },
];

type FilterTab = 'all' | 'enrolled' | 'completed' | 'available';
type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

const DIFFICULTY_BADGE: Record<string, string> = {
  Beginner: 'ds-badge--green',
  Intermediate: 'ds-badge--amber',
  Advanced: 'ds-badge--red',
};

const IcbtPage = () => {
  const [tab, setTab] = useState<FilterTab>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [search, setSearch] = useState('');
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(MOCK_MY_PROGRAMS.map((p) => p.program_id)),
  );
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(MOCK_MY_PROGRAMS.filter((p) => p.status === 'COMPLETED').map((p) => p.program_id)),
  );
  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(MOCK_MY_PROGRAMS.map((p) => [p.program_id, p.progress_percent])),
  );
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const myPrograms: MyProgram[] = MOCK_PROGRAMS.filter((p) => enrolledIds.has(p.id)).map((p) => ({
    program_id: p.id,
    status: completedIds.has(p.id) ? 'COMPLETED' : 'ACTIVE',
    progress_percent: progress[p.id] ?? 0,
  }));

  const filtered = MOCK_PROGRAMS.filter((p) => {
    if (tab === 'enrolled' && !enrolledIds.has(p.id)) return false;
    if (tab === 'completed' && !completedIds.has(p.id)) return false;
    if (tab === 'available' && enrolledIds.has(p.id)) return false;
    if (difficulty !== 'all' && p.difficulty_level !== difficulty) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleEnroll = (programId: string) => {
    setEnrolling(programId);
    setTimeout(() => {
      setEnrolledIds((prev) => new Set([...prev, programId]));
      setProgress((prev) => ({ ...prev, [programId]: 0 }));
      setEnrolling(null);
    }, 800);
  };

  const getMyProgram = (id: string): MyProgram | undefined =>
    myPrograms.find((p) => p.program_id === id);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All programmes', count: MOCK_PROGRAMS.length },
    { id: 'enrolled', label: 'Enrolled', count: enrolledIds.size },
    { id: 'completed', label: 'Completed', count: completedIds.size },
    { id: 'available', label: 'Available', count: MOCK_PROGRAMS.length - enrolledIds.size },
  ];

  return (
    <div className="icbt-page">
      <div className="icbt-header">
        <div>
          <h1 className="icbt-header__title">iCBT Programmes</h1>
          <p className="icbt-header__sub">
            Evidence-based programmes built on inference-based cognitive behavioural therapy.
          </p>
        </div>
        <div className="icbt-header__stats">
          <div className="icbt-stat">
            <span className="icbt-stat__val">{enrolledIds.size}</span>
            <span className="icbt-stat__label">Enrolled</span>
          </div>
          <div className="icbt-stat">
            <span className="icbt-stat__val">{completedIds.size}</span>
            <span className="icbt-stat__label">Completed</span>
          </div>
        </div>
      </div>

      <div className="icbt-toolbar">
        <div className="icbt-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`icbt-tab ${tab === t.id ? 'icbt-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="icbt-tab__count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="icbt-filters">
          <div className="icbt-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search programmes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="icbt-search__input"
            />
          </div>

          <select
            className="icbt-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
          >
            <option value="all">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="icbt-empty">
          <p>No programmes match your filters.</p>
        </div>
      ) : (
        <div className="icbt-grid">
          {filtered.map((program) => {
            const my = getMyProgram(program.id);
            const isEnrolled = enrolledIds.has(program.id);
            const isCompleted = completedIds.has(program.id);

            return (
              <div key={program.id} className={`icbt-card ${isEnrolled ? 'icbt-card--enrolled' : ''}`}>
                <div className="icbt-card__top">
                  <div className="icbt-card__badges">
                    <span className={`ds-badge ${DIFFICULTY_BADGE[program.difficulty_level] ?? 'ds-badge--outline'}`}>
                      {program.difficulty_level}
                    </span>
                    <span className="ds-badge ds-badge--outline">
                      {program.duration_days} days
                    </span>
                    {isCompleted && (
                      <span className="ds-badge ds-badge--green">Completed</span>
                    )}
                    {isEnrolled && !isCompleted && (
                      <span className="ds-badge ds-badge--amber">Active</span>
                    )}
                  </div>

                  <h3 className="icbt-card__title">{program.title}</h3>
                  <p className="icbt-card__desc">{program.description}</p>

                  {isEnrolled && my && (
                    <div className="icbt-card__progress">
                      <div className="icbt-card__progress-header">
                        <span className="icbt-card__progress-label">Progress</span>
                        <span className="icbt-card__progress-pct">{my.progress_percent}%</span>
                      </div>
                      <div className="icbt-card__progress-bar">
                        <div
                          className="icbt-card__progress-fill"
                          style={{ width: `${my.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="icbt-card__footer">
                  <a
                    href={program.url}
                    target="_blank"
                    rel="noreferrer"
                    className="icbt-card__link"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Preview
                  </a>

                  {!isEnrolled && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEnroll(program.id)}
                      disabled={enrolling === program.id}
                    >
                      {enrolling === program.id ? <span className="btn-spinner" /> : null}
                      {enrolling === program.id ? 'Enrolling...' : 'Enroll'}
                    </button>
                  )}

                  {isEnrolled && !isCompleted && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                    >
                      Continue
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IcbtPage;
