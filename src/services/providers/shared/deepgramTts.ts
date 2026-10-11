/**
 * Deepgram TTS (audio briefings).
 *
 * Deepgram is the preferred TTS lane for briefings — the free-credit account
 * covers it, where the Cloudflare audio models draw on paid pools. Returns
 * base64-encoded audio (mp3) compatible with the existing WebAudio briefing
 * player. Long text is chunked at sentence boundaries because the /speak
 * endpoint caps request size; concatenated mp3 frames decode as one stream.
 */

const DEEPGRAM_SPEAK_URL = 'https://api.deepgram.com/v1/speak';
const DEEPGRAM_TTS_MODEL = 'aura-2-thalia-en';
const DEEPGRAM_KEY_STORAGE_KEY = 'DEEPGRAM_API_KEY';
const DEEPGRAM_KEY_ENV_KEYS = ['VITE_DEEPGRAM_API_KEY'];
const MAX_CHUNK_CHARS = 1800;

const trimOrUndefined = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const getEnvironmentValue = (names: string[]): string | undefined => {
  for (const name of names) {
    const value = trimOrUndefined(
      (import.meta.env as Record<string, string | undefined>)[name]
    );
    if (value) return value;
  }
  return undefined;
};

export const getDeepgramApiKey = (): string | undefined => {
  if (typeof localStorage !== 'undefined') {
    const stored = trimOrUndefined(localStorage.getItem(DEEPGRAM_KEY_STORAGE_KEY));
    if (stored) return stored;
  }
  return getEnvironmentValue(DEEPGRAM_KEY_ENV_KEYS);
};

export const setDeepgramApiKey = (rawToken: string): boolean => {
  const token = rawToken.trim();
  if (!token || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(DEEPGRAM_KEY_STORAGE_KEY, token);
  } catch {
    return false;
  }
  return getDeepgramApiKey() === token;
};

export const clearDeepgramApiKey = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(DEEPGRAM_KEY_STORAGE_KEY);
};

export const isDeepgramTtsConfigured = (): boolean => !!getDeepgramApiKey();

/** Splits text into <=MAX_CHUNK_CHARS pieces on sentence/paragraph boundaries. */
export const chunkForSpeech = (text: string): string[] => {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_CHUNK_CHARS) {
      if ((current + '\n\n' + paragraph).length > MAX_CHUNK_CHARS) pushCurrent();
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }
    for (const sentence of paragraph.split(/(?<=[.!?])\s+/)) {
      if (sentence.length > MAX_CHUNK_CHARS) {
        pushCurrent();
        for (let i = 0; i < sentence.length; i += MAX_CHUNK_CHARS) {
          chunks.push(sentence.slice(i, i + MAX_CHUNK_CHARS).trim());
        }
        continue;
      }
      if ((current + ' ' + sentence).length > MAX_CHUNK_CHARS) pushCurrent();
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  pushCurrent();
  return chunks.length > 0 ? chunks : [text];
};

const speakChunk = async (chunk: string, apiKey: string): Promise<ArrayBuffer> => {
  const response = await fetch(
    `${DEEPGRAM_SPEAK_URL}?model=${DEEPGRAM_TTS_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: chunk }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Deepgram TTS failed with status ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`
    );
  }

  return response.arrayBuffer();
};

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

/**
 * Generates a briefing as base64 mp3. Chunked sequential requests are
 * concatenated; mp3 frames are self-contained so the joined stream decodes
 * as a single AudioContext buffer.
 */
export const deepgramAudioBriefing = async (text: string): Promise<string> => {
  const apiKey = getDeepgramApiKey();
  if (!apiKey) {
    throw new Error('Deepgram API key is not configured');
  }

  const trimmed = text.trim();
  if (!trimmed) throw new Error('No briefing text provided');

  const chunks = chunkForSpeech(trimmed);
  let base64 = '';
  for (const chunk of chunks) {
    const audio = await speakChunk(chunk, apiKey);
    base64 += toBase64(audio);
  }
  return base64;
};
