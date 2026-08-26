"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import PageShell from "@/app/components/PageShell";
import MoodCheckIn from "@/app/components/mood/MoodCheckIn";
import MoodCalendar from "@/app/components/mood/MoodCalendar";
import MoodList from "@/app/components/mood/MoodList";
import { getMoodEntries } from "@/app/lib/mood";
import { MoodEntry } from "@/app/types/mood";

type View = "checkin" | "history";
type HistoryView = "calendar" | "list";

export default function MoodCheckerPage() {
  const { userId } = useAuth();
  const [view, setView] = useState<View>("checkin");
  const [historyView, setHistoryView] = useState<HistoryView>("calendar");
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    if (!userId) return;
    setEntries(getMoodEntries(userId));
  }, [userId, view]);

  function handleSaved(entry: MoodEntry) {
    setEntries((prev) => {
      const rest = prev.filter((e) => e.id !== entry.id);
      return [entry, ...rest];
    });
  }

  if (!userId) {
    return (
      <PageShell title="Mood Checker">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Sign in to start checking in.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Mood Checker"
      description="Check in with yourself, and see how you've been feeling over time."
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          <button
            onClick={() => setView("checkin")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: view === "checkin" ? "var(--primary)" : "var(--bg-subtle)",
              color: view === "checkin" ? "var(--primary-fg)" : "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Journal
          </button>
          <button
            onClick={() => setView("history")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: view === "history" ? "var(--primary)" : "var(--bg-subtle)",
              color: view === "history" ? "var(--primary-fg)" : "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            History
          </button>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {view === "checkin" ? (
            <MoodCheckIn userId={userId} onSaved={handleSaved} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-1 p-1 rounded-full w-fit mx-auto" style={{ background: "var(--bg-subtle)" }}>
                <button
                  onClick={() => setHistoryView("calendar")}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: historyView === "calendar" ? "var(--primary)" : "transparent",
                    color: historyView === "calendar" ? "var(--primary-fg)" : "var(--fg-muted)",
                  }}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setHistoryView("list")}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: historyView === "list" ? "var(--primary)" : "transparent",
                    color: historyView === "list" ? "var(--primary-fg)" : "var(--fg-muted)",
                  }}
                >
                  List
                </button>
              </div>

              {historyView === "calendar" ? (
                <MoodCalendar entries={entries} />
              ) : (
                <MoodList entries={entries} />
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
