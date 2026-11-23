export interface ModelPricingSpec {
  readonly model: string;
  readonly version: string;
  readonly effectiveDate: string;
  /** Exact micro-dollars (1 USD = 1,000,000 micros) per input token (standard short context <= 272K). */
  readonly inputMicrosPerToken: number;
  /** Exact micro-dollars per cached input token. */
  readonly cachedInputMicrosPerToken: number;
  /** Exact micro-dollars per output token (includes reasoning tokens on Responses API). */
  readonly outputMicrosPerToken: number;
  readonly longContextThresholdTokens: number;
  readonly longContextInputMultiplier: number;
  readonly longContextOutputMultiplier: number;
}

export const DEFAULT_MODEL = 'gpt-6.2-astra' as const;
export const DEFAULT_REASONING_EFFORT = 'low' as const;

/** Hard server-side quota & cumulative budget constants (YOU-247). */
export const QUOTA_LIMITS = {
  visitorDailyCalls: 5,
  ipDailyCalls: 5,
  siteDailyCalls: 50,
  cumulativeBudgetUsd: 40,
  cumulativeBudgetMicros: 40_000_000, // USD $40.00 project lifetime hard cap (never resets daily)
  maxInputChars: 2400,
  maxOutputTokens: 2200,
  upstreamTimeoutMs: 35_000,
  staleReservationTtlMs: 120_000,
  timezone: 'Asia/Shanghai',
} as const;

/**
 * Centralized OpenAI model pricing configuration.
 * Source: OpenAI GPT-6.2 Astra Standard tier pricing (effective 2026-11-17):
 * - Input: $8.00 / 1M tokens -> 8 micros/token
 * - Cached Input: $0.40 / 1M tokens -> 0.4 micros/token
 * - Output (incl. reasoning): $40.00 / 1M tokens -> 40 micros/token
 */
export const MODEL_PRICING_TABLE: Record<string, ModelPricingSpec> = {
  'gpt-6.2-astra': {
    model: 'gpt-6.2-astra',
    version: 'openai-gpt-6.2-astra-standard-2026-11-17',
    effectiveDate: '2026-11-17',
    inputMicrosPerToken: 8,
    cachedInputMicrosPerToken: 0.4,
    outputMicrosPerToken: 40,
    longContextThresholdTokens: 272_000,
    longContextInputMultiplier: 2,
    longContextOutputMultiplier: 1.5,
  },
};

export function getModelPricing(model: string): ModelPricingSpec {
  return MODEL_PRICING_TABLE[model] ?? MODEL_PRICING_TABLE[DEFAULT_MODEL];
}

export interface OpenAIUsagePayload {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_tokens_details?: {
    cached_tokens?: number;
  };
  output_tokens_details?: {
    reasoning_tokens?: number;
  };
}

/**
 * Computes conservative upper-bound micro-dollar reservation before calling OpenAI.
 * Guarantees concurrent requests cannot exceed the cumulative $40 budget.
 */
export function computeConservativeReserveMicros(
  model: string,
  inputChars: number,
  maxOutputTokens: number = QUOTA_LIMITS.maxOutputTokens
): number {
  const pricing = getModelPricing(model);
  const clampedChars = Math.max(0, Math.min(inputChars, QUOTA_LIMITS.maxInputChars));
  // Conservative upper bound: ~1.2 tokens per CJK/mixed char + 1,600 tokens for system prompt & strict JSON schema
  const estimatedMaxInputTokens = Math.ceil(clampedChars * 1.2) + 1600;
  const worstCaseRawMicros =
    estimatedMaxInputTokens * pricing.inputMicrosPerToken +
    maxOutputTokens * pricing.outputMicrosPerToken;
  // 15% safety margin for tokenizer variance
  return Math.ceil(worstCaseRawMicros * 1.15);
}

/**
 * Computes exact cost in integer micro-dollars from Responses API usage.
 * Returns null if usage is missing or unreliable (caller MUST charge conservative reserve).
 */
export function computeActualCostMicros(
  model: string,
  usage: OpenAIUsagePayload | undefined | null
): number | null {
  if (!usage) return null;
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  if (
    typeof inputTokens !== 'number' ||
    typeof outputTokens !== 'number' ||
    !Number.isFinite(inputTokens) ||
    !Number.isFinite(outputTokens) ||
    inputTokens < 0 ||
    outputTokens < 0
  ) {
    return null;
  }

  const pricing = getModelPricing(model);
  const rawCached = usage.input_tokens_details?.cached_tokens ?? 0;
  const cachedTokens =
    typeof rawCached === 'number' && Number.isFinite(rawCached) && rawCached > 0
      ? Math.min(rawCached, inputTokens)
      : 0;
  const nonCachedInput = Math.max(0, inputTokens - cachedTokens);

  const isLongContext = inputTokens > pricing.longContextThresholdTokens;
  const inMult = isLongContext ? pricing.longContextInputMultiplier : 1;
  const outMult = isLongContext ? pricing.longContextOutputMultiplier : 1;

  const totalMicros =
    nonCachedInput * pricing.inputMicrosPerToken * inMult +
    cachedTokens * pricing.cachedInputMicrosPerToken * inMult +
    outputTokens * pricing.outputMicrosPerToken * outMult;

  return Math.ceil(totalMicros);
}

export function microsToUsd(micros: number): number {
  return Math.round((micros / 1_000_000) * 10000) / 10000;
}

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Computes current date string (YYYY-MM-DD) and next midnight ISO timestamp in Asia/Shanghai (UTC+8).
 * Asia/Shanghai does not observe DST, making UTC+8 exact and runtime-independent.
 */
export function getShanghaiDayWindow(nowMs: number = Date.now()): {
  dateShanghai: string;
  resetAtIso: string;
} {
  const shanghaiDate = new Date(nowMs + SHANGHAI_OFFSET_MS);
  const year = shanghaiDate.getUTCFullYear();
  const month = String(shanghaiDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shanghaiDate.getUTCDate()).padStart(2, '0');
  const dateShanghai = `${year}-${month}-${day}`;

  const nextDayMs = Date.UTC(year, shanghaiDate.getUTCMonth(), shanghaiDate.getUTCDate() + 1);
  const nextDate = new Date(nextDayMs);
  const nextYear = nextDate.getUTCFullYear();
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
  const resetAtIso = `${nextYear}-${nextMonth}-${nextDay}T00:00:00+08:00`;

  return { dateShanghai, resetAtIso };
}
