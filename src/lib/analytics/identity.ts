import type { ReminderContact } from '$lib/features/questionnaire/answers';
import { getLocale } from '$lib/paraglide/runtime';
import { identifyVisitor, setProfileOnce } from './client';
import { isTrackablePath } from './events';

/**
 * Who the visitor is, as Mixpanel stores it. Kept apart from `events.ts` because an event
 * describes something that happened and these describe the person it happened to: a profile
 * outlives the session, and it is the one place this project sends a personal identifier to
 * analytics at all.
 *
 * **The e-mail travels from 2026-09-14**, at the user's decision, and it is also the
 * `distinct_id`. What it buys is a profile Customer.io already keys on the same way, so a
 * cohort here can drive a campaign there. What it costs is in `AGENTS.md`: replay is on for
 * the questionnaire, so a recording of somebody answering medical questions becomes
 * searchable by their address. Identifying by a hash was offered and declined.
 *
 * What may never travel did not move: no answer value, no anamnesis uid, no medication, no
 * dose. Both builders name every field they send, one line each, so widening them is a
 * visible edit rather than a spread that quietly grew.
 */

/**
 * Mixpanel's reserved keys, which is what makes the panel show a person rather than a property.
 *
 * A type alias rather than an interface, and not incidentally: only an alias gets the implicit
 * index signature that lets a closed record be passed to the SDK's `Record<string, ...>` seam.
 * An interface here fails the typecheck.
 */
export type ProfileTraits = {
	$email: string;
	$first_name?: string;
	$last_name?: string;
	$phone?: string;
};

export type FirstVisitProperties = {
	first_locale: string;
	first_landing_path?: string;
	initial_utm_source?: string;
	initial_utm_medium?: string;
	initial_utm_campaign?: string;
	initial_utm_content?: string;
	initial_utm_term?: string;
};

/** Answered, rather than answered with nothing. The same rule `readReminderContact` applies. */
function present(value: string | undefined): string | undefined {
	const trimmed = value?.trim();

	return trimmed ? trimmed : undefined;
}

export function profileTraits(contact: ReminderContact): ProfileTraits {
	const traits: ProfileTraits = { $email: contact.email.trim() };

	// Field by field, never a spread of the contact. `ReminderContact` is a closed record and
	// this keeps it one: a field added to it cannot travel until somebody writes its line.
	const firstName = present(contact.firstName);
	if (firstName) traits.$first_name = firstName;

	const lastName = present(contact.lastName);
	if (lastName) traits.$last_name = lastName;

	const phone = present(contact.phone);
	if (phone) traits.$phone = phone;

	return traits;
}

/**
 * The first visit, as the profile will remember it. A questionnaire path is left out for the
 * reason `isTrackablePath` gives, and the reason matters more here than it does for a page
 * view: a profile property is written once and kept, so a landing path naming the step
 * somebody deep-linked into would report an answer for as long as the profile exists.
 */
export function firstVisitProperties(url: URL, locale: string): FirstVisitProperties {
	const properties: FirstVisitProperties = { first_locale: locale };

	if (isTrackablePath(url.pathname)) properties.first_landing_path = url.pathname;

	/**
	 * First-touch attribution, written here because the SDK's own is unreachable in this app.
	 *
	 * `mixpanel.init` does call `people.set_once` with the initial campaign parameters, but
	 * `set_once` is wrapped in an opt-out check (`addOptOutCheckMixpanelPeople`) and
	 * `opt_out_tracking_by_default` is on, so at that moment the call returns early and is never
	 * even queued. `opt_in_tracking()` runs on the next line, one line too late. The parameters
	 * are therefore lost for every visitor, which a browser run proved and reading the SDK did
	 * not: consent-gated initialisation and first-touch attribution do not combine by themselves.
	 *
	 * Named one line each rather than built from the query string, the rule `events.ts` and
	 * `payload.ts` both follow: a sixth parameter is a visible edit, not a loop that widened.
	 */
	const campaign = url.searchParams;
	const source = present(campaign.get('utm_source') ?? undefined);
	if (source) properties.initial_utm_source = source;

	const medium = present(campaign.get('utm_medium') ?? undefined);
	if (medium) properties.initial_utm_medium = medium;

	const name = present(campaign.get('utm_campaign') ?? undefined);
	if (name) properties.initial_utm_campaign = name;

	const content = present(campaign.get('utm_content') ?? undefined);
	if (content) properties.initial_utm_content = content;

	const term = present(campaign.get('utm_term') ?? undefined);
	if (term) properties.initial_utm_term = term;

	return properties;
}

/**
 * One-shot, guarded the way `events.ts` guards its own, and marked spent only once the gate
 * accepted it. A visitor who arrives from an advert answers the consent banner while standing
 * on the landing page, so a shot spent against a gate that refused would lose the first visit
 * for good.
 */
const sent = new Set<string>();

function once(key: string, send: () => boolean): void {
	if (sent.has(key)) return;

	if (send()) sent.add(key);
}

/**
 * The first visit's properties, queued rather than sent: the SDK holds every People call until
 * an `identify` flushes the queue, so these reach Mixpanel when the address is typed, carrying
 * the values they had on arrival. Without this the profile would only ever learn where the
 * visitor was standing when they gave their e-mail.
 */
export function recordFirstVisit(url: URL): void {
	once('first-visit', () => setProfileOnce(firstVisitProperties(url, getLocale())));
}

/**
 * The anonymous session becomes a person. Called on every Continue and guarded above, so a
 * visitor who consents after passing the details screen is identified on a later one.
 *
 * **Once, with the first address, and never again.** Somebody who goes back and edits the
 * e-mail keeps the identity they were given: re-identifying to a second `distinct_id` in one
 * session is the standard way to corrupt a profile, and the reminder behaves the same way for
 * the same reason.
 */
export function identifyFromContact(contact: ReminderContact): void {
	once('identify', () => identifyVisitor(contact.email.trim(), profileTraits(contact)));
}
