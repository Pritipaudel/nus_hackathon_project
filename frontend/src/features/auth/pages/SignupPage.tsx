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
        <div className="auth-page__panel-hero">
          {/* Floating smiley faces */}
          <div className="auth-smiley auth-smiley--1">
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" fill="rgba(255,255,255,0.15)" />
              <circle cx="20" cy="24" r="3" fill="rgba(255,255,255,0.5)" />
              <circle cx="40" cy="24" r="3" fill="rgba(255,255,255,0.5)" />
              <path d="M18 38 Q30 48 42 38" stroke="rgba(255,255,255,0.5)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="auth-smiley auth-smiley--2">
            <svg viewBox="0 0 50 50" fill="none">
              <circle cx="25" cy="25" r="23" fill="rgba(255,255,255,0.12)" />
              <circle cx="17" cy="20" r="2.5" fill="rgba(255,255,255,0.4)" />
              <circle cx="33" cy="20" r="2.5" fill="rgba(255,255,255,0.4)" />
              <path d="M15 32 Q25 40 35 32" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="auth-smiley auth-smiley--3">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.1)" />
              <circle cx="14" cy="16" r="2" fill="rgba(255,255,255,0.35)" />
              <circle cx="26" cy="16" r="2" fill="rgba(255,255,255,0.35)" />
              <path d="M12 26 Q20 33 28 26" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          
          <div className="auth-page__panel-brand">
            <h1 className="auth-page__panel-title">MindBridge</h1>
            <p className="auth-page__panel-slogan">Begin your journey</p>
          </div>

          <div className="auth-page__panel-visual">
            <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Peaceful landscape */}
              <path d="M0 180 Q80 140 160 160 Q240 180 320 150 L320 220 L0 220 Z" fill="rgba(255,255,255,0.08)" />
              <path d="M0 200 Q100 170 200 190 Q280 200 320 180 L320 220 L0 220 Z" fill="rgba(255,255,255,0.05)" />
              
              {/* Sun/Moon */}
              <circle cx="260" cy="60" r="35" fill="rgba(255,255,255,0.15)" />
              <circle cx="260" cy="60" r="28" fill="rgba(255,255,255,0.1)" />
              
              {/* Trees */}
              <g transform="translate(60, 130)">
                <ellipse cx="0" cy="0" rx="20" ry="35" fill="rgba(255,255,255,0.12)" />
                <rect x="-3" y="30" width="6" height="25" fill="rgba(255,255,255,0.1)" />
              </g>
              <g transform="translate(100, 145)">
                <ellipse cx="0" cy="0" rx="15" ry="28" fill="rgba(255,255,255,0.1)" />
                <rect x="-2" y="25" width="4" height="20" fill="rgba(255,255,255,0.08)" />
              </g>
              <g transform="translate(240, 140)">
                <ellipse cx="0" cy="0" rx="18" ry="32" fill="rgba(255,255,255,0.11)" />
                <rect x="-3" y="28" width="6" height="22" fill="rgba(255,255,255,0.09)" />
              </g>

              {/* Birds */}
              <path d="M140 50 Q145 45 150 50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M160 40 Q165 35 170 40" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M180 55 Q184 51 188 55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Stars/sparkles */}
              <circle cx="50" cy="40" r="2" fill="rgba(255,255,255,0.3)">
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="120" cy="25" r="1.5" fill="rgba(255,255,255,0.25)">
                <animate attributeName="opacity" values="0.25;0.5;0.25" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="35" r="2" fill="rgba(255,255,255,0.2)">
                <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="300" cy="100" r="1.5" fill="rgba(255,255,255,0.25)">
                <animate attributeName="opacity" values="0.25;0.5;0.25" dur="5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>
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
