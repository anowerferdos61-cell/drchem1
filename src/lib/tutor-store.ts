/**
 * Tutor chat store — conversations + messages, persisted to localStorage.
 * Lightweight pub/sub via useSyncExternalStore (no external dep).
 */
import { useSyncExternalStore } from "react";
import { nanoid } from "nanoid";

export type TutorRole = "user" | "assistant";

export interface TutorSource {
  page?: number | null;
  chapter?: string | null;
  source?: string | null;
  similarity?: number;
}

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  createdAt: number;
  sources?: TutorSource[];
  streaming?: boolean;
}

export interface TutorConversation {
  id: string;
  title: string;
  mode: "general" | "book";
  messages: TutorMessage[];
  createdAt: number;
  updatedAt: number;
}

interface TutorState {
  conversations: TutorConversation[];
  activeId: string | null;
  ragMode: boolean;
}

const STORAGE_KEY = "chem-tutor:v1";

function load(): TutorState {
  if (typeof window === "undefined") {
    return { conversations: [], activeId: null, ragMode: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], activeId: null, ragMode: false };
    const parsed = JSON.parse(raw) as TutorState;
    return {
      conversations: parsed.conversations ?? [],
      activeId: parsed.activeId ?? null,
      ragMode: !!parsed.ragMode,
    };
  } catch {
    return { conversations: [], activeId: null, ragMode: false };
  }
}

let state: TutorState = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTutorState(): TutorState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function getState(): TutorState {
  return state;
}

// ---------- mutations ----------

export function newConversation(title = "নতুন চ্যাট"): TutorConversation {
  const now = Date.now();
  const convo: TutorConversation = {
    id: nanoid(10),
    title,
    mode: state.ragMode ? "book" : "general",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  state = {
    ...state,
    conversations: [convo, ...state.conversations],
    activeId: convo.id,
  };
  emit();
  return convo;
}

export function selectConversation(id: string) {
  state = { ...state, activeId: id };
  emit();
}

export function renameConversation(id: string, title: string) {
  state = {
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
    ),
  };
  emit();
}

export function deleteConversation(id: string) {
  const remaining = state.conversations.filter((c) => c.id !== id);
  state = {
    ...state,
    conversations: remaining,
    activeId: state.activeId === id ? (remaining[0]?.id ?? null) : state.activeId,
  };
  emit();
}

export function setRagMode(on: boolean) {
  state = { ...state, ragMode: on };
  emit();
}

function patchConvo(id: string, patch: (c: TutorConversation) => TutorConversation) {
  state = {
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? patch(c) : c)),
  };
  emit();
}

export function appendMessage(
  convoId: string,
  msg: Omit<TutorMessage, "id" | "createdAt"> & { id?: string },
): TutorMessage {
  const m: TutorMessage = {
    id: msg.id ?? nanoid(10),
    createdAt: Date.now(),
    ...msg,
  };
  patchConvo(convoId, (c) => ({
    ...c,
    messages: [...c.messages, m],
    updatedAt: Date.now(),
  }));
  return m;
}

export function updateMessage(convoId: string, msgId: string, patch: Partial<TutorMessage>) {
  patchConvo(convoId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
    updatedAt: Date.now(),
  }));
}

export function appendToMessage(convoId: string, msgId: string, delta: string) {
  patchConvo(convoId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === msgId ? { ...m, content: m.content + delta } : m)),
    updatedAt: Date.now(),
  }));
}

export function getActiveConversation(): TutorConversation | null {
  if (!state.activeId) return null;
  return state.conversations.find((c) => c.id === state.activeId) ?? null;
}
