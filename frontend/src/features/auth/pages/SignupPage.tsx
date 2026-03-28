import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { SignupRequest } from '@shared/types';

import { useSignup } from '../hooks/useSignup';

const SignupPage = () => {
  const { mutate: signup, isPending, error } = useSignup();

  const [form, setForm] = useState<SignupRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  const set = (field: keyof SignupRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signup(form);
  };

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Signup failed. Try again.' : null;

  return (
    <div className="auth-page" id="signup-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title">Begin your journey</h1>
          <p className="auth-card__subtitle">
            A few simple steps to your safe space.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__row">
            <div className="input-wrapper">
              <label className="input-label" htmlFor="signup-first-name">
                First name
              </label>
              <input
                id="signup-first-name"
                className="input-field"
                type="text"
                placeholder="Jane"
                value={form.first_name}
                onChange={set('first_name')}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="signup-last-name">
                Last name
              </label>
              <input
                id="signup-last-name"
                className="input-field"
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={set('last_name')}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="input-wrapper">
            <label className="input-label" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
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
            <label className="input-label" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              className="input-field"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-form__submit"
            disabled={isPending}
            id="signup-submit"
          >
            {isPending ? <span className="btn-spinner" /> : null}
            {isPending ? 'Creating your space…' : 'Start my journey'}
          </button>
        </form>

        <p className="auth-card__footer-text">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
