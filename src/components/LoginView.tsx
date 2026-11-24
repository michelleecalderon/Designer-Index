import { useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginViewProps {
  onNavigateHome: () => void;
}

/**
 * Hidden /login view (intentionally unlinked from the public header)
 * so only the configured admin email can unlock private entries and CRUD actions.
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white border border-[#E5E5E5] rounded-xl p-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[#737373] mb-2">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Curator Access</span>
        </div>

        <h1 className="font-display text-xl font-semibold tracking-tight text-[#111111] mb-2">
          Admin Sign-In
        </h1>

        <p className="text-sm text-[#525252] leading-relaxed mb-6">
          Sign in with your authorized Google account to view private entries and manage the directory.
        </p>

        {authError && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] leading-relaxed"
          >
            {authError}
          </div>
        )}

        {authLoading ? (
          <div className="h-10 w-full rounded-lg bg-[#F5F5F5] animate-pulse" />
        ) : user && isAdmin ? (
          <div className="space-y-3">
            <p className="text-xs text-[#525252]">
              Signed in as <span className="font-medium text-[#111111]">{user.email}</span>
            </p>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 text-sm font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Open Curator Directory
            </button>
            <button
              type="button"
              onClick={signOut}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-[#525252] hover:text-[#111111] border border-[#E5E5E5] rounded-lg transition-colors cursor-pointer"
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
              className="w-full py-2.5 px-4 text-sm font-medium bg-[#111111] text-[#FAFAFA] rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing in…' : 'Continue with Google'}
            </button>

            {user && !isAdmin && (
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2 px-4 text-xs font-medium text-[#525252] hover:text-[#111111] border border-[#E5E5E5] rounded-lg transition-colors cursor-pointer"
              >
                Sign out of {user.email}
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2 px-4 text-xs font-medium text-[#737373] hover:text-[#111111] transition-colors cursor-pointer"
            >
              Back to Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
