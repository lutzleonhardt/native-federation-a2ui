import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadConfig, resolveModel } from './config.js';

const PROVIDER_CASES = [
  { provider: 'anthropic', envVar: 'ANTHROPIC_API_KEY', providerId: /anthropic/ },
  { provider: 'openai', envVar: 'OPENAI_API_KEY', providerId: /openai/ },
  { provider: 'deepseek', envVar: 'DEEPSEEK_API_KEY', providerId: /deepseek/ },
] as const;

describe('loadConfig', () => {
  it('defaults to the Anthropic recording provider', () => {
    expect(loadConfig({}).provider).toBe('anthropic');
  });

  it('applies the AGENT_MODEL override to the selected provider only', () => {
    const config = loadConfig({ AGENT_PROVIDER: 'deepseek', AGENT_MODEL: 'deepseek-reasoner' });
    expect(config.providers.deepseek.model).toBe('deepseek-reasoner');
    expect(config.providers.anthropic.model).toBe(DEFAULT_CONFIG.providers.anthropic.model);
  });

  it('rejects an unknown AGENT_PROVIDER instead of silently defaulting', () => {
    expect(() => loadConfig({ AGENT_PROVIDER: 'llama' })).toThrow(/AGENT_PROVIDER/);
  });
});

describe('resolveModel', () => {
  it.each(PROVIDER_CASES)(
    'T2-AC-01 routes $provider to its own model id',
    ({ provider, envVar, providerId }) => {
      const env = { AGENT_PROVIDER: provider, [envVar]: 'test-key' };
      const config = loadConfig(env);
      const model = resolveModel(config, env);

      expect(model.modelId).toBe(config.providers[provider].model);
      expect(model.provider).toMatch(providerId);
    },
  );

  it.each(PROVIDER_CASES)(
    'T2-AC-01 throws an error naming $envVar when the key is missing',
    ({ provider, envVar }) => {
      const env = { AGENT_PROVIDER: provider };
      expect(() => resolveModel(loadConfig(env), env)).toThrow(new RegExp(envVar));
    },
  );
});
