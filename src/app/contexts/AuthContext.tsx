import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from "../../utils/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;

    if (!isSupabaseConfigured() || !client) {
      setError(getSupabaseConfigError());
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    error,
    signIn: async (email: string, password: string) => {
      const client = supabase;
      if (!isSupabaseConfigured() || !client) {
        throw new Error(getSupabaseConfigError());
      }

      setError(null);
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        throw signInError;
      }
    },
    updatePassword: async (password: string) => {
      const client = supabase;
      if (!client) {
        throw new Error(getSupabaseConfigError());
      }

      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
    },
    signOut: async () => {
      const client = supabase;
      if (!client) {
        setSession(null);
        return;
      }

      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
      setSession(null);
    },
  }), [error, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
