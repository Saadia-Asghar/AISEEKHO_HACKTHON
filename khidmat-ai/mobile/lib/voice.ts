import { readAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type VoiceStopResult = {
  base64: string;
  mimeType: string;
  fallbackText?: string;
};

let nativeRecording: { stopAndUnloadAsync: () => Promise<unknown>; getURI: () => string | null } | null =
  null;

// Web: SpeechRecognition ONLY (MediaRecorder blocks mic in Chrome)
let webRecognition: SpeechRecognition | null = null;
let webTranscript = '';
let onInterimCb: ((text: string) => void) | null = null;
let onFinalizeCb: ((text: string) => void) | null = null;
let webListening = false;

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isWebSpeechSupported(): boolean {
  return Platform.OS === 'web' && getSpeechRecognitionCtor() != null;
}

function transcriptFromEvent(event: SpeechRecognitionEvent): string {
  let combined = '';
  for (let i = 0; i < event.results.length; i++) {
    combined += event.results[i][0]?.transcript ?? '';
  }
  return combined.trim();
}

function pushTranscript(text: string) {
  if (!text) return;
  webTranscript = text;
  onInterimCb?.(text);
}

function getWebTranscript(): string {
  return webTranscript.trim();
}

function fireFinalize() {
  const text = getWebTranscript();
  if (text) onFinalizeCb?.(text);
}

async function startWeb(
  onInterim?: (text: string) => void,
  onFinalize?: (text: string) => void
): Promise<void> {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    throw new Error(
      'Voice typing needs Chrome or Edge. Open http://localhost:8081 in Chrome (not Firefox).'
    );
  }

  onInterimCb = onInterim ?? null;
  onFinalizeCb = onFinalize ?? null;
  webTranscript = '';
  webListening = true;

  webRecognition = new Ctor();
  webRecognition.continuous = true;
  webRecognition.interimResults = true;
  webRecognition.lang = 'en-US';
  webRecognition.maxAlternatives = 1;

  webRecognition.onresult = (event: SpeechRecognitionEvent) => {
    const text = transcriptFromEvent(event);
    pushTranscript(text);
  };

  webRecognition.onerror = (event: Event & { error?: string }) => {
    const code = event.error;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      webListening = false;
    }
  };

  webRecognition.onend = () => {
    if (!webListening) return;
    webListening = false;
    webRecognition = null;
    fireFinalize();
  };

  try {
    webRecognition.start();
  } catch (e) {
    webRecognition = null;
    webListening = false;
    throw e instanceof Error ? e : new Error('Could not start speech recognition');
  }
}

async function recordWebClipMs(ms = 2500): Promise<{ base64: string; mimeType: string }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  return new Promise((resolve, reject) => {
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 100) {
          resolve({ base64: '', mimeType });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const data = reader.result as string;
          resolve({
            base64: data.includes(',') ? data.split(',')[1] : data,
            mimeType,
          });
        };
        reader.onerror = () => reject(new Error('Could not read audio'));
        reader.readAsDataURL(blob);
      } catch (e) {
        reject(e);
      }
    };
    recorder.start();
    setTimeout(() => {
      try {
        if (recorder.state === 'recording') recorder.stop();
      } catch {
        resolve({ base64: '', mimeType });
      }
    }, ms);
  });
}

async function stopWeb(): Promise<VoiceStopResult> {
  webListening = false;
  const existing = getWebTranscript();

  if (!webRecognition) {
    onInterimCb = null;
    onFinalizeCb = null;
    let base64 = '';
    let mimeType = 'audio/webm';
    try {
      const clip = await recordWebClipMs(2000);
      base64 = clip.base64;
      mimeType = clip.mimeType;
    } catch {
      /* optional API clip */
    }
    return { base64, mimeType, fallbackText: existing };
  }

  const rec = webRecognition;
  webRecognition = null;

  const finalText = await new Promise<string>((resolve) => {
    let settled = false;
    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      resolve(text.trim() || existing);
    };

    const timer = setTimeout(() => finish(getWebTranscript() || existing), 2500);

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = transcriptFromEvent(event);
      if (text) pushTranscript(text);
    };

    rec.onend = () => {
      clearTimeout(timer);
      finish(getWebTranscript() || existing);
    };

    try {
      rec.stop();
    } catch {
      clearTimeout(timer);
      finish(getWebTranscript() || existing);
    }
  });

  if (finalText) pushTranscript(finalText);

  let base64 = '';
  let mimeType = 'audio/webm';
  try {
    const clip = await recordWebClipMs(2000);
    base64 = clip.base64;
    mimeType = clip.mimeType;
  } catch {
    /* browser text is enough */
  }

  onInterimCb = null;
  onFinalizeCb = null;

  return {
    base64,
    mimeType,
    fallbackText: finalText || getWebTranscript(),
  };
}

function cancelWeb(): void {
  webListening = false;
  if (webRecognition) {
    try {
      webRecognition.stop();
    } catch {
      /* ignore */
    }
    webRecognition = null;
  }
  webTranscript = '';
  onInterimCb = null;
  onFinalizeCb = null;
}

async function startNative(): Promise<void> {
  const { Audio } = await import('expo-av');
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Microphone permission required');
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await rec.startAsync();
  nativeRecording = rec;
}

async function stopNative(): Promise<VoiceStopResult> {
  if (!nativeRecording) {
    throw new Error('Not recording');
  }
  await nativeRecording.stopAndUnloadAsync();
  const uri = nativeRecording.getURI();
  nativeRecording = null;
  if (!uri) {
    throw new Error('No recording URI');
  }
  const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
  const mimeType = uri.endsWith('.m4a') ? 'audio/mp4' : uri.endsWith('.webm') ? 'audio/webm' : 'audio/mp4';
  return { base64, mimeType };
}

function cancelNative(): void {
  if (nativeRecording) {
    nativeRecording.stopAndUnloadAsync().catch(() => {});
    nativeRecording = null;
  }
}

export async function startRecording(
  onInterim?: (text: string) => void,
  onFinalize?: (text: string) => void
): Promise<void> {
  if (Platform.OS === 'web') {
    if (webListening || webRecognition) return;
    await startWeb(onInterim, onFinalize);
    return;
  }
  if (nativeRecording) return;
  onFinalizeCb = onFinalize ?? null;
  await startNative();
}

export async function stopRecordingBase64(): Promise<VoiceStopResult> {
  if (Platform.OS === 'web') {
    return stopWeb();
  }
  return stopNative();
}

export function isRecording(): boolean {
  if (Platform.OS === 'web') {
    return webListening || webRecognition != null;
  }
  return nativeRecording != null;
}

export function cancelRecording(): void {
  if (Platform.OS === 'web') {
    cancelWeb();
    return;
  }
  cancelNative();
}

export function getLiveTranscript(): string {
  return getWebTranscript();
}
