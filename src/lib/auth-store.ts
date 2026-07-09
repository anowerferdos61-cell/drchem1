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
  phone: string | null;
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
let profileLoadSeq = 0;
const PROFILE_LOAD_TIMEOUT_MS = 8_000;
const SESSION_LOAD_TIMEOUT_MS = 6_000;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

async function loadProfileAndRoles(userId: string) {
  const seq = ++profileLoadSeq;
  try {
    const profileAndRolesPromise = Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

    const timeoutPromise = new Promise<"timeout">((resolve) => {
      window.setTimeout(() => resolve("timeout"), PROFILE_LOAD_TIMEOUT_MS);
    });

    const result = await Promise.race([profileAndRolesPromise, timeoutPromise]);

    if (seq !== profileLoadSeq || state.user?.id !== userId) return;

    if (result === "timeout") {
      console.warn("Profile/role load timed out; continuing with student access.");
      setState({ profile: null, roles: [], rolesLoaded: true });
      return;
    }

    const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = result;

    if (profileError) console.error(profileError);
    if (rolesError) console.error(rolesError);

    setState({
      profile: profileError ? null : ((profile as Profile | null) ?? null),
      roles: rolesError ? [] : ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role),
      rolesLoaded: true,
    });
  } catch (error) {
    console.error(error);
    if (seq !== profileLoadSeq || state.user?.id !== userId) return;
    setState({ profile: null, roles: [], rolesLoaded: true });
  }
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Listener FIRST so we never miss a session restore
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      const user = session?.user ?? state.user;
      const sameUser = !!user && state.user?.id === user.id;
      setState({
        user,
        loading: false,
        profile: sameUser ? state.profile : null,
        roles: sameUser ? state.roles : [],
        rolesLoaded: user ? (sameUser ? state.rolesLoaded : false) : true,
      });
      if (user && (!sameUser || !state.rolesLoaded)) {
        void loadProfileAndRoles(user.id);
      }
      return;
    }

    const user = session?.user ?? null;
    const sameUser = !!user && state.user?.id === user.id;
    setState({
      user,
      loading: false,
      profile: sameUser ? state.profile : null,
      roles: sameUser ? state.roles : [],
      rolesLoaded: user ? (sameUser ? state.rolesLoaded : false) : true,
    });
    if (user && (!sameUser || !state.rolesLoaded)) {
      void loadProfileAndRoles(user.id);
    } else {
      profileLoadSeq += 1;
      setState({ profile: null, roles: [], rolesLoaded: true });
    }
  });

  // Then hydrate
  const sessionTimeout = window.setTimeout(() => {
    if (!state.loading) return;
    console.warn("Auth session restore timed out; showing signed-out state.");
    profileLoadSeq += 1;
    setState({ user: null, profile: null, roles: [], loading: false, rolesLoaded: true });
  }, SESSION_LOAD_TIMEOUT_MS);

  supabase.auth.getSession().then(({ data }) => {
    window.clearTimeout(sessionTimeout);
    const user = data.session?.user ?? null;
    const sameUser = !!user && state.user?.id === user.id;
    setState({
      user,
      loading: false,
      profile: sameUser ? state.profile : null,
      roles: sameUser ? state.roles : [],
      rolesLoaded: user ? (sameUser ? state.rolesLoaded : false) : true,
    });
    if (user && (!sameUser || !state.rolesLoaded)) void loadProfileAndRoles(user.id);
  }).catch((error) => {
    window.clearTimeout(sessionTimeout);
    console.error(error);
    profileLoadSeq += 1;
    setState({ user: null, profile: null, roles: [], loading: false, rolesLoaded: true });
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
    profileLoadSeq += 1;
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
