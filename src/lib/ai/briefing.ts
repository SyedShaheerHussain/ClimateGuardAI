import type { RiskAssessment } from "../risk/engine";

export interface BriefingInput {
  city: string;
  weatherSummary: string;
  risks: RiskAssessment[];
  financialNote: string;
}

export interface ClimateBriefing {
  mode: "deterministic" | "llm";
  label: "AI-generated" | "Deterministic analysis";
  text: string;
  citations: string[];
  provider: string | null;
  warning: string;
}

export function deterministicBriefing(input: BriefingInput): ClimateBriefing {
  const lines = input.risks.map((risk) => {
    const score =
      risk.score === null
        ? "unavailable"
        : risk.category === "Insufficient data"
          ? `withheld (raw ${risk.score})`
          : String(risk.score);
    return `${risk.hazard}: category ${risk.category}, score ${score}, confidence ${risk.confidence}. Missing: ${risk.missingInputs.join(", ") || "none"}.`;
  });
  return {
    mode: "deterministic",
    label: "Deterministic analysis",
    text: [
      `${input.city}. ${input.weatherSummary}`,
      ...lines,
      input.financialNote,
      "Suggested operational checks: confirm the data timestamp, compare the forecast precipitation with a local gauge if one is available, and treat funding figures as a simulation.",
    ].join(" "),
    citations: ["Open-Meteo model fields supplied by the caller", "ClimateGuard heuristic risk engine"],
    provider: null,
    warning: "This text is produced by fixed rules. It does not add measurements that were not supplied.",
  };
}

export async function climateBriefing(input: BriefingInput): Promise<ClimateBriefing> {
  const fallback = deterministicBriefing(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You explain climate risk using only the JSON facts provided. Do not invent measurements, valuations, or government warnings. Say when a value is missing. Label uncertainty.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    if (!response.ok) return { ...fallback, warning: `LLM request failed with HTTP ${response.status}. Showing deterministic analysis.` };
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return fallback;
    return {
      mode: "llm",
      label: "AI-generated",
      text,
      citations: fallback.citations,
      provider: "OpenAI",
      warning: "AI-generated narrative constrained to supplied application data. It is not an official warning.",
    };
  } catch {
    return { ...fallback, warning: "LLM provider unavailable. Showing deterministic analysis." };
  } finally {
    clearTimeout(timer);
  }
}
