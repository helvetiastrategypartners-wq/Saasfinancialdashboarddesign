import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from "../../utils/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  profileLoading: boolean;
  companyId: string | null;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

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

  useEffect(() => {
    const client = supabase;
    const userId = session?.user.id;

    if (!client || !userId) {
      setProfileLoading(false);
      setCompanyId(null);
      setMustChangePassword(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    client
      .from("profiles")
      .select("company_id, must_change_password")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error: profileError }) => {
        if (!active) {
          return;
        }

        if (profileError) {
          setCompanyId(typeof session.user.user_metadata?.company_id === "string" ? session.user.user_metadata.company_id : null);
          setMustChangePassword(Boolean(session.user.user_metadata?.must_change_password));
          setProfileLoading(false);
          return;
        }

        setCompanyId(data?.company_id ?? (typeof session.user.user_metadata?.company_id === "string" ? session.user.user_metadata.company_id : null));
        setMustChangePassword(Boolean(data?.must_change_password ?? session.user.user_metadata?.must_change_password));
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const value = useMemo<AuthContextType>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    error,
    profileLoading,
    companyId,
    mustChangePassword,
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

      const userId = session?.user.id;
      if (!userId) {
        throw new Error("Session introuvable.");
      }

      const { error: profileError } = await client
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", userId);

      if (profileError) {
        setError(profileError.message);
        throw profileError;
      }

      const { data: userData, error: metadataError } = await client.auth.updateUser({
        data: {
          ...(session.user.user_metadata ?? {}),
          must_change_password: false,
        },
      });

      if (metadataError) {
        setError(metadataError.message);
        throw metadataError;
      }

      setSession((currentSession) => currentSession && userData.user
        ? { ...currentSession, user: userData.user }
        : currentSession);
      setMustChangePassword(false);
    },
    signOut: async () => {
      const client = supabase;
      if (!client) {
        setSession(null);
        setCompanyId(null);
        setMustChangePassword(false);
        return;
      }

      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
      setSession(null);
      setProfileLoading(false);
      setCompanyId(null);
      setMustChangePassword(false);
    },
  }), [companyId, error, loading, mustChangePassword, profileLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
