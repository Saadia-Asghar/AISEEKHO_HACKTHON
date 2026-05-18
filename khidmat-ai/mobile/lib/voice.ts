import { Audio } from 'expo-av';
import { readAsStringAsync } from 'expo-file-system/legacy';

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
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
  recording = rec;
}

export async function stopRecordingBase64(): Promise<{ base64: string; mimeType: string }> {
  if (!recording) {
    throw new Error('Not recording');
  }
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  if (!uri) {
    throw new Error('No recording URI');
  }
  const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
  const mimeType = uri.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm';
  return { base64, mimeType };
}

export function isRecording() {
  return recording != null;
}
