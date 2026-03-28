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
    <div className="auth-page">
      <div className="auth-page__panel">
        <div className="auth-page__panel-logo">N</div>
        <h2 className="auth-page__panel-title">Join NUS Hackathon 2026</h2>
      </div>

      <div className="auth-page__form-side">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Create an account</h1>
            <p className="auth-card__subtitle">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
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
                <label className="input-label" htmlFor="first_name">
                  First name
                </label>
                <div className="input-container">
                  <input
                    id="first_name"
                    className="input-field"
                    type="text"
                    placeholder="Jane"
                    value={form.first_name}
                    onChange={set('first_name')}
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label" htmlFor="last_name">
                  Last name
                </label>
                <div className="input-container">
                  <input
                    id="last_name"
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
            </div>

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
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
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
              {isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
