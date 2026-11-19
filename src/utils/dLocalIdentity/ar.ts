// Argentina: DNI (7-8 digits, no check digit) and CUIT/CUIL (11 digits, mod 11 check digit).
import { applyPattern } from './pattern';
import type { DLocalIdentityRule } from './types';

const CUIT_PATTERN = '##-########-#';
const PERSON_PREFIXES = ['20', '23', '24', '25', '26', '27'];
const COMPANY_PREFIXES = ['30', '33', '34'];
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function sanitize(value: string) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 11);
}

/** Looks at the raw (masked) value because a dash typed after 2 digits is a CUIT/CUIL hint. */
export function detectArDocument(value: string): 'DNI' | 'CUIT' | null {
  const raw = String(value ?? '').trim();
  const s = sanitize(raw);
  if (!s) return null;
  if (s.length > 8) return 'CUIT';
  if (/^\d{2}-/.test(raw)) return 'CUIT';
  return 'DNI';
}

export function formatArDocument(value: string) {
  const raw = String(value ?? '');
  const s = sanitize(raw);
  if (detectArDocument(raw) === 'CUIT') return applyPattern(raw, s, CUIT_PATTERN);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // DNI: 12.345.678
}

export function isValidDNI(value: string) {
  return /^\d{7,8}$/.test(sanitize(value));
}

export function isValidCUIT(value: string) {
  const s = sanitize(value);
  if (!/^\d{11}$/.test(s)) return false;
  const prefix = s.slice(0, 2);
  if (!PERSON_PREFIXES.includes(prefix) && !COMPANY_PREFIXES.includes(prefix)) return false;
  let dv = 11 - (CUIT_WEIGHTS.reduce((sum, w, i) => sum + Number(s[i]) * w, 0) % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) return false; // no valid number exists for this body
  return Number(s[10]) === dv;
}

export function isValidArDocument(value: string) {
  const s = sanitize(value);
  if (s.length === 11) return isValidCUIT(s);
  return isValidDNI(s);
}

export const AR: DLocalIdentityRule = {
  label: 'DNI/CUIT/CUIL',
  maxLength: CUIT_PATTERN.length,
  inputMode: 'numeric',
  normalize: sanitize,
  format: formatArDocument,
  isValid: isValidArDocument,
};
