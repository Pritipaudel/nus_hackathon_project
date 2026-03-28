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
        <div className="auth-page__panel-logo">N</div>
        <h2 className="auth-page__panel-title">NUS Hackathon 2026</h2>
        <p className="auth-page__panel-sub">
          Sign in to access your dashboard and manage your hackathon project.
        </p>
        <div className="auth-page__panel-features">
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            JWT-secured authentication
          </div>
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            Guided onboarding flow
          </div>
          <div className="auth-page__panel-feature">
            <span className="auth-page__panel-feature-dot" />
            Real-time backend health
          </div>
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
