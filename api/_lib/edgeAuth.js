const { randomUUID } = require('crypto');

const GUEST_PHONE = '+923000000000';
const DEMO_OTP = '1234';
const sessions = new Map();

function sendOtp(phone) {
  return {
    ok: true,
    phone,
    twilio: false,
    demo_otp: DEMO_OTP,
    message: 'Demo OTP (Vercel edge): use 1234',
  };
}

function verifyOtp(phone, otp, name) {
  const normalized = phone.startsWith('+') ? phone : `+92${phone.replace(/\D/g, '')}`;
  if (otp !== DEMO_OTP && otp !== '1234') {
    throw new Error('Invalid OTP — demo code is 1234');
  }
  const userId = normalized === GUEST_PHONE ? 'USR_GUEST' : `USR_${randomUUID().slice(0, 8)}`;
  const token = `edge_${randomUUID().replace(/-/g, '')}`;
  const displayName = name || (normalized === GUEST_PHONE ? 'Guest' : 'User');
  sessions.set(token, userId);
  return {
    user_id: userId,
    name: displayName,
    token,
    user: { id: userId, name: displayName, phone: normalized },
  };
}

module.exports = { sendOtp, verifyOtp, GUEST_PHONE };
