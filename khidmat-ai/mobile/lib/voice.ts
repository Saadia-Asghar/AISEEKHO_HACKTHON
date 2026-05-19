import { readAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type VoiceStopResult = {
  base64: string;
  mimeType: string;
  /** Browser STT fallback when API unavailable */
  fallbackText?: string;
};

let nativeRecording: { stopAndUnloadAsync: () => Promise<unknown>; getURI: () => string | null } | null =
  null;

let webStream: MediaStream | null = null;
let webRecorder: MediaRecorder | null = null;
let webChunks: Blob[] = [];
let webRecognition: SpeechRecognition | null = null;
/** Full transcript built from SpeechRecognition */
let webTranscript = '';
let onInterimCb: ((text: string) => void) | null = null;

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function rebuildTranscriptFromEvent(event: SpeechRecognitionEvent): string {
  let combined = '';
  for (let i = 0; i < event.results.length; i++) {
    const part = event.results[i][0]?.transcript ?? '';
    combined += part;
  }
  return combined.trim();
}

function emitLiveTranscript(text: string) {
  webTranscript = text;
  if (text && onInterimCb) onInterimCb(text);
}

function getWebTranscript(): string {
  return webTranscript.trim();
}

async function startWeb(onInterim?: (text: string) => void): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone not available in this browser');
  }
  onInterimCb = onInterim ?? null;
  webTranscript = '';

  webStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

  webRecorder = new MediaRecorder(webStream, { mimeType });
  webChunks = [];
  webRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) webChunks.push(e.data);
  };
  webRecorder.start(200);

  const Ctor = getSpeechRecognitionCtor();
  if (Ctor) {
    webRecognition = new Ctor();
    webRecognition.continuous = true;
    webRecognition.interimResults = true;
    // en-US is most reliable in Chrome; still picks up Urdu/Roman Urdu reasonably well
    webRecognition.lang = 'en-US';
    webRecognition.maxAlternatives = 1;
    webRecognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = rebuildTranscriptFromEvent(event);
      if (text) emitLiveTranscript(text);
    };
    webRecognition.onerror = () => {
      /* no-op; permission errors surface from getUserMedia */
    };
    try {
      webRecognition.start();
    } catch {
      webRecognition = null;
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      const base64 = data.includes(',') ? data.split(',')[1] : data;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read audio'));
    reader.readAsDataURL(blob);
  });
}

function waitForRecognitionEnd(rec: SpeechRecognition, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    rec.onend = done;
    try {
      rec.stop();
    } catch {
      done();
    }
  });
}

async function stopMediaRecorder(mime: string, fallbackText: string): Promise<VoiceStopResult> {
  if (!webRecorder || webRecorder.state === 'inactive') {
    webStream?.getTracks().forEach((t) => t.stop());
    webStream = null;
    return { base64: '', mimeType: mime, fallbackText };
  }

  return new Promise((resolve, reject) => {
    const recorder = webRecorder!;
    const mimeType = recorder.mimeType || mime;

    recorder.onstop = async () => {
      try {
        webStream?.getTracks().forEach((t) => t.stop());
        webStream = null;
        webRecorder = null;
        const blob = new Blob(webChunks, { type: mimeType });
        webChunks = [];
        if (blob.size < 100) {
          resolve({ base64: '', mimeType, fallbackText });
          return;
        }
        const base64 = await blobToBase64(blob);
        resolve({ base64, mimeType, fallbackText });
      } catch (e) {
        reject(e);
      }
    };

    recorder.onerror = () => reject(new Error('Recording failed'));
    try {
      if (recorder.state === 'recording') recorder.requestData();
      recorder.stop();
    } catch (e) {
      reject(e);
    }
  });
}

async function stopWeb(): Promise<VoiceStopResult> {
  let fallbackText = getWebTranscript();

  if (webRecognition) {
    const rec = webRecognition;
    webRecognition = null;
    await waitForRecognitionEnd(rec);
    fallbackText = getWebTranscript() || fallbackText;
  }

  onInterimCb = null;
  const mime = webRecorder?.mimeType || 'audio/webm';
  return stopMediaRecorder(mime, fallbackText);
}

function cancelWeb(): void {
  if (webRecognition) {
    try {
      webRecognition.stop();
    } catch {
      /* ignore */
    }
    webRecognition = null;
  }
  if (webRecorder && webRecorder.state !== 'inactive') {
    try {
      webRecorder.stop();
    } catch {
      /* ignore */
    }
  }
  webRecorder = null;
  webChunks = [];
  webStream?.getTracks().forEach((t) => t.stop());
  webStream = null;
  webTranscript = '';
  onInterimCb = null;
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

export async function startRecording(onInterim?: (text: string) => void): Promise<void> {
  if (isRecording()) return;
  if (Platform.OS === 'web') {
    await startWeb(onInterim);
    return;
  }
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
    return (
      (webRecorder != null && webRecorder.state === 'recording') || webRecognition != null
    );
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

/** Current browser transcript while listening (web only) */
export function getLiveTranscript(): string {
  return getWebTranscript();
}
