import { isReminderStage, type ReminderStage } from '$lib/server/customerio/payload';
import { baseLocale, isLocale } from '$lib/paraglide/runtime';

/**
 * What the browser is allowed to say, and the whole of it. Separated from the route so the
 * rule can be tested without a request, and kept deliberately narrow: this endpoint is
 * public, so its input is hostile input.
 */

/** RFC 5321's practical ceiling. Longer is not an address, it is a payload. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Shape, not correctness. Nothing here can tell a real mailbox from an invented one, and
 * pretending otherwise with a longer pattern would only reject unusual but valid addresses.
 * Customer.io is the one that finds out whether it delivers.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type ValidationFailure = 'bad-stage' | 'bad-email';

export type ValidationResult =
	| { ok: true; stage: ReminderStage; email: string; language: string }
	| { ok: false; reason: ValidationFailure };

/**
 * The language the campaign picks its mail by, narrowed to a locale this app actually has.
 * Paraglide's own `isLocale` is the check, so the list cannot drift from the one the site is
 * built with.
 *
 * **An unusable value falls back rather than failing.** Only `de` or `en` can leave this app
 * either way, so nothing hostile travels; what a rejection would cost is the reminder itself,
 * and sending the base locale to somebody who walked away beats sending nothing.
 */
function readLanguage(value: unknown): string {
	return typeof value === 'string' && isLocale(value) ? value : baseLocale;
}

export function readReminderRequest(body: unknown): ValidationResult {
	const source = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

	// The stage, never the Customer.io event name. A caller that could name the event could choose
	// which automation fires; the mapping stays on this side.
	if (!isReminderStage(source.stage)) return { ok: false, reason: 'bad-stage' };

	const email = typeof source.email === 'string' ? source.email.trim() : '';
	if (email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(email)) {
		return { ok: false, reason: 'bad-email' };
	}

	return { ok: true, stage: source.stage, email, language: readLanguage(source.language) };
}
