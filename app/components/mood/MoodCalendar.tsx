"use client";
import { useMemo, useState } from "react";
import { MoodEntry, MOOD_LEVELS } from "@/app/types/mood";
import { localDateKey } from "@/app/lib/mood";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function emojiFor(mood: string) {
  return MOOD_LEVELS.find((m) => m.value === mood)?.emoji ?? "•";
}

export default function MoodCalendar({ entries }: { entries: MoodEntry[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, MoodEntry[]>();
    for (const e of entries) {
      const key = localDateKey(e.createdAt);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedEntries = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {MONTHS[month]} {year}
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-subtle)", color: "var(--fg-muted)" }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-medium py-1" style={{ color: "var(--fg-muted)" }}>
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const key = dateKey(day);
          const dayEntries = byDay.get(key) ?? [];
          const isSelected = selectedKey === key;
          const isToday = key === localDateKey(today.toISOString());
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(isSelected ? null : key)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs"
              style={{
                background: isSelected ? "var(--primary-subtle)" : "transparent",
                border: isSelected
                  ? "1.5px solid var(--primary)"
                  : isToday
                    ? "1.5px solid var(--border-strong)"
                    : "1px solid transparent",
                color: "var(--fg)",
              }}
            >
              <span>{day}</span>
              {dayEntries.length > 0 && (
                <span className="text-sm leading-none">{emojiFor(dayEntries[0].mood)}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedKey && (
        <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--fg-muted)" }}>
              No check-ins on this day.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pt-3">
              <p className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
                {selectedEntries.length} check-in{selectedEntries.length > 1 ? "s" : ""}
              </p>
              {selectedEntries.map((e) => (
                <MoodEntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MoodEntryCard({ entry }: { entry: MoodEntry }) {
  const meta = MOOD_LEVELS.find((m) => m.value === entry.mood);
  const time = new Date(entry.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div
      className="rounded-xl p-3.5 flex flex-col gap-2"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{meta?.emoji}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {meta?.label}
          </p>
          <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
            {time}
          </p>
        </div>
      </div>
      {entry.journalText && (
        <p className="text-sm" style={{ color: "var(--fg)" }}>
          {entry.journalText}
        </p>
      )}
      {entry.aiResponse && (
        <div
          className="rounded-lg p-2.5 text-sm"
          style={{ background: "var(--primary-subtle)", color: "var(--fg)" }}
        >
          {entry.aiResponse}
        </div>
      )}
    </div>
  );
}
