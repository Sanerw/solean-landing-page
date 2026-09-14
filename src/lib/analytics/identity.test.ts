import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReminderContact } from '$lib/features/questionnaire/answers';

type Properties = Record<string, string | undefined>;

const client = vi.hoisted(() => ({
	identifyVisitor: vi.fn((_distinctId: string, _traits: Properties) => true),
	setProfileOnce: vi.fn((_properties: Properties) => true)
}));

vi.mock('./client', () => client);

/**
 * The one-shots are module state with the lifetime of one visit, so every case imports the
 * module fresh rather than reaching for a reset the production code would carry for the tests
 * alone. The same shape `reminder-client.test.ts` uses.
 */
async function freshIdentity() {
	vi.resetModules();

	return import('./identity');
}

const CONTACT: ReminderContact = {
	email: 'jonas@example.com',
	firstName: 'Jonas',
	lastName: 'Weber',
	phone: '+49 151 23456789'
};

/**
 * Recursive, and that is the point of it. The assertion is the exact set of keys that travels,
 * not the absence of a few known-bad ones, so a field added later fails a test instead of
 * reaching Mixpanel. `payload.test.ts` guards the Customer.io payload the same way.
 */
function keyPaths(value: unknown, prefix = ''): string[] {
	if (typeof value !== 'object' || value === null) return [];

	return Object.entries(value).flatMap(([key, nested]) => {
		const path = prefix ? `${prefix}.${key}` : key;

		return [path, ...keyPaths(nested, path)];
	});
}

describe('profileTraits', () => {
	it('sends the four contact fields and nothing else', async () => {
		const { profileTraits } = await freshIdentity();

		expect(keyPaths(profileTraits(CONTACT)).sort()).toEqual([
			'$email',
			'$first_name',
			'$last_name',
			'$phone'
		]);
	});

	it('omits a field that was not answered rather than sending it empty', async () => {
		const { profileTraits } = await freshIdentity();

		// An empty `$first_name` renders as "Hallo ," in a template where an absent one lets the
		// greeting fall back, which is the same reason the reminder omits it.
		const traits = profileTraits({ email: 'jonas@example.com', firstName: '  ' });

		expect(keyPaths(traits)).toEqual(['$email']);
	});

	it('keeps the address as the identity, trimmed', async () => {
		const { profileTraits } = await freshIdentity();

		expect(profileTraits({ email: '  jonas@example.com ' }).$email).toBe('jonas@example.com');
	});
});

const arrival = (path: string) => new URL(`https://solean.test${path}`);

describe('firstVisitProperties', () => {
	it('records where a public arrival landed', async () => {
		const { firstVisitProperties } = await freshIdentity();

		expect(firstVisitProperties(arrival('/learn/mounjaro-vs-wegovy'), 'de')).toEqual({
			first_locale: 'de',
			first_landing_path: '/learn/mounjaro-vs-wegovy'
		});
	});

	it('omits a questionnaire path, because the path is the answer', async () => {
		const { firstVisitProperties } = await freshIdentity();

		for (const path of ['/questionnaire', '/questionnaire/medication-history']) {
			expect(keyPaths(firstVisitProperties(arrival(path), 'de'))).toEqual(['first_locale']);
		}
	});

	it('keeps the campaign that brought the visitor, which the SDK drops on its own', async () => {
		const { firstVisitProperties } = await freshIdentity();

		// The SDK's own first-touch call is made while it is still opted out, so it never happens.
		// These are ours, and they are the whole of what makes a channel measurable here.
		const url = arrival('/?utm_source=meta&utm_medium=cpc&utm_campaign=q4&utm_content=a&utm_term=t');

		expect(firstVisitProperties(url, 'de')).toEqual({
			first_locale: 'de',
			first_landing_path: '/',
			initial_utm_source: 'meta',
			initial_utm_medium: 'cpc',
			initial_utm_campaign: 'q4',
			initial_utm_content: 'a',
			initial_utm_term: 't'
		});
	});

	it('carries no campaign key for an arrival that had none', async () => {
		const { firstVisitProperties } = await freshIdentity();

		expect(keyPaths(firstVisitProperties(arrival('/?utm_source='), 'de')).sort()).toEqual([
			'first_landing_path',
			'first_locale'
		]);
	});

	it('records the campaign even when the path is withheld', async () => {
		const { firstVisitProperties } = await freshIdentity();

		// A deep link into the funnel from an advert: the channel is worth knowing, the step is
		// an answer and stays out.
		const url = arrival('/questionnaire/about-you?utm_source=meta');

		expect(keyPaths(firstVisitProperties(url, 'de')).sort()).toEqual([
			'first_locale',
			'initial_utm_source'
		]);
	});
});

describe('the one-shots', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		client.identifyVisitor.mockReturnValue(true);
		client.setProfileOnce.mockReturnValue(true);
	});

	it('records the first visit once, however many navigations follow', async () => {
		const { recordFirstVisit } = await freshIdentity();

		recordFirstVisit(arrival('/'));
		recordFirstVisit(arrival('/treatments/mounjaro'));

		expect(client.setProfileOnce).toHaveBeenCalledTimes(1);
		expect(client.setProfileOnce.mock.calls[0]?.[0]).toMatchObject({ first_landing_path: '/' });
	});

	it('does not spend the shot on a gate that refused it', async () => {
		const { recordFirstVisit } = await freshIdentity();

		// The banner is answered on the page the visitor is standing on, so the first attempt is
		// routinely refused. Spending the shot there would lose the arrival for good.
		client.setProfileOnce.mockReturnValueOnce(false);

		recordFirstVisit(arrival('/'));
		recordFirstVisit(arrival('/'));

		expect(client.setProfileOnce).toHaveBeenCalledTimes(2);
	});

	it('identifies by the address, with the traits beside it', async () => {
		const { identifyFromContact } = await freshIdentity();

		identifyFromContact(CONTACT);

		expect(client.identifyVisitor).toHaveBeenCalledWith('jonas@example.com', {
			$email: 'jonas@example.com',
			$first_name: 'Jonas',
			$last_name: 'Weber',
			$phone: '+49 151 23456789'
		});
	});

	it('keeps the first address when somebody goes back and edits it', async () => {
		const { identifyFromContact } = await freshIdentity();

		identifyFromContact(CONTACT);
		identifyFromContact({ ...CONTACT, email: 'someone.else@example.com' });

		// A second `distinct_id` in one session is how a profile gets corrupted, so the identity
		// is the first address and stays it.
		expect(client.identifyVisitor).toHaveBeenCalledTimes(1);
		expect(client.identifyVisitor).toHaveBeenCalledWith(
			'jonas@example.com',
			expect.objectContaining({ $email: 'jonas@example.com' })
		);
	});
});
