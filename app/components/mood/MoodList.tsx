"use client";
import { MoodEntry } from "@/app/types/mood";
import { MoodEntryCard } from "@/app/components/mood/MoodCalendar";

export default function MoodList({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "var(--fg-muted)" }}>
        No journal entries yet.
        <br />
        Write your first journal entry above!
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => (
        <MoodEntryCard key={e.id} entry={e} />
      ))}
    </div>
  );
}
