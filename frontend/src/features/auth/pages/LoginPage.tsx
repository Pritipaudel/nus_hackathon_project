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
    <div className="auth-page" id="login-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">
            Your safe space is waiting for you.
          </p>
        </div>

        {registered && (
          <div className="alert alert--success" role="status">
            Your account is ready. Sign in to begin your journey.
          </div>
        )}

        {errorMessage && (
          <div className="alert alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="input-wrapper">
            <label className="input-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-wrapper">
            <label className="input-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-form__submit"
            disabled={isPending}
            id="login-submit"
          >
            {isPending ? <span className="btn-spinner" /> : null}
            {isPending ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <p className="auth-card__footer-text">
          Don't have an account?{' '}
          <Link to="/signup">Begin your journey</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
