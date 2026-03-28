import { useSearchParams } from 'react-router-dom';

import { useAuthStore } from '@shared/stores/authStore';

import { useCompleteOnboarding } from '@features/auth/hooks/useCompleteOnboarding';
import { useMe } from '@features/auth/hooks/useMe';

const DashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('isOnboarding') === 'true';

  useMe();

  const { mutate: completeOnboarding, isPending: isCompleting } = useCompleteOnboarding();

  const handleSignOut = () => {
    clearAuth();
    window.location.replace('/login');
  };

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : '?';

  const joinedDate = user
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__logo">N</div>
          <span className="topbar__name">NUS Hackathon</span>
        </div>
        <div className="topbar__right">
          {user && (
            <span className="topbar__user">
              {user.first_name} {user.last_name}
            </span>
          )}
          <button className="topbar__signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-body">
        <div className="dashboard-inner">

          {isOnboarding && (
            <div className="onboarding-banner">
              <div className="onboarding-banner__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="onboarding-banner__body">
                <p className="onboarding-banner__title">Welcome to NUS Hackathon 2026!</p>
                <p className="onboarding-banner__desc">
                  Your account is all set. Explore the dashboard and start building.
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm onboarding-banner__btn"
                onClick={() => completeOnboarding()}
                disabled={isCompleting}
              >
                {isCompleting ? <span className="btn-spinner" /> : null}
                {isCompleting ? 'Saving...' : 'Get started'}
              </button>
            </div>
          )}

          <div className="dashboard-welcome">
            <div className="dashboard-welcome__text">
              <h1>Welcome back, {user?.first_name ?? 'there'}</h1>
              <p>You are signed in as <strong>{user?.email}</strong></p>
            </div>
            <div className="dashboard-welcome__avatar">{initials}</div>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <p className="dashboard-card__label">Account Status</p>
              <p className="dashboard-card__value dashboard-card__value--green">
                {user?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="dashboard-card">
              <p className="dashboard-card__label">Onboarding</p>
              <p className={`dashboard-card__value${user?.is_onboarded ? ' dashboard-card__value--green' : ''}`}>
                {user?.is_onboarded ? 'Completed' : 'Pending'}
              </p>
            </div>
            <div className="dashboard-card">
              <p className="dashboard-card__label">Email</p>
              <p className="dashboard-card__value">{user?.email ?? '—'}</p>
            </div>
            <div className="dashboard-card">
              <p className="dashboard-card__label">Member Since</p>
              <p className="dashboard-card__value">{joinedDate}</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
