// ── Mood Checker types ──────────────────────────────────────────────────────
// There's no real backend table for this yet, so this mirrors the schema
// we'd expect one to have (see app/lib/mood.ts for the localStorage-backed
// stand-in implementation and notes on wiring up a real API later):
//
//   mood_entries
//     id            uuid / serial   primary key
//     user_id       string          FK -> user, from Clerk auth
//     mood          MoodLevel       one of the 5 fixed levels below
//     journal_text  text            free-form entry, optional
//     emotions      jsonb           HuggingFace classifier output
//     ai_response   text            Gemini's humanized reflection
//     created_at    timestamptz

export type MoodLevel = "overwhelmed" | "low" | "okay" | "good" | "great";

export const MOOD_LEVELS: {
  value: MoodLevel;
  label: string;
  emoji: string;
}[] = [
  { value: "overwhelmed", label: "Overwhelmed", emoji: "😣" },
  { value: "low", label: "Low", emoji: "😔" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "great", label: "Great", emoji: "😄" },
];

export type EmotionScore = {
  label: string; // e.g. "sadness", "joy", "fear" — HuggingFace model labels
  score: number; // 0-1
};

export type MoodEntry = {
  id: string;
  mood: MoodLevel;
  journalText: string;
  emotions: EmotionScore[];
  aiResponse: string | null;
  createdAt: string; // ISO timestamp
};
