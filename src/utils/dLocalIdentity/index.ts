import { AR } from './ar';
import { BR } from './br';
import { GENERIC } from './generic';
import type { DLocalIdentityRule } from './types';

export type { DLocalIdentityRule } from './types';

/** Countries with their own mask/validation. Others fall back to GENERIC. */
export const DLOCAL_IDENTITY_RULES: Record<string, DLocalIdentityRule> = { BR, AR };

export function hasDLocalIdentityRule(country?: string | null) {
  return !!country && Object.prototype.hasOwnProperty.call(DLOCAL_IDENTITY_RULES, country.toUpperCase());
}

export function getDLocalIdentityRule(country?: string | null): DLocalIdentityRule {
  return hasDLocalIdentityRule(country) ? DLOCAL_IDENTITY_RULES[country!.toUpperCase()] : GENERIC;
}

export function formatDLocalIdentity(country: string | null | undefined, value: string) {
  return getDLocalIdentityRule(country).format(value);
}

export function normalizeDLocalIdentity(country: string | null | undefined, value: string) {
  return getDLocalIdentityRule(country).normalize(value);
}

export function isValidDLocalIdentity(country: string | null | undefined, value: string) {
  return getDLocalIdentityRule(country).isValid(value);
}
