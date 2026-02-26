import { test, expect, describe } from 'bun:test';
import {
  createSTTProvider,
  createTTSProvider,
  OpenAIWhisperSTT,
  GroqWhisperSTT,
  LocalWhisperSTT,
  EdgeTTSProvider,
  splitIntoSentences,
} from './voice.ts';
import type { STTConfig, TTSConfig } from '../config/types.ts';

describe('createSTTProvider factory', () => {
  test('returns OpenAIWhisperSTT when provider=openai and key present', () => {
    const config: STTConfig = {
      provider: 'openai',
      openai: { api_key: 'sk-test-key' },
    };
    const provider = createSTTProvider(config);
    expect(provider).toBeInstanceOf(OpenAIWhisperSTT);
  });

  test('returns null when provider=openai and no key', () => {
    const config: STTConfig = { provider: 'openai' };
    const provider = createSTTProvider(config);
    expect(provider).toBeNull();
  });

  test('returns GroqWhisperSTT when provider=groq and key present', () => {
    const config: STTConfig = {
      provider: 'groq',
      groq: { api_key: 'gsk-test-key' },
    };
    const provider = createSTTProvider(config);
    expect(provider).toBeInstanceOf(GroqWhisperSTT);
  });

  test('returns null when provider=groq and no key', () => {
    const config: STTConfig = { provider: 'groq' };
    const provider = createSTTProvider(config);
    expect(provider).toBeNull();
  });

  test('returns LocalWhisperSTT when provider=local (no key needed)', () => {
    const config: STTConfig = { provider: 'local' };
    const provider = createSTTProvider(config);
    expect(provider).toBeInstanceOf(LocalWhisperSTT);
  });

  test('returns LocalWhisperSTT with custom endpoint', () => {
    const config: STTConfig = {
      provider: 'local',
      local: { endpoint: 'http://my-server:9000' },
    };
    const provider = createSTTProvider(config);
    expect(provider).toBeInstanceOf(LocalWhisperSTT);
  });

  test('returns null for unknown provider', () => {
    const config = { provider: 'unknown' } as any;
    const provider = createSTTProvider(config);
    expect(provider).toBeNull();
  });

  test('returns OpenAI with custom model', () => {
    const config: STTConfig = {
      provider: 'openai',
      openai: { api_key: 'sk-test', model: 'whisper-large-v3' },
    };
    const provider = createSTTProvider(config);
    expect(provider).toBeInstanceOf(OpenAIWhisperSTT);
  });
});

describe('createTTSProvider factory', () => {
  test('returns null when tts disabled', () => {
    const config: TTSConfig = { enabled: false };
    expect(createTTSProvider(config)).toBeNull();
  });

  test('returns EdgeTTSProvider when enabled', () => {
    const config: TTSConfig = { enabled: true };
    const provider = createTTSProvider(config);
    expect(provider).toBeInstanceOf(EdgeTTSProvider);
  });

  test('passes voice config to provider', () => {
    const config: TTSConfig = { enabled: true, voice: 'en-GB-SoniaNeural' };
    const provider = createTTSProvider(config);
    expect(provider).toBeInstanceOf(EdgeTTSProvider);
  });

  test('passes rate and volume config', () => {
    const config: TTSConfig = { enabled: true, rate: '+20%', volume: '-10%' };
    const provider = createTTSProvider(config);
    expect(provider).not.toBeNull();
  });
});

describe('EdgeTTSProvider', () => {
  test('implements TTSProvider interface', () => {
    const provider = new EdgeTTSProvider();
    expect(typeof provider.synthesize).toBe('function');
    expect(typeof provider.synthesizeStream).toBe('function');
  });

  test('constructor accepts custom voice/rate/volume', () => {
    const provider = new EdgeTTSProvider('en-GB-SoniaNeural', '+10%', '-5%');
    expect(provider).toBeInstanceOf(EdgeTTSProvider);
  });
});

describe('splitIntoSentences', () => {
  test('splits on period + capital letter', () => {
    const result = splitIntoSentences('Hello there. World is great. This works.');
    expect(result.length).toBe(3);
    expect(result[0]).toBe('Hello there.');
    expect(result[1]).toBe('World is great.');
    expect(result[2]).toBe('This works.');
  });

  test('splits on exclamation and question marks', () => {
    const result = splitIntoSentences('Wait! Are you sure? Yes I am.');
    expect(result.length).toBe(3);
  });

  test('handles single sentence', () => {
    const result = splitIntoSentences('Just one sentence.');
    expect(result).toEqual(['Just one sentence.']);
  });

  test('handles empty string', () => {
    const result = splitIntoSentences('');
    expect(result).toEqual(['']);
  });

  test('collapses code blocks', () => {
    const result = splitIntoSentences('Here is code:\n```\nconst x = 1;\n```\nDone.');
    // Should not split inside code block
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('splits on double newlines (paragraph breaks)', () => {
    const result = splitIntoSentences('First paragraph\n\nSecond paragraph');
    expect(result.length).toBe(2);
  });

  test('handles text with no sentence-ending punctuation', () => {
    const result = splitIntoSentences('just some words without punctuation');
    expect(result).toEqual(['just some words without punctuation']);
  });
});
