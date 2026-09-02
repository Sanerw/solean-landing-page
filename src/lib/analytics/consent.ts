/**
 * Whether this visitor has agreed to analytics, and nothing else. The decision is a
 * first-party cookie rather than `localStorage` for one reason: the server has to know it
 * before it renders, or every page would flash a consent banner at a visitor who already
 * answered.
 *
 * Kept free of Mixpanel and of Svelte so both halves can be read on their own: the server
 * parses a request header with it, the browser writes a decision with it, and neither has to
 * load an analytics SDK to do so.
 */

export const CONSENT_COOKIE = 'solean_analytics_consent';

/** Null is a real answer here: nobody has decided yet, so the banner is still owed. */
export type ConsentDecision = 'granted' | 'denied';
export type ConsentState = ConsentDecision | null;

/**
 * Six months, the retention German supervisory authorities point at for a consent record.
 * Past it the question is asked again rather than assumed answered.
 */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

const DECISIONS: readonly ConsentDecision[] = ['granted', 'denied'];

/** Anything that is not one of the two decisions is an absent one, never a granted one. */
export function toDecision(value: string | undefined | null): ConsentState {
	return DECISIONS.find((decision) => decision === value) ?? null;
}

/**
 * The one rule the whole compliance story rests on: only an explicit yes tracks. A missing
 * cookie, a dismissed banner and a malformed value all read the same as a no.
 */
export function mayTrack(state: ConsentState): boolean {
	return state === 'granted';
}

export function serializeConsent(decision: ConsentDecision): string {
	const parts = [
		`${CONSENT_COOKIE}=${decision}`,
		'Path=/',
		`Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
		'SameSite=Lax'
	];

	// Omitted on http, because a Secure cookie is silently dropped there and the dev server
	// would then re-ask on every reload.
	if (typeof location !== 'undefined' && location.protocol === 'https:') parts.push('Secure');

	return parts.join('; ');
}
