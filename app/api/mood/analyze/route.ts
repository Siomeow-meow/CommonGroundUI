import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mood/analyze
 * body: { mood: MoodLevel, journalText: string }
 * returns: { emotions: {label, score}[], aiResponse: string | null }
 *
 * Two external calls:
 *  1. HuggingFace Inference API — a text-classification emotion model,
 *     picks the emotions present in the journal entry.
 *  2. Gemini — turns the mood + emotions + journal text into a short,
 *     warm, human-sounding reflection (not clinical, not generic).
 *
 * Env vars required (not set in this environment — add them in your
 * deployment settings):
 *   HUGGINGFACE_API_KEY   — https://huggingface.co/settings/tokens
 *   GEMINI_API_KEY        — https://aistudio.google.com/apikey
 *
 * Either call failing doesn't fail the request — the route returns
 * whatever it could get so the UI can still save the check-in.
 */

const HF_MODEL = "j-hartmann/emotion-english-distilroberta-base";
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

type EmotionScore = { label: string; score: number };

async function classifyEmotions(text: string): Promise<EmotionScore[]> {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key || !text.trim()) return [];
  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Model returns [[{label, score}, ...]] for a single input
    const scores = Array.isArray(data?.[0]) ? data[0] : Array.isArray(data) ? data : [];
    return scores
      .map((s: any) => ({ label: s.label, score: s.score }))
      .sort((a: EmotionScore, b: EmotionScore) => b.score - a.score)
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function humanizedReflection(
  mood: string,
  journalText: string,
  emotions: EmotionScore[],
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const emotionList = emotions.map((e) => e.label).join(", ") || "unspecified";
  const prompt = `Someone just logged a mood check-in.
Selected mood: ${mood}
Detected emotions: ${emotionList}
Journal entry: "${journalText || "(no journal entry written)"}"

Write a short (2-4 sentence), warm, human-sounding reflection back to them.
Acknowledge how they seem to be feeling, don't diagnose or lecture, and if
it fits naturally offer one small, concrete, doable suggestion. Speak
directly to them ("you"), plain language, no bullet points, no headers.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const mood = typeof body?.mood === "string" ? body.mood : "";
  const journalText = typeof body?.journalText === "string" ? body.journalText : "";

  const emotions = await classifyEmotions(journalText);
  const aiResponse = await humanizedReflection(mood, journalText, emotions);

  return NextResponse.json({ emotions, aiResponse });
}
