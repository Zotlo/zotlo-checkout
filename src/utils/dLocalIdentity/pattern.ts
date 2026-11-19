/**
 * Fills `#` slots of the pattern with the sanitized characters. If the user just typed
 * a separator and the next pattern char is a separator, it is kept: the typed separator
 * is a hint for the document type and must survive re-masking.
 */
export function applyPattern(raw: string, sanitized: string, pattern: string) {
  let out = '';
  let i = 0;
  let k = 0;
  for (; k < pattern.length && i < sanitized.length; k++) {
    out += pattern[k] === '#' ? sanitized[i++] : pattern[k];
  }
  if (/[./-]$/.test(raw.trim()) && k < pattern.length && pattern[k] !== '#') {
    out += pattern[k];
  }
  return out;
}
