import {
	isReminderStage,
	type ReminderPerson,
	type ReminderStage
} from '$lib/server/customerio/payload';
import { baseLocale, isLocale } from '$lib/paraglide/runtime';

/**
 * What the browser is allowed to say, and the whole of it. Separated from the route so the
 * rule can be tested without a request, and kept deliberately narrow: this endpoint is
 * public, so its input is hostile input.
 */

/** RFC 5321's practical ceiling. Longer is not an address, it is a payload. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Room for a real name and a real number, and no room for prose. Neither is validated for
 * correctness: a name has no shape worth asserting, and a telephone number typed by a person
 * in Germany may carry spaces, slashes, a country code or none of it.
 */
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 32;

/**
 * Control characters, which no name or number contains and which are how a value typed here
 * would try to become a second line of something downstream.
 */
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Shape, not correctness. Nothing here can tell a real mailbox from an invented one, and
 * pretending otherwise with a longer pattern would only reject unusual but valid addresses.
 * Customer.io is the one that finds out whether it delivers.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type ValidationFailure = 'bad-stage' | 'bad-email';

export type ValidationResult =
	| { ok: true; stage: ReminderStage; person: ReminderPerson; language: string }
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

/**
 * The name and the telephone number, which the reminder carries from 2026-09-05 so a mail can
 * greet somebody by name.
 *
 * **Unusable is absent, never a 400.** They follow the language's rule rather than the
 * address's: the address is the identifier and a call without one is meaningless, while a name
 * that arrives too long or with a control character in it costs a greeting, not the reminder.
 * This endpoint may never be a reason a questionnaire fails.
 */
function readOptionalDetail(value: unknown, maxLength: number): string | undefined {
	if (typeof value !== 'string') return undefined;

	const trimmed = value.trim();
	if (!trimmed || trimmed.length > maxLength || CONTROL_CHARACTERS.test(trimmed)) return undefined;

	return trimmed;
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

	return {
		ok: true,
		stage: source.stage,
		// Field by field, so the body cannot widen what reaches the processor by carrying a key
		// this app has never heard of.
		person: {
			email,
			firstName: readOptionalDetail(source.firstName, MAX_NAME_LENGTH),
			lastName: readOptionalDetail(source.lastName, MAX_NAME_LENGTH),
			phone: readOptionalDetail(source.phone, MAX_PHONE_LENGTH)
		},
		language: readLanguage(source.language)
	};
}
