// services/captureService.ts
// Universal Capture seam: pick image/PDF, voice upload → transcribe, and
// image → OCR. Real interfaces; OCR is backed by the Gemini vision Edge
// Function when configured, with a graceful no-op fallback.
import * as ImagePicker from 'expo-image-picker';
import { getClient, BUCKETS, isSupabaseConfigured } from './supabase';

export interface VoiceResult {
  transcript: string;
  durationSec: number;
}

export interface OCRResult {
  text: string;
  lines: string[];
}

export interface PickedImage {
  uri: string;
  base64?: string;
  mimeType: string;
}

export const captureService = {
  /** Open the library/camera to attach a schedule photo/PDF (Universal Capture). */
  async pickImage(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    return { uri: a.uri, base64: a.base64 ?? undefined, mimeType: a.mimeType ?? 'image/jpeg' };
  },

  async uploadVoice(_uri: string): Promise<VoiceResult> {
    const client = getClient();
    if (client && isSupabaseConfigured()) {
      // Live: upload to BUCKETS.voice → invoke('transcribe'). Filled in when ready.
      void BUCKETS.voice;
    }
    return { transcript: '', durationSec: 0 };
  },

  /** Image → text via the Gemini vision Edge Function (server-side key). */
  async ocr(image: PickedImage): Promise<OCRResult> {
    const client = getClient();
    if (client && image.base64) {
      try {
        const { data, error } = await client.functions.invoke('ocr', {
          body: { imageBase64: image.base64, mimeType: image.mimeType },
        });
        if (!error && data) return data as OCRResult;
      } catch {
        // fall through
      }
    }
    return { text: '', lines: [] };
  },
};
