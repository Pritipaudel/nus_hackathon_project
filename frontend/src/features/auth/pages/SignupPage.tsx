import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { SignupRequest, UserRole } from '@shared/types';

import { useSignup } from '../hooks/useSignup';
import { AuthBrandPanel } from '../components/AuthBrandPanel';

const SignupPage = () => {
  const { mutate: signup, isPending, error } = useSignup();

  const [form, setForm] = useState<SignupRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'USER_PATIENT',
  });

  const set = (field: keyof SignupRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setRole = (role: UserRole) => setForm((prev) => ({ ...prev, role }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signup(form);
  };

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Signup failed. Try again.' : null;

  return (
    <div className="auth-page">
      <AuthBrandPanel
        title="MindBridge"
        tagline={<>Create your account and begin your care journey</>}
      />

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
                <label className="input-label" htmlFor="first_name">First name</label>
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
                <label className="input-label" htmlFor="last_name">Last name</label>
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
              <label className="input-label" htmlFor="email">Email address</label>
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
              <label className="input-label" htmlFor="password">Password</label>
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

            <div className="input-wrapper">
              <label className="input-label">I am joining as</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-option ${form.role === 'USER_PATIENT' ? 'role-option--active' : ''}`}
                  onClick={() => setRole('USER_PATIENT')}
                >
                  <span className="role-option__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <div className="role-option__body">
                    <span className="role-option__title">Patient</span>
                    <span className="role-option__desc">Access iCBT programmes and community support</span>
                  </div>
                  <span className="role-option__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </button>

                <button
                  type="button"
                  className={`role-option ${form.role === 'USER_HEALTH_WORKER' ? 'role-option--active' : ''}`}
                  onClick={() => setRole('USER_HEALTH_WORKER')}
                >
                  <span className="role-option__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </span>
                  <div className="role-option__body">
                    <span className="role-option__title">Health Worker</span>
                    <span className="role-option__desc">Manage patients, meetings, and community oversight</span>
                  </div>
                  <span className="role-option__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </button>
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
