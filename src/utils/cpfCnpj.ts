// CPF (11 digits) and CNPJ (14 chars, alphanumeric since 2026) helpers.
// CNPJ: the first 12 positions accept [0-9A-Z], the last 2 (check digits) are always digits.

const CPF_PATTERN = '###.###.###-##';
const CNPJ_PATTERN = '##.###.###/####-##';

export const CPF_CNPJ_MAX_LENGTH = CNPJ_PATTERN.length;

/** Uppercases and removes everything except [0-9A-Z]. This is the value sent to the backend. */
export function normalizeCpfCnpj(value: string) {
  return String(value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/** Normalizes and caps at 14 chars; letters are only accepted in the first 12 positions. */
function sanitize(value: string) {
  let out = '';
  for (const ch of normalizeCpfCnpj(value)) {
    if (out.length >= 14) break;
    const isDigit = ch >= '0' && ch <= '9';
    if (!isDigit && out.length >= 12) continue;
    out += ch;
  }
  return out;
}

/**
 * Decides the document type while typing. Looks at the raw (masked) value because
 * the separators the user typed are also a hint.
 */
export function detectCpfCnpj(value: string): 'CPF' | 'CNPJ' | null {
  const raw = String(value ?? '').toUpperCase().trim();
  const s = sanitize(raw);
  if (!s) return null;
  if (!/^\d+$/.test(s) || s.length > 11) return 'CNPJ'; // has a letter or more than 11 chars
  if (raw.includes('/')) return 'CNPJ'; // slash only exists in CNPJ
  if (/^\d{2}\./.test(raw)) return 'CNPJ'; // dot after 2 digits: CNPJ (CPF puts it after 3)
  return 'CPF';
}

export function formatCpfCnpjMask(value: string) {
  const raw = String(value ?? '');
  const s = sanitize(raw);
  const pattern = detectCpfCnpj(raw) === 'CNPJ' ? CNPJ_PATTERN : CPF_PATTERN;
  let out = '';
  let i = 0;
  let k = 0;
  for (; k < pattern.length && i < s.length; k++) {
    out += pattern[k] === '#' ? s[i++] : pattern[k];
  }
  // Keep a separator the user just typed if it is the next char in the pattern
  if (/[./-]$/.test(raw.trim()) && k < pattern.length && pattern[k] !== '#') {
    out += pattern[k];
  }
  return out;
}

function checkDigit(sum: number) {
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export function isValidCPF(value: string) {
  const s = normalizeCpfCnpj(value);
  if (!/^\d{11}$/.test(s)) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // 11111111111 etc.
  const d = [...s].map(Number);
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += d[i] * (length + 1 - i);
    return checkDigit(sum);
  };
  return calc(9) === d[9] && calc(10) === d[10];
}

export function isValidCNPJ(value: string) {
  const s = normalizeCpfCnpj(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(s)) return false;
  if (/^(.)\1{13}$/.test(s)) return false; // 00000000000000 etc.
  const v = [...s.slice(0, 12)].map((ch) => ch.charCodeAt(0) - 48); // '0'->0, 'A'->17
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  const dv1 = checkDigit(w1.reduce((a, w, i) => a + v[i] * w, 0));
  v.push(dv1);
  const dv2 = checkDigit(w2.reduce((a, w, i) => a + v[i] * w, 0));
  return s.slice(12) === `${dv1}${dv2}`;
}

export function isValidCpfCnpj(value: string) {
  const s = normalizeCpfCnpj(value);
  if (s.length === 11 && /^\d+$/.test(s)) return isValidCPF(s);
  if (s.length === 14) return isValidCNPJ(s);
  return false;
}
