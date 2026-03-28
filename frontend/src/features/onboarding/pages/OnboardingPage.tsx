import { useState } from 'react';

import { useAuthStore } from '@shared/stores/authStore';

import { useCompleteOnboarding } from '@features/auth/hooks/useCompleteOnboarding';

const CULTURAL_BACKGROUNDS = [
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

const CBT_GOALS = [
  'Understand and challenge negative thoughts',
  'Build healthier daily habits',
  'Manage stress and anxiety better',
  'Improve sleep quality',
  'Strengthen relationships',
  'Increase self-confidence',
];

const EXPERIENCE_LEVELS = [
  {
    id: 'new',
    label: 'New to therapy',
    desc: 'I have never tried therapy or CBT before',
  },
  {
    id: 'some',
    label: 'Some experience',
    desc: 'I have tried therapy or self-help resources before',
  },
  {
    id: 'experienced',
    label: 'Experienced',
    desc: 'I have done CBT or structured therapy programs',
  },
];

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { title: 'Welcome', subtitle: "Let's personalise your mental health journey" },
  { title: 'Your background', subtitle: 'Cultural context helps us tailor your experience' },
  { title: 'What brings you here?', subtitle: 'Select all areas you would like to work on' },
  { title: 'Your goals', subtitle: 'What would you most like to achieve?' },
  { title: 'Your experience', subtitle: 'How familiar are you with CBT or therapy?' },
];

const OnboardingPage = () => {
  const user = useAuthStore((s) => s.user);
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  const [step, setStep] = useState<Step>(0);
  const [cultural, setCultural] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState('');

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;
  const currentStep = STEPS[step] as { title: string; subtitle: string };

  const toggleConcern = (id: string) =>
    setConcerns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const canProceed = (): boolean => {
    if (step === 1) return cultural !== '';
    if (step === 2) return concerns.length > 0;
    if (step === 3) return goals.length > 0;
    if (step === 4) return experience !== '';
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
    <div className="onboarding-shell">
      <header className="onboarding-header">
        <div className="onboarding-header__brand">
          <div className="onboarding-header__logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="onboarding-header__name">MindBridge</span>
        </div>
        <span className="onboarding-header__step">
          {step + 1} / {STEPS.length}
        </span>
      </header>

      <main className="onboarding-body">
        <div className="onboarding-card">
          <div className="onboarding-progress">
            <div className="onboarding-progress__bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="onboarding-content">

            {step === 0 && (
              <div className="onboarding-welcome">
                <div className="onboarding-welcome__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h1 className="onboarding-welcome__title">
                  Hi {user?.first_name ?? 'there'}, you took a brave step.
                </h1>
                <p className="onboarding-welcome__desc">
                  MindBridge uses evidence-based <strong>iCBT (inference-based Cognitive Behavioural Therapy)</strong> to help you understand your thoughts, feelings, and behaviours — at your own pace, in a way that feels culturally relevant to you.
                </p>
                <div className="onboarding-welcome__pillars">
                  <div className="onboarding-pillar">CBT-based</div>
                  <div className="onboarding-pillar">Culturally aware</div>
                  <div className="onboarding-pillar">Private &amp; safe</div>
                </div>
                <p className="onboarding-welcome__note">
                  This takes about 2 minutes. Your answers help personalise your programme.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="onboarding-section">
                <div className="onboarding-section__header">
                  <h2 className="onboarding-section__title">{currentStep.title}</h2>
                  <p className="onboarding-section__sub">{currentStep.subtitle}</p>
                </div>
                <p className="onboarding-section__hint">
                  Cultural values and social expectations can shape how we experience stress and mental health. Sharing your background helps us frame content in a way that resonates with you.
                </p>
                <div className="onboarding-list">
                  {CULTURAL_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className={`onboarding-list__item${cultural === bg ? ' onboarding-list__item--selected' : ''}`}
                      onClick={() => setCultural(bg)}
                    >
                      <span className="onboarding-list__check">
                        {cultural === bg && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-section">
                <div className="onboarding-section__header">
                  <h2 className="onboarding-section__title">{currentStep.title}</h2>
                  <p className="onboarding-section__sub">{currentStep.subtitle}</p>
                </div>
                <div className="onboarding-concerns">
                  {CONCERNS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`onboarding-concern${concerns.includes(c.id) ? ' onboarding-concern--selected' : ''}`}
                      onClick={() => toggleConcern(c.id)}
                    >
                      <span className="onboarding-concern__label">{c.label}</span>
                      {concerns.includes(c.id) && (
                        <span className="onboarding-concern__tick">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="onboarding-section">
                <div className="onboarding-section__header">
                  <h2 className="onboarding-section__title">{currentStep.title}</h2>
                  <p className="onboarding-section__sub">{currentStep.subtitle}</p>
                </div>
                <div className="onboarding-goals">
                  {CBT_GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`onboarding-goal${goals.includes(g) ? ' onboarding-goal--selected' : ''}`}
                      onClick={() => toggleGoal(g)}
                    >
                      <span className="onboarding-goal__dot" />
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="onboarding-section">
                <div className="onboarding-section__header">
                  <h2 className="onboarding-section__title">{currentStep.title}</h2>
                  <p className="onboarding-section__sub">{currentStep.subtitle}</p>
                </div>
                <div className="onboarding-experience">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`onboarding-exp-card${experience === lvl.id ? ' onboarding-exp-card--selected' : ''}`}
                      onClick={() => setExperience(lvl.id)}
                    >
                      <div className="onboarding-exp-card__radio">
                        {experience === lvl.id && <div className="onboarding-exp-card__radio-dot" />}
                      </div>
                      <div>
                        <p className="onboarding-exp-card__label">{lvl.label}</p>
                        <p className="onboarding-exp-card__desc">{lvl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="onboarding-section__hint" style={{ marginTop: '16px' }}>
                  There are no right or wrong answers. This only helps us adjust the depth of our content for you.
                </p>
              </div>
            )}

          </div>

          <div className="onboarding-actions">
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
              className="btn btn-primary btn-md onboarding-actions__next"
              onClick={handleNext}
              disabled={!canProceed() || isPending}
            >
              {isPending ? <span className="btn-spinner" /> : null}
              {isPending ? 'Saving...' : isLast ? 'Start my journey' : 'Continue'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;
