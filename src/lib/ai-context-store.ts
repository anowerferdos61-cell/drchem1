/**
 * Tiny global store for AI assistant context.
 * Each lab publishes its live state; the global LabAIAssistant subscribes.
 */
import { useSyncExternalStore } from "react";
import type { AIContext } from "@/components/lab/types";

const DEFAULT: AIContext = {
  experimentId: "none",
  mode: "guide",
  currentStep: 0,
  mistakesMade: [],
};

let state: AIContext = DEFAULT;
const listeners = new Set<() => void>();

export function setAIContext(next: AIContext) {
  state = next;
  listeners.forEach((l) => l());
}

export function getAIContext(): AIContext {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAIContext(): AIContext {
  return useSyncExternalStore(subscribe, getAIContext, getAIContext);
}
