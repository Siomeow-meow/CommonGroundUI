"use client";
import { useState } from "react";
import { MOOD_LEVELS, MoodLevel, MoodEntry } from "@/app/types/mood";
import { saveMoodEntry, analyzeMoodEntry } from "@/app/lib/mood";

export default function MoodCheckIn({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved: (entry: MoodEntry) => void;
}) {
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [journalText, setJournalText] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastEntry, setLastEntry] = useState<MoodEntry | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleSave() {
    if (!mood || saving) return;
    setSaving(true);
    try {
      // Save immediately so the check-in isn't lost/blocked on the AI call.
      let entry = saveMoodEntry(userId, {
        mood,
        journalText: journalText.trim(),
        emotions: [],
        aiResponse: null,
      });
      setLastEntry(entry);
      onSaved(entry);
      setMood(null);
      setJournalText("");

      setAnalyzing(true);
      const { emotions, aiResponse } = await analyzeMoodEntry({
        mood: entry.mood,
        journalText: entry.journalText,
      });
      entry = { ...entry, emotions, aiResponse };
      setLastEntry(entry);
      onSaved(entry);
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>
          Select your mood:
        </p>
        <div className="flex justify-between gap-2">
          {MOOD_LEVELS.map((m) => {
            const active = mood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition"
                style={{
                  background: active ? "var(--primary-subtle)" : "var(--bg-subtle)",
                  border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: active ? "var(--primary)" : "var(--fg-muted)" }}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>
          Write your journal entry:
        </p>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="How are you feeling right now? Be specific so the AI can help you better…"
          rows={5}
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!mood || saving}
        className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
        style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
      >
        {saving ? "Saving..." : "Save check-in"}
      </button>

      {lastEntry && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--primary-subtle)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
            Reflection
          </p>
          {analyzing && !lastEntry.aiResponse ? (
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Thinking about what you wrote…
            </p>
          ) : lastEntry.aiResponse ? (
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>
              {lastEntry.aiResponse}
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Check-in saved. (Reflection unavailable right now — the AI
              provider may not be configured.)
            </p>
          )}
          {lastEntry.emotions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {lastEntry.emotions.map((e) => (
                <span
                  key={e.label}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--fg-muted)",
                  }}
                >
                  {e.label} · {Math.round(e.score * 100)}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
