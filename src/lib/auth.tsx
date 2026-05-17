import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "doctor" | "pharmacist";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  role: AppRole | null;
  isActive: boolean;
};

type Ctx = {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

const USERNAME_DOMAIN = "clinic.local";
export const usernameToEmail = (u: string) =>
  u.includes("@") ? u : `${u.trim().toLowerCase()}@${USERNAME_DOMAIN}`;

async function loadProfile(userId: string): Promise<AuthUser | null> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("id,username,full_name,is_active").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    role: (roleRow?.role as AppRole) ?? null,
    isActive: profile.is_active,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => {
          loadProfile(sess.user.id).then(setUser);
        }, 0);
      } else {
        setUser(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) setUser(await loadProfile(data.session.user.id));
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: Ctx["signIn"] = async (username, password) => {
    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "invalid" };
    const profile = await loadProfile(data.user.id);
    if (!profile) return { error: "invalid" };
    if (!profile.isActive) {
      await supabase.auth.signOut();
      return { error: "disabled" };
    }
    setUser(profile);
    // touch last_login_at (best-effort)
    supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", profile.id).then(() => {});
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refresh = async () => {
    if (session?.user) setUser(await loadProfile(session.user.id));
  };

  return (
    <AuthCtx.Provider value={{ session, user, loading, signIn, signOut, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
