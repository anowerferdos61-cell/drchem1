// Server-only: Gemini prompts + structured JSON generation for question sets.
import { generateText } from "ai";
import { createGeminiProvider } from "./ai-gateway";

const MODEL = "gemini-2.5-flash";

export interface McqOut {
  question: string;
  options: string[]; // length 4
  correct_index: number;
  explanation: string;
}

export interface CqPart {
  q: string;
  marks: number;
  sample: string;
}

export interface CqOut {
  stem: string;
  ka: CqPart;
  kha: CqPart;
  ga: CqPart;
  gha: CqPart;
}

export interface GenParams {
  apiKey: string;
  chapter: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  count: number;
  experiment?: string;
}

function difficultyBn(d: string) {
  return d === "easy"
    ? "সহজ"
    : d === "hard"
      ? "কঠিন"
      : d === "mixed"
        ? "সহজ+মাঝারি+কঠিন মিক্স"
        : "মাঝারি";
}

async function callJson<T>(apiKey: string, prompt: string): Promise<T> {
  const provider = createGeminiProvider(apiKey);
  const { text } = await generateText({
    model: provider(MODEL),
    messages: [
      {
        role: "system",
        content:
          "You are an expert Chemistry teacher for Bangladesh NCTB Class 9-10. Reply ONLY with valid JSON that matches the requested schema. No markdown fences, no commentary.",
      },
      { role: "user", content: prompt },
    ],
    providerOptions: {
      gemini: { response_format: { type: "json_object" } },
    },
  });
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function generateMcqs(p: GenParams): Promise<McqOut[]> {
  const prompt = `Generate ${p.count} high-quality MCQs (Multiple Choice Questions) for NCTB Chemistry.

অধ্যায়/Topic: ${p.chapter}
Difficulty: ${difficultyBn(p.difficulty)}
${p.experiment ? `Context experiment: ${p.experiment}` : ""}

Language: Bangla (scientific terms English OK).
Each question must have 4 realistic options and a clear explanation.

Return JSON in this exact shape:
{
  "questions": [
    {
      "question": "প্রশ্নের টেক্সট",
      "options": ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
      "correct_index": 0,
      "explanation": "সঠিক উত্তরের ব্যাখ্যা"
    }
  ]
}`;
  const res = await callJson<{ questions: McqOut[] }>(p.apiKey, prompt);
  return res.questions ?? [];
}

export async function generateCqs(p: GenParams): Promise<CqOut[]> {
  const prompt = `Generate ${p.count} Creative Questions (সৃজনশীল প্রশ্ন) for NCTB Chemistry Class 9-10 board exam standard.

অধ্যায়/Topic: ${p.chapter}
Difficulty: ${difficultyBn(p.difficulty)}
${p.experiment ? `Context experiment: ${p.experiment}` : ""}

Each CQ must have:
- একটি উদ্দীপক (stem) — বাংলায়, প্রয়োজনে ছোট টেবিল/সিনারিও
- (ক) জ্ঞানমূলক — ১ মার্ক
- (খ) অনুধাবনমূলক — ২ মার্ক
- (গ) প্রয়োগমূলক — ৩ মার্ক (উদ্দীপকভিত্তিক)
- (ঘ) উচ্চতর দক্ষতা — ৪ মার্ক (বিশ্লেষণধর্মী, উদ্দীপকভিত্তিক)
- প্রত্যেক অংশের জন্য শিক্ষকের রেফারেন্সের জন্য আদর্শ উত্তর

Return JSON in this exact shape:
{
  "questions": [
    {
      "stem": "উদ্দীপকের টেক্সট",
      "ka": { "q": "ক প্রশ্ন", "marks": 1, "sample": "আদর্শ উত্তর" },
      "kha": { "q": "খ প্রশ্ন", "marks": 2, "sample": "আদর্শ উত্তর" },
      "ga": { "q": "গ প্রশ্ন", "marks": 3, "sample": "আদর্শ উত্তর" },
      "gha": { "q": "ঘ প্রশ্ন", "marks": 4, "sample": "আদর্শ উত্তর" }
    }
  ]
}`;
  const res = await callJson<{ questions: CqOut[] }>(p.apiKey, prompt);
  return res.questions ?? [];
}

/** Score a student CQ answer against sample (0..100). Uses Gemini judge. */
export async function scoreCqAnswer(
  apiKey: string,
  sample: string,
  student: string,
  maxMarks: number,
): Promise<{ similarity: number; suggested_marks: number; comment: string }> {
  if (!student.trim()) return { similarity: 0, suggested_marks: 0, comment: "খালি উত্তর" };
  const prompt = `Compare this Chemistry student answer to the ideal answer and score it.

আদর্শ উত্তর:
"""${sample}"""

শিক্ষার্থীর উত্তর:
"""${student}"""

সর্বোচ্চ মার্ক: ${maxMarks}

Return JSON:
{
  "similarity": 0..100,
  "suggested_marks": 0..${maxMarks},
  "comment": "সংক্ষিপ্ত বাংলা মন্তব্য (max 2 lines)"
}`;
  try {
    return await callJson(apiKey, prompt);
  } catch (e) {
    console.error("scoreCqAnswer failed", e);
    return { similarity: 0, suggested_marks: 0, comment: "AI score failed" };
  }
}
