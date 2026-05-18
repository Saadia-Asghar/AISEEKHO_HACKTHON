export async function startRecording(): Promise<void> {
  throw new Error('Voice is available in the mobile app only');
}

export async function stopRecordingBase64(): Promise<{ base64: string; mimeType: string }> {
  throw new Error('Voice is available in the mobile app only');
}

export function isRecording() {
  return false;
}
