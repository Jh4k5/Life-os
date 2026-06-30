// services/captureService.ts
// Universal Capture seam: voice upload → transcribe, and image/PDF → OCR.
// Real interfaces today returning real (limited) results; later backed by
// Supabase Storage + Edge Functions (Whisper / OCR).
import { getClient, BUCKETS, isSupabaseConfigured } from './supabase';

export interface VoiceResult {
  transcript: string;
  durationSec: number;
}

export interface OCRResult {
  /** Raw extracted text. */
  text: string;
  /** Best-effort structured lines (e.g. schedule rows). */
  lines: string[];
}

export interface CaptureService {
  uploadVoice(uri: string): Promise<VoiceResult>;
  ocr(uri: string): Promise<OCRResult>;
}

export const captureService: CaptureService = {
  async uploadVoice(uri) {
    const client = getClient();
    if (client && isSupabaseConfigured()) {
      // Live path (filled in when backend is stood up):
      //   const file = await fetch(uri).then(r => r.blob());
      //   await client.storage.from(BUCKETS.voice).upload(path, file);
      //   const { data } = await client.functions.invoke('transcribe', { body: { path } });
      //   return data;
      void BUCKETS.voice;
    }
    // Local fallback — real shape, limited capability.
    return { transcript: '', durationSec: 0 };
  },

  async ocr(uri) {
    const client = getClient();
    if (client && isSupabaseConfigured()) {
      // const { data } = await client.functions.invoke('ocr', { body: { uri } });
      // return data;
    }
    return { text: '', lines: [] };
  },
};
