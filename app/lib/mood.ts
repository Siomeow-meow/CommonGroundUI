import { MoodEntry, MoodLevel, EmotionScore } from "@/app/types/mood";

// ── Storage ──────────────────────────────────────────────────────────────
// No backend table exists for mood check-ins yet, so entries are kept in
// localStorage per browser, namespaced per user. Swap this file's guts for
// real /api/proxy/mood calls once that table exists — the function
// signatures below are written so callers (the page/components) won't need
// to change.

function storageKey(userId: string) {
  return `mood-entries:${userId}`;
}

export function getMoodEntries(userId: string): MoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setMoodEntries(userId: string, entries: MoodEntry[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(entries));
  } catch {
    // storage full or unavailable — silently no-op, matches other
    // localStorage usage in this app (see savedIds)
  }
}

export function saveMoodEntry(
  userId: string,
  entry: Omit<MoodEntry, "id" | "createdAt">,
): MoodEntry {
  const full: MoodEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const entries = getMoodEntries(userId);
  entries.unshift(full);
  setMoodEntries(userId, entries);
  return full;
}

export function deleteMoodEntry(userId: string, id: string) {
  const entries = getMoodEntries(userId).filter((e) => e.id !== id);
  setMoodEntries(userId, entries);
}

export function getEntriesForDay(userId: string, dateKey: string): MoodEntry[] {
  // dateKey format: YYYY-MM-DD (local)
  return getMoodEntries(userId).filter((e) => localDateKey(e.createdAt) === dateKey);
}

export function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// ── AI analysis ──────────────────────────────────────────────────────────
// Calls our server route, which in turn calls HuggingFace (emotion
// classification) and Gemini (a short, humanized reflection). See
// app/api/mood/analyze/route.ts for the actual model calls + required env
// vars — this just wraps the fetch and degrades gracefully if either
// service isn't configured or is unreachable.

export async function analyzeMoodEntry(params: {
  mood: MoodLevel;
  journalText: string;
}): Promise<{ emotions: EmotionScore[]; aiResponse: string | null }> {
  try {
    const res = await fetch("/api/mood/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Analysis request failed");
    const data = await res.json();
    return {
      emotions: Array.isArray(data.emotions) ? data.emotions : [],
      aiResponse: typeof data.aiResponse === "string" ? data.aiResponse : null,
    };
  } catch {
    return { emotions: [], aiResponse: null };
  }
}
