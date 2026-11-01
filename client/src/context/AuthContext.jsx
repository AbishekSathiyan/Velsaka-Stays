
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  onAuthStateChanged,
  signOut,
  reload,
} from "firebase/auth";

import { auth } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ======================================
// AUTH PROVIDER
// ======================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ======================================
  // SYNC FIREBASE USER WITH MONGODB
  // ======================================

  const syncUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      return null;
    }

    if (!API_URL) {
      throw new Error("Backend API URL is not configured.");
    }

    await reload(firebaseUser);

    const token = await firebaseUser.getIdToken(true);

    const response = await fetch(`${API_URL}/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: firebaseUser.displayName || "",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to synchronize user."
      );
    }

    return result.data.user;
  }, []);

  // ======================================
  // AUTH STATE LISTENER
  // ======================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setAuthError(null);

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const mongoUser = await syncUser(firebaseUser);

          setUser({
            ...mongoUser,
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
          });
        } catch (error) {
          console.error("Auth synchronization error:", error);

          setUser(null);
          setAuthError(error.message);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [syncUser]);

  // ======================================
  // LOGOUT
  // ======================================

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAuthError(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // ======================================
  // REFRESH USER
  // ======================================

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      setUser(null);
      return null;
    }

    try {
      const mongoUser = await syncUser(firebaseUser);

      const updatedUser = {
        ...mongoUser,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      };

      setUser(updatedUser);
      setAuthError(null);

      return updatedUser;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // ======================================
  // CONTEXT VALUE
  // ======================================

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ======================================
// CUSTOM AUTH HOOK
// ======================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
