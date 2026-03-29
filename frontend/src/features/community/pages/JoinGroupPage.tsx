import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthBrandPanel } from '@features/auth/components/AuthBrandPanel';
import { useAcceptGroupInvite, useCommunityInvitePreview } from '@features/community/hooks/useCommunity';
import { useAuthStore } from '@shared/stores/authStore';

const JoinGroupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() ?? '';
  const userIdParam = searchParams.get('user_id');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const previewQuery = useCommunityInvitePreview(token);
  const acceptMut = useAcceptGroupInvite();

  const joinPath = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('token', token);
    if (userIdParam) qs.set('user_id', userIdParam);
    return `/join-group?${qs.toString()}`;
  }, [token, userIdParam]);

  const loginHref = `/login?next=${encodeURIComponent(joinPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(joinPath)}`;

  const handleJoin = () => {
    acceptMut.mutate(token, {
      onSuccess: () => {
        const role = useAuthStore.getState().user?.role;
        navigate(role === 'USER_HEALTH_WORKER' ? '/worker-dashboard' : '/dashboard', {
          replace: true,
        });
      },
    });
  };

  const tokenValid = token.length >= 8;

  return (
    <div className="auth-page">
      <AuthBrandPanel
        title="MindBridge"
        tagline={<>Your journey to inner peace starts here</>}
      >
        {!tokenValid ? (
          <p className="auth-page__panel-sub">We could not open this invite link.</p>
        ) : previewQuery.isError ? (
          <p className="auth-page__panel-sub">This link may have expired or was mistyped.</p>
        ) : previewQuery.data ? (
          <p className="auth-page__panel-sub">
            You’re invited to join{' '}
            <strong style={{ color: '#fff' }}>{previewQuery.data.group_name}</strong>
          </p>
        ) : (
          <p className="auth-page__panel-sub">Loading your invitation…</p>
        )}
      </AuthBrandPanel>

      <div className="auth-page__form-side">
        <div className="auth-card">
          {!tokenValid ? (
            <>
              <div className="auth-card__header">
                <h1 className="auth-card__title">Invalid invite</h1>
                <p className="auth-card__subtitle">This link is missing a valid invite token.</p>
              </div>
              <Link to="/dashboard" className="btn btn-primary btn-lg auth-form__submit">
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="auth-card__header">
                <h1 className="auth-card__title">Community group invite</h1>
                <p className="auth-card__subtitle">
                  Accept to see this group in My Community.
                </p>
              </div>

              {previewQuery.isLoading && <p className="auth-card__subtitle">Loading invite…</p>}

              {previewQuery.isError && (
                <div className="alert alert--error" role="alert">
                  This invite is invalid or has expired.
                </div>
              )}

              {previewQuery.data && (
                <>
                  <p className="auth-card__subtitle" style={{ marginTop: 0 }}>
                    You are invited to join <strong>{previewQuery.data.group_name}</strong>.
                  </p>
                  {previewQuery.data.inviter_display_name && (
                    <p className="auth-card__subtitle">
                      Invited by <strong>{previewQuery.data.inviter_display_name}</strong>
                    </p>
                  )}
                  <p className="ch-member-list__label" style={{ margin: 0 }}>
                    Expires {new Date(previewQuery.data.expires_at).toLocaleString()}
                  </p>

                  {!isAuthenticated ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                      <Link to={loginHref} className="btn btn-primary btn-lg auth-form__submit">
                        Sign in to join
                      </Link>
                      <p className="auth-card__subtitle" style={{ margin: 0, textAlign: 'center' }}>
                        Don&apos;t have an account? <Link to={signupHref}>Create one</Link>
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                      {acceptMut.isError && (
                        <div className="alert alert--error" role="alert">
                          Could not join. You may already be a member, or the invite expired.
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-lg auth-form__submit"
                        disabled={acceptMut.isPending || acceptMut.isSuccess}
                        onClick={handleJoin}
                      >
                        {acceptMut.isPending && <span className="btn-spinner" />}
                        {acceptMut.isSuccess ? 'Joined' : acceptMut.isPending ? 'Joining…' : 'Join group'}
                      </button>
                      {acceptMut.isSuccess && (
                        <p className="auth-card__subtitle" style={{ margin: 0, textAlign: 'center' }}>
                          Redirecting to your dashboard…
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
