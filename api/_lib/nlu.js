const SERVICE_PATTERNS = [
  [/ac\s*tech|ac\s*technician|a\.?c\.?|air\s*condition/i, 'ac_technician', 'AC Technician'],
  [/clean|cleaner|safai|صفائی/i, 'cleaner', 'Cleaner'],
  [/plumb|pipe|leak|paani|pani/i, 'plumber', 'Plumber'],
  [/electric|bijli|wiring|wire/i, 'electrician', 'Electrician'],
  [/tutor|tuition|padhai|teacher|math|ٹیوٹر/i, 'tutor', 'Home Tutor'],
  [/beauti|salon|makeup|hair/i, 'beautician', 'Beautician'],
  [/carpent|furniture|wood/i, 'carpenter', 'Carpenter'],
  [/paint|painter/i, 'painter', 'Painter'],
  [/computer|laptop|pc|window|software/i, 'pc_repair', 'PC Repair'],
  [/appliance|geyser|microwave|fridge/i, 'appliance_repair', 'Appliances'],
  [/car|auto|tuning|mechanic/i, 'car_mechanic', 'Car Repair'],
];

const LOCATION_RE =
  /\b([A-Z]-\d{1,2}|G-\d{1,2}|F-\d{1,2}|I-\d{1,2}|DHA\s*Phase\s*\d+|Islamabad|Rawalpindi|Bahria|DHA|Blue\s*Area)\b/i;

const TIME_PATTERNS = [
  [/kal\s*subah|tomorrow\s*morning|next\s*morning/i, 'tomorrow_morning', 'Tomorrow morning'],
  [/kal\s*shaam|tomorrow\s*evening/i, 'tomorrow_evening', 'Tomorrow evening'],
  [/kal|tomorrow/i, 'tomorrow', 'Tomorrow'],
  [/aaj\s*shaam|today\s*evening/i, 'today_evening', 'Today evening'],
  [/aaj|today|abhi|urgent|jaldi|right\s*now/i, 'today', 'Today'],
  [/subah|morning/i, 'morning', 'Morning'],
  [/shaam|evening/i, 'evening', 'Evening'],
];

const URGENCY_RE = /urgent|jaldi|abhi|right\s*now|فوری/i;

function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'urdu';
  const lower = text.toLowerCase();
  if (['mujhe', 'chahiye', 'kal', 'subah', 'mein'].some((m) => lower.includes(m))) return 'roman_urdu';
  return 'english';
}

function extractService(text) {
  const lower = text.toLowerCase();
  for (const [re, key, label] of SERVICE_PATTERNS) {
    if (re.test(lower) || re.test(text)) return { service_type: key, service_label: label };
  }
  return { service_type: 'general', service_label: 'General Service' };
}

function extractLocation(text) {
  const match = text.match(LOCATION_RE);
  if (match) {
    let val = match[1];
    if (/dha/i.test(val)) return 'DHA';
    const upper = val.toUpperCase();
    if (upper.length <= 4 && upper.includes('-')) return upper;
    return val.toLowerCase() === 'blue area' ? 'Blue Area' : upper;
  }
  if (/islamabad/i.test(text)) return 'Islamabad';
  return 'G-13';
}

function extractTime(text) {
  for (const [re, key, label] of TIME_PATTERNS) {
    if (re.test(text)) return { parsed_datetime_hint: key, time_expression: label };
  }
  return { parsed_datetime_hint: 'flexible', time_expression: 'As soon as available' };
}

/** Regex NLU — same rules as backend `app/services/nlu.py`. */
function parseIntent(message) {
  const { service_type, service_label } = extractService(message);
  const { parsed_datetime_hint, time_expression } = extractTime(message);
  return {
    raw_message: message.trim(),
    language: detectLanguage(message),
    service_type,
    service_label,
    location: extractLocation(message),
    time_expression,
    parsed_datetime_hint,
    urgency: URGENCY_RE.test(message),
  };
}

module.exports = { parseIntent };
