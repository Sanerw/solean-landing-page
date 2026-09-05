import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyAnswers, type Answers } from './answers/types';

/** A visitor who has answered the address, and by default the name beside it. */
function answering(email = '', details: Partial<Answers> = {}): Answers {
	return {
		...emptyAnswers(),
		email,
		firstName: email ? 'Jonas' : '',
		lastName: email ? 'Weber' : '',
		...details
	};
}

/** What the `your-details` screen produces when the phone is left blank, which is the default. */
const CAPTURED = {
	stage: 'email_captured',
	email: 'jonas@example.com',
	firstName: 'Jonas',
	lastName: 'Weber',
	language: 'de'
};

/**
 * The watch is module state with the lifetime of one questionnaire session, so every case
 * imports the module fresh rather than reaching for a reset the production code would have to
 * carry for the tests alone.
 */
async function freshClient() {
	vi.resetModules();

	return import('./reminder-client');
}

function bodies(): Record<string, unknown>[] {
	return vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
}

describe('reminder client', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sends the capture once, however many steps are walked', async () => {
		const { startReminderWatch } = await freshClient();
		const data = answering('jonas@example.com');

		// Continue is pressed on every step, and this runs on each one.
		for (let i = 0; i < 5; i++) startReminderWatch(data);

		expect(bodies()).toEqual([CAPTURED]);
	});

	it('says nothing until the address exists', async () => {
		const { startReminderWatch } = await freshClient();

		startReminderWatch(answering());
		startReminderWatch(answering('   '));
		expect(fetch).not.toHaveBeenCalled();

		// The e-mail question can sit anywhere in the model, so the watch has to survive the
		// steps walked before it and still start on the one that answers it.
		startReminderWatch(answering('jonas@example.com'));
		expect(bodies()).toEqual([CAPTURED]);
	});

	it('a session without an address is never reminded and never retried', async () => {
		const { startReminderWatch, endReminderWatch } = await freshClient();

		startReminderWatch(answering());
		endReminderWatch(answering());

		expect(fetch).not.toHaveBeenCalled();
	});

	it('ends the watch on submission, after the capture', async () => {
		const { startReminderWatch, endReminderWatch } = await freshClient();
		const data = answering('jonas@example.com');

		startReminderWatch(data);
		endReminderWatch(data);

		expect(bodies()).toEqual([CAPTURED, { ...CAPTURED, stage: 'submitted' }]);
	});

	it('carries the telephone number only when one was typed', async () => {
		// Optional in the questionnaire, so the key is absent rather than empty: an empty string
		// would overwrite a number the person gave on an earlier session with nothing.
		const { startReminderWatch, endReminderWatch } = await freshClient();

		startReminderWatch(answering('jonas@example.com'));
		expect(bodies()[0]).not.toHaveProperty('phone');

		endReminderWatch(answering('jonas@example.com', { phone: ' +49 170 1234567 ' }));
		expect(bodies()[1]).toMatchObject({ phone: '+49 170 1234567' });
	});

	it('sends the contact details and nothing else', async () => {
		// Exact keys rather than an absence check, so an answer added to the body later fails
		// here instead of reaching a marketing processor. This visitor also answered a diagnosis
		// and a weight; neither is the reminder's business.
		const { endReminderWatch } = await freshClient();

		endReminderWatch(
			answering('jonas@example.com', {
				phone: '+49 170 1234567',
				weightKg: '108',
				weightRelatedConditions: ['Type 2 Diabetes']
			})
		);

		expect(Object.keys(bodies()[0]).sort()).toEqual([
			'email',
			'firstName',
			'language',
			'lastName',
			'phone',
			'stage'
		]);
	});

	it('sends the stage, never a vendor event name', async () => {
		// The server owns which automation a signal belongs to. A body naming the event would
		// hand that choice to whoever can reach the endpoint.
		const { endReminderWatch } = await freshClient();

		endReminderWatch(answering('jonas@example.com'));

		expect(bodies()[0].stage).toBe('submitted');
	});

	it('swallows a network failure rather than surfacing it', async () => {
		// A visitor answering medical questions must never see a marketing call fail, and no
		// caller awaits these, so a rejection here would surface as an unhandled rejection.
		vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
		const { startReminderWatch } = await freshClient();

		expect(() => startReminderWatch(answering('jonas@example.com'))).not.toThrow();
		await Promise.resolve();
	});
});
