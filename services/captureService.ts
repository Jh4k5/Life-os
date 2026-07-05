// services/captureService.ts
// Universal Capture seam: pick image/PDF, voice upload → transcribe, and
// image → OCR. Real interfaces; OCR is backed by the Gemini vision Edge
// Function when configured, with a graceful no-op fallback.
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
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
  /** Pick from the photo library. */
  async pickImage(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    return { uri: a.uri, base64: a.base64 ?? undefined, mimeType: a.mimeType ?? 'image/jpeg' };
  },

  /** Take a new photo with the camera. */
  async takePhoto(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    return { uri: a.uri, base64: a.base64 ?? undefined, mimeType: a.mimeType ?? 'image/jpeg' };
  },

  /**
   * Ask the user Camera vs Gallery (the natural expectation), then capture.
   * Cross-platform via Alert so it works on iOS and Android alike.
   */
  async captureImage(): Promise<PickedImage | null> {
    return new Promise((resolve) => {
      Alert.alert('إضافة صورة', 'من أين تريد الصورة؟', [
        { text: '📷 الكاميرا', onPress: () => this.takePhoto().then(resolve).catch(() => resolve(null)) },
        { text: '🖼️ المعرض', onPress: () => this.pickImage().then(resolve).catch(() => resolve(null)) },
        { text: 'إلغاء', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  },

  /** Voice → text via the Gemini audio Edge Function (server-side key). */
  async transcribe(audioBase64: string, mimeType = 'audio/m4a'): Promise<VoiceResult> {
    const client = getClient();
    if (client && audioBase64) {
      try {
        const { data, error } = await client.functions.invoke('transcribe', {
          body: { audioBase64, mimeType },
        });
        if (!error && data?.transcript) return { transcript: data.transcript, durationSec: 0 };
      } catch {
        // fall through
      }
    }
    return { transcript: '', durationSec: 0 };
  },

  /** Optionally archive the raw audio to private storage, then transcribe. */
  async uploadVoice(uri: string, audioBase64?: string): Promise<VoiceResult> {
    const client = getClient();
    if (client && isSupabaseConfigured() && audioBase64) {
      // (optional) archive raw audio for later re-processing:
      //   await client.storage.from(BUCKETS.voice).upload(path, blob)
      void BUCKETS.voice;
      void uri;
      return this.transcribe(audioBase64);
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
