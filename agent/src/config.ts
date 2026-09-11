import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV4 } from '@ai-sdk/provider';

export type AgentProvider = 'anthropic' | 'openai' | 'deepseek';

export const DEFAULT_SHELL_ORIGIN = 'http://localhost:4200';

export interface ProviderSettings {
  readonly model: string;
  readonly apiKeyEnvVar: string;
}

export interface AgentConfig {
  readonly provider: AgentProvider;
  readonly providers: Readonly<Record<AgentProvider, ProviderSettings>>;
}

export const DEFAULT_CONFIG: AgentConfig = {
  provider: 'anthropic',
  providers: {
    anthropic: { model: 'claude-sonnet-5', apiKeyEnvVar: 'ANTHROPIC_API_KEY' },
    openai: { model: 'gpt-5.4-mini', apiKeyEnvVar: 'OPENAI_API_KEY' },
    deepseek: { model: 'deepseek-chat', apiKeyEnvVar: 'DEEPSEEK_API_KEY' },
  },
};

/** `SHELL_ORIGIN` lets a shell on another port through CORS; the server itself stays on loopback. */
export function resolveShellOrigin(env: NodeJS.ProcessEnv): string {
  return env['SHELL_ORIGIN']?.trim() || DEFAULT_SHELL_ORIGIN;
}

/** Reads `AGENT_PROVIDER` / `AGENT_MODEL`; an unknown provider fails loudly instead of silently defaulting. */
export function loadConfig(env: NodeJS.ProcessEnv): AgentConfig {
  const provider = parseProvider(env['AGENT_PROVIDER']) ?? DEFAULT_CONFIG.provider;
  const model = env['AGENT_MODEL']?.trim();
  if (!model) {
    return { ...DEFAULT_CONFIG, provider };
  }
  return {
    provider,
    providers: {
      ...DEFAULT_CONFIG.providers,
      [provider]: { ...DEFAULT_CONFIG.providers[provider], model },
    },
  };
}

/**
 * The API key is checked here rather than at request time: the AI SDK accepts a
 * missing key and only fails on the first call, which would surface as a broken run.
 * Mastra accepts model specs v2/v3/v4; pinning v4 here keeps all three providers on
 * the one spec version the installed `ai` major produces.
 */
export function resolveModel(config: AgentConfig, env: NodeJS.ProcessEnv): LanguageModelV4 {
  const { provider } = config;
  const { model, apiKeyEnvVar } = config.providers[provider];
  const apiKey = env[apiKeyEnvVar]?.trim();
  if (!apiKey) {
    throw new Error(`Missing API key for provider "${provider}": set ${apiKeyEnvVar}.`);
  }
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'openai':
      return createOpenAI({ apiKey })(model);
    case 'deepseek':
      return createDeepSeek({ apiKey })(model);
  }
}

function parseProvider(raw: string | undefined): AgentProvider | undefined {
  const value = raw?.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value === 'anthropic' || value === 'openai' || value === 'deepseek') {
    return value;
  }
  throw new Error(`Unknown AGENT_PROVIDER "${raw}". Expected anthropic, openai or deepseek.`);
}
