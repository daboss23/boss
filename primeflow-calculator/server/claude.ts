import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "./env.js";

export const DEFAULT_MODEL = "claude-haiku-4-5";
export const DEFAULT_RESEARCH_MODEL = "claude-sonnet-5";

export function claude(env: Env, timeoutMs = 30_000): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: timeoutMs, maxRetries: 1 });
}

/** Concatenated text of all text blocks. */
export function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Pulls the last JSON object out of a text response (fenced or bare). */
export function lastJsonObject(text: string): unknown {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]!);
  const candidates = fenced.length ? fenced.reverse() : [];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim()) as unknown;
    } catch {
      /* try next */
    }
  }
  return null;
}
