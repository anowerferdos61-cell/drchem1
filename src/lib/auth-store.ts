/**
 * Client-side auth store + hook.
 * Subscribes to Supabase auth state and exposes { user, profile, role, loading }.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "student" | "teacher" | "admin";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  school: string | null;
  class: string | null;
  avatar_url: string | null;
  role_selected: boolean;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoaded: boolean;
}

type Listener = (s: AuthState) => void;

let state: AuthState = { user: null, profile: null, roles: [], loading: true, rolesLoaded: false };
const listeners = new Set<Listener>();
let initialized = false;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

async function loadProfileAndRoles(userId: string) {
  try {
    const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

    if (profileError) console.error(profileError);
    if (rolesError) console.error(rolesError);

    setState({
      profile: profileError ? null : ((profile as Profile | null) ?? null),
      roles: rolesError ? [] : ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role),
      rolesLoaded: true,
    });
  } catch (error) {
    console.error(error);
    setState({ profile: null, roles: [], rolesLoaded: true });
  }
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Listener FIRST so we never miss a session restore
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    setState({ user, loading: false, rolesLoaded: !user });
    if (user) {
      void loadProfileAndRoles(user.id);
    } else {
      setState({ profile: null, roles: [], rolesLoaded: true });
    }
  });

  // Then hydrate
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null;
    setState({ user, loading: false, rolesLoaded: !user });
    if (user) void loadProfileAndRoles(user.id);
  });
}

export function useAuth() {
  initialize();
  const [snap, setSnap] = useState<AuthState>(state);
  useEffect(() => {
    const l: Listener = (s) => setSnap(s);
    listeners.add(l);
    setSnap(state);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, roles: [], loading: false, rolesLoaded: true });
  }, []);

  const hasRole = useCallback(
    (role: AppRole) => snap.roles.includes(role),
    [snap.roles],
  );

  const refreshProfile = useCallback(async () => {
    if (state.user) await loadProfileAndRoles(state.user.id);
  }, []);

  return {
    ...snap,
    isAuthenticated: !!snap.user,
    isTeacher: snap.roles.includes("teacher") || snap.roles.includes("admin"),
    hasRole,
    signOut,
    refreshProfile,
  };
}
