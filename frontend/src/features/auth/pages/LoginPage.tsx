import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { LoginRequest } from '@shared/types';

import { useLogin } from '../hooks/useLogin';

const LoginPage = () => {
  const { mutate: login, isPending, error } = useLogin();
  const [searchParams] = useSearchParams();

  const registered = searchParams.get('registered') === 'true';
  const prefillEmail = searchParams.get('email') ?? '';

  const [form, setForm] = useState<LoginRequest>({
    email: prefillEmail,
    password: '',
  });

  const set = (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(form);
  };

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Login failed. Try again.' : null;

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <div className="auth-page__panel-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <h2 className="auth-page__panel-title">MindBridge</h2>
        <p className="auth-page__panel-sub">
          Your safe space for mental wellness. Access personalized support, connect with professionals, and build resilience — one step at a time.
        </p>
        <div className="auth-page__panel-features">
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            Personalized iCBT programmes
          </div>
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            Anonymous community support
          </div>
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            Connect with health professionals
          </div>
        </div>

        <div className="auth-page__panel-illustration">
          <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="110" rx="80" ry="8" fill="rgba(255,255,255,0.1)" />
            <path d="M60 90 Q70 60, 100 55 Q130 60, 140 90" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
            <circle cx="100" cy="45" r="20" fill="rgba(255,255,255,0.15)" />
            <path d="M92 42 Q100 50, 108 42" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="93" cy="38" r="2" fill="rgba(255,255,255,0.5)" />
            <circle cx="107" cy="38" r="2" fill="rgba(255,255,255,0.5)" />
            <path d="M50 75 L55 70 L60 75" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <path d="M140 75 L145 70 L150 75" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
            <circle cx="40" cy="50" r="3" fill="rgba(255,255,255,0.15)" />
            <circle cx="160" cy="55" r="4" fill="rgba(255,255,255,0.15)" />
            <circle cx="155" cy="35" r="2" fill="rgba(255,255,255,0.1)" />
            <circle cx="45" cy="70" r="2" fill="rgba(255,255,255,0.1)" />
          </svg>
        </div>
      </div>

      <div className="auth-page__form-side">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Welcome back</h1>
            <p className="auth-card__subtitle">
              Don't have an account?{' '}
              <Link to="/signup">Create one</Link>
            </p>
          </div>

          {registered && (
            <div className="alert alert--success" role="status">
              Account created! Sign in to get started.
            </div>
          )}

          {errorMessage && (
            <div className="alert alert--error" role="alert">
              {errorMessage}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="input-wrapper">
              <label className="input-label" htmlFor="email">
                Email address
              </label>
              <div className="input-container">
                <input
                  id="email"
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="password">
                Password
              </label>
              <div className="input-container">
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-form__submit"
              disabled={isPending}
            >
              {isPending ? <span className="btn-spinner" /> : null}
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
