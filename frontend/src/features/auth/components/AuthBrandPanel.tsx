import type { ReactNode } from 'react';

type AuthBrandPanelProps = {
  title: string;
  tagline: ReactNode;
  children?: ReactNode;
};

const HeartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const LotusFlourish = () => (
  <div className="auth-page__panel-flourish" aria-hidden>
    <svg className="auth-page__panel-lotus" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="38" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="24" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.75" />
      <path
        d="M60 28c-8 12-8 24 0 36 8-12 8-24 0-36zM38 52c14 4 24 14 22 28-14-4-24-14-22-28zM82 52c-14 4-24 14-22 28 14-4 24-14 22-28zM48 78c6 10 18 14 12 22-6-10-18-14-12-22zM72 78c-6 10-18 14-12 22 6-10 18-14 12-22z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  </div>
);

export function AuthBrandPanel({ title, tagline, children }: AuthBrandPanelProps) {
  return (
    <div className="auth-page__panel">
      <div className="auth-page__panel-inner">
        <div className="auth-page__panel-icon-ring">
          <HeartIcon />
        </div>
        <h2 className="auth-page__panel-title">{title}</h2>
        <p className="auth-page__panel-tagline">{tagline}</p>
        {children}
      </div>
      <LotusFlourish />
    </div>
  );
}
