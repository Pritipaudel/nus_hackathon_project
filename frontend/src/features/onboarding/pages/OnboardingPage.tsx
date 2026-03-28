import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';

import { useCompleteOnboarding } from '@features/auth/hooks/useCompleteOnboarding';


/* ── Step data ───────────────────────────────── */
const CULTURAL_BACKGROUNDS = [
  'Nepalese',
  'Chinese / Singaporean Chinese',
  'Malay / Singaporean Malay',
  'Indian / Singaporean Indian',
  'Eurasian',
  'Korean',
  'Japanese',
  'Filipino',
  'Indonesian',
  'Western / European',
  'Prefer not to say',
];

const MOOD_OPTIONS = [
  { key: 'low', label: 'Low', desc: 'Struggling most days' },
  { key: 'moderate', label: 'Moderate', desc: 'Some good days, some bad' },
  { key: 'okay', label: 'Okay', desc: 'Getting by' },
  { key: 'good', label: 'Good', desc: 'Mostly positive' },
];

const CONCERNS = [
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'depression', label: 'Depression' },
  { id: 'stress', label: 'Stress & Burnout' },
  { id: 'sleep', label: 'Sleep Issues' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'self_esteem', label: 'Self-Esteem' },
  { id: 'grief', label: 'Grief & Loss' },
  { id: 'trauma', label: 'Trauma' },
];

const COMMUNITY_CONCERNS = [
  { id: 'domestic_violence', label: 'Domestic Violence' },
  { id: 'social_isolation', label: 'Social Isolation' },
  { id: 'cultural_pressure', label: 'Cultural / Family Pressure' },
  { id: 'work_stress', label: 'Work Stress' },
  { id: 'financial_stress', label: 'Financial Stress' },
  { id: 'discrimination', label: 'Discrimination' },
];

const SUPPORT_PREFERENCES = [
  { id: 'self_guided', label: 'Self-guided programmes', desc: 'Work through content at my own pace' },
  { id: 'community', label: 'Community support', desc: 'Connect with others anonymously' },
  { id: 'health_worker', label: 'Health worker sessions', desc: 'Meet with a trained professional' },
  { id: 'all', label: 'All of the above', desc: 'I am open to everything' },
];

const EXPERIENCE_LEVELS = [
  { id: 'new', label: 'New to therapy', desc: 'I have not tried therapy or CBT before' },
  { id: 'some', label: 'Some experience', desc: 'I have tried therapy or self-help resources' },
  { id: 'experienced', label: 'Experienced', desc: 'I have done structured CBT programmes' },
];

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = [
  'Welcome',
  'Background',
  'Mood',
  'Concerns',
  'Community',
  'Support',
];

/* ── Component ───────────────────────────────── */
const OnboardingPage = () => {
  const user = useAuthStore((s) => s.user);
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  const [step, setStep] = useState<Step>(0);
  const [cultural, setCultural] = useState('');
  const [moodLevel, setMoodLevel] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [communityConcerns, setCommunityConcerns] = useState<string[]>([]);
  const [supportPref, setSupportPref] = useState('');
  const [experience, setExperience] = useState('');

  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isLast = step === totalSteps - 1;

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
  ) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const canProceed = (): boolean => {
    if (step === 1) return cultural !== '';
    if (step === 2) return moodLevel !== '';
    if (step === 3) return concerns.length > 0;
    if (step === 4) return communityConcerns.length > 0;
    if (step === 5) return supportPref !== '' && experience !== '';
    return true;
  };


  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  return (
    <div className="ob-shell">
      <header className="ob-header">
        <div className="ob-header__brand">
          <div className="ob-header__logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="ob-header__name">MindBridge</span>
        </div>

        <div className="ob-steps">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`ob-step ${i < step ? 'ob-step--done' : ''} ${i === step ? 'ob-step--active' : ''}`}
            >
              <div className="ob-step__dot">
                {i < step ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="ob-step__label">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="ob-body">
        <div className="ob-card">
          <div className="ob-progress">
            <div className="ob-progress__bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="ob-content">

            {step === 0 && (
              <div className="ob-welcome">
                <div className="ob-welcome__icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h1 className="ob-welcome__title">
                  Hi {user?.first_name ?? 'there'} — you took a brave step.
                </h1>
                <p className="ob-welcome__desc">
                  MindBridge uses <strong>inference-based CBT (iCBT)</strong> to help you work through thoughts, feelings, and daily challenges — at your own pace, in a way that reflects your cultural context.
                </p>
                <div className="ob-welcome__tags">
                  <span className="ob-tag">Evidence-based iCBT</span>
                  <span className="ob-tag">Culturally aware</span>
                  <span className="ob-tag">Anonymous & private</span>
                  <span className="ob-tag">Community supported</span>
                </div>
                <p className="ob-welcome__note">
                  Takes about 2 minutes. Your answers shape your programme — you can update them any time.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="ob-section">
                <div className="ob-section__header">
                  <h2>Your cultural background</h2>
                  <p>Cultural values and social expectations shape how we experience stress and mental health. This helps us frame content in a way that resonates with you.</p>
                </div>
                <div className="ob-list">
                  {CULTURAL_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className={`ob-list__item ${cultural === bg ? 'ob-list__item--selected' : ''}`}
                      onClick={() => setCultural(bg)}
                    >
                      <span className="ob-list__radio">
                        {cultural === bg && <span className="ob-list__radio-dot" />}
                      </span>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="ob-section">
                <div className="ob-section__header">
                  <h2>How have you been feeling lately?</h2>
                  <p>Be honest with yourself — there are no wrong answers here.</p>
                </div>
                <div className="ob-mood-grid">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`ob-mood-card ${moodLevel === m.key ? 'ob-mood-card--selected' : ''}`}
                      onClick={() => setMoodLevel(m.key)}
                    >
                      <span className="ob-mood-card__label">{m.label}</span>
                      <span className="ob-mood-card__desc">{m.desc}</span>
                      {moodLevel === m.key && (
                        <span className="ob-mood-card__tick">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="ob-section">
                <div className="ob-section__header">
                  <h2>What would you like to work on?</h2>
                  <p>Select everything that applies. You can explore other areas later.</p>
                </div>
                <div className="ob-chips">
                  {CONCERNS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`ob-chip ${concerns.includes(c.id) ? 'ob-chip--selected' : ''}`}
                      onClick={() => toggleItem(concerns, setConcerns, c.id)}
                    >
                      {concerns.includes(c.id) && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="ob-section">
                <div className="ob-section__header">
                  <h2>Community context</h2>
                  <p>Are any of these broader issues affecting your wellbeing? Select all that apply.</p>
                </div>
                <div className="ob-hint">
                  These are community-level stressors that iCBT programmes often overlook. Your response helps us tailor content and connect you with relevant support.
                </div>
                <div className="ob-chips">
                  {COMMUNITY_CONCERNS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`ob-chip ${communityConcerns.includes(c.id) ? 'ob-chip--selected' : ''}`}
                      onClick={() => toggleItem(communityConcerns, setCommunityConcerns, c.id)}
                    >
                      {communityConcerns.includes(c.id) && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="ob-section">
                <div className="ob-section__header">
                  <h2>How would you like support?</h2>
                  <p>Choose what feels right for you right now.</p>
                </div>

                <div className="ob-radio-group">
                  {SUPPORT_PREFERENCES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`ob-radio-card ${supportPref === s.id ? 'ob-radio-card--selected' : ''}`}
                      onClick={() => setSupportPref(s.id)}
                    >
                      <div className="ob-radio-card__dot-wrap">
                        <div className="ob-radio-card__dot">
                          {supportPref === s.id && <div className="ob-radio-card__dot-inner" />}
                        </div>
                      </div>
                      <div>
                        <p className="ob-radio-card__label">{s.label}</p>
                        <p className="ob-radio-card__desc">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="ob-section__subheader">
                  <h3>Your experience with therapy</h3>
                  <p>This only adjusts the depth of our content — no wrong answer.</p>
                </div>
                <div className="ob-radio-group">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`ob-radio-card ${experience === lvl.id ? 'ob-radio-card--selected' : ''}`}
                      onClick={() => setExperience(lvl.id)}
                    >
                      <div className="ob-radio-card__dot-wrap">
                        <div className="ob-radio-card__dot">
                          {experience === lvl.id && <div className="ob-radio-card__dot-inner" />}
                        </div>
                      </div>
                      <div>
                        <p className="ob-radio-card__label">{lvl.label}</p>
                        <p className="ob-radio-card__desc">{lvl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="ob-actions">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className={`btn btn-primary btn-md ob-actions__next${!canProceed() ? ' ob-actions__next--dim' : ''}`}
              onClick={handleNext}
              disabled={!canProceed() || isPending}
            >
              {isPending && <span className="btn-spinner" />}
              {isPending ? 'Saving...' : isLast ? 'Start my journey' : 'Continue'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;
