/** WhatsApp wa.me deep link (matches backend notifications.whatsapp_deep_link). */
export function buildWhatsAppUrl(phone: string, message: string): string {
  let digits = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  else if (!digits.startsWith('92') && digits.length <= 11) digits = `92${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
