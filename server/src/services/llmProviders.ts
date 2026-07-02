// ============================================================
// LLM Providers — pluggable backends for the Hyperborean AI general.
//
// The AI general (aiGeneralService) used to call Anthropic directly. It now
// runs a CASCADE of providers (see AI.LLM_PROVIDER_CASCADE / the ai_general
// flag's config.llm_cascade): the first configured provider that returns
// valid JSON wins, otherwise the next is tried, and finally the deterministic
// fallback FSM. Adding/reordering models is a live flag-config edit (no deploy).
//
// Env vars (each provider reads ITS OWN key; an UNCONFIGURED provider — no key
// in the environment — is silently SKIPPED by the cascade, it never throws):
//   GEMINI_API_KEY      → GeminiProvider     (Google Generative Language REST)
//   OPENROUTER_API_KEY  → OpenRouterProvider (OpenRouter chat-completions REST)
//   DEEPSEEK_API_KEY    → DeepSeekProvider   (api.deepseek.com, OpenAI-compatible)
//   MOONSHOT_API_KEY    → MoonshotProvider   (api.moonshot.ai, OpenAI-compatible;
//                         base URL overridable via MOONSHOT_BASE_URL for the
//                         .cn platform)
//   ANTHROPIC_API_KEY   → AnthropicProvider  (@anthropic-ai/sdk, optional/paid)
//
// No new npm SDKs: Gemini + OpenRouter use Node 20's global `fetch`. Anthropic
// reuses the already-installed @anthropic-ai/sdk. complete() returns the raw
// model text (the caller does the zod-validated JSON extraction) or THROWS on
// non-200 / missing text / timeout — a throw just advances the cascade.
// ============================================================

import type Anthropic from '@anthropic-ai/sdk';

const REQUEST_TIMEOUT_MS = 20_000;

export interface LlmCallResult {
  text: string;
  provider: string;
  model: string;
}

export interface LlmProvider {
  /** Stable provider name: 'gemini' | 'openrouter' | 'anthropic'. */
  name: string;
  /** True when this provider's API key is present in the environment. */
  isConfigured(): boolean;
  /** Returns the raw model text, or throws on any failure (advances cascade). */
  complete(system: string, user: string, maxTokens: number): Promise<string>;
}

// ---- small fetch helper with an AbortController timeout --------------

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---- Gemini (Google Generative Language REST) -----------------------

export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly model: string;

  constructor(model: string = 'gemini-2.0-flash') {
    this.model = model || 'gemini-2.0-flash';
  }

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model,
    )}:generateContent?key=${encodeURIComponent(key)}`;

    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    };

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('Gemini: missing candidate text');
    }
    return text.trim();
  }
}

// ---- OpenRouter (OpenAI-compatible chat completions REST) -----------

export class OpenRouterProvider implements LlmProvider {
  readonly name = 'openrouter';
  private readonly model: string;

  constructor(model: string) {
    this.model = model;
  }

  isConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY not set');

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    };

    const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mapraiders.com',
        'X-Title': 'MapRaiders',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`OpenRouter HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text: unknown = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('OpenRouter: missing message content');
    }
    return text.trim();
  }
}

// ---- DeepSeek (native OpenAI-compatible chat completions REST) ------
// api.deepseek.com is OpenAI-compatible. The native key is paid-but-cheap;
// for our tiny cron volume (~dozens of ~600-token calls/day) it is effectively
// free, and it is the most reliable always-on backend. JSON mode supported.

export class DeepSeekProvider implements LlmProvider {
  readonly name = 'deepseek';
  private readonly model: string;

  constructor(model: string = 'deepseek-chat') {
    this.model = model || 'deepseek-chat';
  }

  isConfigured(): boolean {
    return !!process.env.DEEPSEEK_API_KEY;
  }

  async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error('DEEPSEEK_API_KEY not set');

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    };

    const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`DeepSeek HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text: unknown = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('DeepSeek: missing message content');
    }
    return text.trim();
  }
}

// ---- Moonshot / Kimi (OpenAI-compatible chat completions REST) ------
// platform.moonshot.ai keys use https://api.moonshot.ai/v1; keys from the
// Chinese platform (platform.moonshot.cn) need MOONSHOT_BASE_URL override.

export class MoonshotProvider implements LlmProvider {
  readonly name = 'moonshot';
  private readonly model: string;

  constructor(model: string = 'kimi-latest') {
    this.model = model || 'kimi-latest';
  }

  isConfigured(): boolean {
    return !!process.env.MOONSHOT_API_KEY;
  }

  async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const key = process.env.MOONSHOT_API_KEY;
    if (!key) throw new Error('MOONSHOT_API_KEY not set');
    const base = process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1';

    // kimi-k2.x are reasoning models: they REQUIRE temperature 1 and spend
    // tokens on thinking before emitting — with the caller's 400-token cap the
    // content comes back EMPTY (finish_reason 'length', verified 2026-07-02).
    // Give them a floor that leaves room to think.
    const isReasoning = /^kimi-k2/.test(this.model);
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: isReasoning ? Math.max(maxTokens, 2048) : maxTokens,
      response_format: { type: 'json_object' },
      temperature: isReasoning ? 1 : 0.7,
    };

    const res = await fetchWithTimeout(
      `${base}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      // Reasoning models think before they answer — 20s kills them mid-thought
      // ("This operation was aborted", verified 2026-07-02).
      isReasoning ? 60_000 : REQUEST_TIMEOUT_MS,
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Moonshot HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text: unknown = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('Moonshot: missing message content');
    }
    return text.trim();
  }
}

// ---- Anthropic (optional, paid — wraps the installed SDK) -----------

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private readonly model: string;
  private client: Anthropic | null = null;

  constructor(model: string = 'claude-haiku-4-5') {
    this.model = model || 'claude-haiku-4-5';
  }

  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  private async getClient(): Promise<Anthropic> {
    if (!this.client) {
      // Lazy import keeps the SDK out of the hot path when Anthropic is unused.
      const mod = await import('@anthropic-ai/sdk');
      const Ctor = mod.default;
      this.client = new Ctor(); // reads ANTHROPIC_API_KEY from env
    }
    return this.client;
  }

  async complete(system: string, user: string, maxTokens: number): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    const client = await this.getClient();
    const res = await client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
    if (text === '') throw new Error('Anthropic: empty response');
    return text;
  }
}

// ---- Registry + factory ---------------------------------------------

/** Provider registry keyed by name → factory that binds a model. */
export const PROVIDERS: Record<string, (model: string) => LlmProvider> = {
  gemini: (model) => new GeminiProvider(model),
  openrouter: (model) => new OpenRouterProvider(model),
  deepseek: (model) => new DeepSeekProvider(model),
  moonshot: (model) => new MoonshotProvider(model),
  anthropic: (model) => new AnthropicProvider(model),
};

/**
 * Build a provider by name with the given model, or null if the name is
 * unknown (an unknown cascade entry is skipped, never crashes the cascade).
 */
export function buildProvider(name: string, model: string): LlmProvider | null {
  const factory = PROVIDERS[name];
  if (!factory) return null;
  return factory(model);
}
