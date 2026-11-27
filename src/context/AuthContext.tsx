import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  adminConfigured: boolean;
  authLoading: boolean;
  authError: string | null;
  getToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Manages Firebase Authentication state in React memory (never localStorage)
 * and verifies with the Express backend whether the signed-in user is authorized as admin.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminConfigured, setAdminConfigured] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifySessionWithServer = useCallback(async (firebaseUser: User | null) => {
    try {
      const headers: Record<string, string> = {};
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/session', { headers });
      if (!response.ok) {
        setIsAdmin(false);
        return { isAdmin: false, adminConfigured: true };
      }

      const data = (await response.json()) as {
        isAdmin?: boolean;
        adminConfigured?: boolean;
      };
      const configured =
        typeof data.adminConfigured === 'boolean' ? data.adminConfigured : true;
      const adminOk = Boolean(firebaseUser && data.isAdmin);

      setAdminConfigured(configured);
      setIsAdmin(adminOk);
      return { isAdmin: adminOk, adminConfigured: configured };
    } catch {
      setIsAdmin(false);
      return { isAdmin: false, adminConfigured: true };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      void verifySessionWithServer(firebaseUser);
    });
    return () => unsubscribe();
  }, [verifySessionWithServer]);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const session = await verifySessionWithServer(result.user);
      if (!session.isAdmin) {
        if (!session.adminConfigured) {
          setAuthError(
            'Admin access is locked because ADMIN_UID or ADMIN_EMAIL is not configured on the server.'
          );
        } else {
          setAuthError(
            `Signed in as ${result.user.email ?? 'this account'}, which does not match the configured admin account.`
          );
        }
      }
      return session.isAdmin;
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('popup-closed-by-user')
          ? 'Sign-in popup was closed before completing.'
          : 'Could not complete Google Sign-In. Please try again.';
      setAuthError(message);
      return false;
    }
  }, [verifySessionWithServer]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminConfigured,
        authLoading,
        authError,
        getToken,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
}
