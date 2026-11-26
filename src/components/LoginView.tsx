import { useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginViewProps {
  onNavigateHome: () => void;
}

/**
 * Hidden /login view (intentionally unlinked from the public header)
 * styled with the warm neutral ramp, #1F1B16 primary buttons, and #DC2626 errors.
 */
export function LoginView({ onNavigateHome }: LoginViewProps) {
  const { user, isAdmin, authLoading, authError, signInWithGoogle, signOut } =
    useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setSubmitting(true);
    const ok = await signInWithGoogle();
    setSubmitting(false);
    if (ok) {
      onNavigateHome();
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-card border border-hairline rounded-xl p-8">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted mb-2">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Curator Access</span>
        </div>

        <h1 className="font-display text-xl font-semibold tracking-tight text-ink mb-2">
          Admin Sign-In
        </h1>

        <p className="text-sm text-ink-secondary leading-relaxed mb-6">
          Sign in with your authorized Google account to view private entries and manage the directory.
        </p>

        {authError && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-danger/8 border border-danger/30 text-xs text-danger leading-relaxed"
          >
            {authError}
          </div>
        )}

        {authLoading ? (
          <div className="h-10 w-full rounded-lg bg-raised animate-pulse" />
        ) : user && isAdmin ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-secondary">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
            </p>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 text-sm font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors cursor-pointer"
            >
              Open Curator Directory
            </button>
            <button
              type="button"
              onClick={signOut}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-ink-secondary hover:text-ink border border-hairline bg-card rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-medium bg-ink text-card rounded-lg hover:bg-ink-secondary transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing in…' : 'Continue with Google'}
            </button>

            {user && !isAdmin && (
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2 px-4 text-xs font-medium text-ink-secondary hover:text-ink border border-hairline bg-card rounded-lg transition-colors cursor-pointer"
              >
                Sign out of {user.email}
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2 px-4 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Back to Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
