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

// —— Web (MediaRecorder + optional SpeechRecognition for live text) ——
let webStream: MediaStream | null = null;
let webRecorder: MediaRecorder | null = null;
let webChunks: Blob[] = [];
let webRecognition: SpeechRecognition | null = null;
let webInterimText = '';
let webFinalText = '';
let onInterimCb: ((text: string) => void) | null = null;

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

async function startWeb(onInterim?: (text: string) => void): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone not available in this browser');
  }
  onInterimCb = onInterim ?? null;
  webInterimText = '';
  webFinalText = '';

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
  webRecorder.start(250);

  const Ctor = getSpeechRecognitionCtor();
  if (Ctor) {
    webRecognition = new Ctor();
    webRecognition.continuous = true;
    webRecognition.interimResults = true;
    webRecognition.lang = 'ur-PK';
    webRecognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let fin = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0]?.transcript ?? '';
        if (r.isFinal) fin += t;
        else interim += t;
      }
      if (fin) webFinalText = (webFinalText + fin).trim();
      webInterimText = interim.trim();
      const live = [webFinalText, webInterimText].filter(Boolean).join(' ').trim();
      if (live && onInterimCb) onInterimCb(live);
    };
    webRecognition.onerror = () => {};
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

async function stopWeb(): Promise<VoiceStopResult> {
  const fallbackText = [webFinalText, webInterimText].filter(Boolean).join(' ').trim();

  if (webRecognition) {
    try {
      webRecognition.stop();
    } catch {
      /* ignore */
    }
    webRecognition = null;
  }

  if (!webRecorder || webRecorder.state === 'inactive') {
    webStream?.getTracks().forEach((t) => t.stop());
    webStream = null;
    return { base64: '', mimeType: 'audio/webm', fallbackText };
  }

  return new Promise((resolve, reject) => {
    const recorder = webRecorder!;
    const mime = recorder.mimeType || 'audio/webm';

    recorder.onstop = async () => {
      try {
        webStream?.getTracks().forEach((t) => t.stop());
        webStream = null;
        webRecorder = null;
        const blob = new Blob(webChunks, { type: mime });
        webChunks = [];
        if (blob.size < 100) {
          resolve({ base64: '', mimeType: mime, fallbackText });
          return;
        }
        const base64 = await blobToBase64(blob);
        resolve({ base64, mimeType: mime, fallbackText });
      } catch (e) {
        reject(e);
      }
    };

    recorder.onerror = () => reject(new Error('Recording failed'));
    try {
      recorder.stop();
    } catch (e) {
      reject(e);
    }
  });
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
  webInterimText = '';
  webFinalText = '';
  onInterimCb = null;
}

// —— Native (expo-av, loaded only on iOS/Android) ——
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

/** Start mic — optional callback receives live transcript on web */
export async function startRecording(onInterim?: (text: string) => void): Promise<void> {
  if (isRecording()) return;
  if (Platform.OS === 'web') {
    await startWeb(onInterim);
    return;
  }
  await startNative();
}

/** Stop mic and return audio for API + optional browser fallback text */
export async function stopRecordingBase64(): Promise<VoiceStopResult> {
  if (Platform.OS === 'web') {
    return stopWeb();
  }
  return stopNative();
}

export function isRecording(): boolean {
  if (Platform.OS === 'web') {
    return webRecorder != null && webRecorder.state === 'recording';
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
