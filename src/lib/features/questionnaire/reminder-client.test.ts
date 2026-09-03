import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The watch is module state with the lifetime of one questionnaire session, so every case
 * imports the module fresh rather than reaching for a reset the production code would have to
 * carry for the tests alone.
 */
async function freshClient() {
	vi.resetModules();

	return import('./reminder-client');
}

function bodies(): { stage: string; email: string }[] {
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
		const data = { EMail: 'jonas@example.com' };

		// Continue is pressed on every step, and this runs on each one.
		for (let i = 0; i < 5; i++) startReminderWatch(data);

		expect(bodies()).toEqual([{ stage: 'email_captured', email: 'jonas@example.com' }]);
	});

	it('says nothing until the address exists', async () => {
		const { startReminderWatch } = await freshClient();

		startReminderWatch({});
		startReminderWatch({ EMail: '   ' });
		expect(fetch).not.toHaveBeenCalled();

		// The e-mail question can sit anywhere in the model, so the watch has to survive the
		// steps walked before it and still start on the one that answers it.
		startReminderWatch({ EMail: 'jonas@example.com' });
		expect(bodies()).toEqual([{ stage: 'email_captured', email: 'jonas@example.com' }]);
	});

	it('a session without an address is never reminded and never retried', async () => {
		const { startReminderWatch, endReminderWatch } = await freshClient();

		startReminderWatch({});
		endReminderWatch({});

		expect(fetch).not.toHaveBeenCalled();
	});

	it('ends the watch on submission, after the capture', async () => {
		const { startReminderWatch, endReminderWatch } = await freshClient();
		const data = { EMail: 'jonas@example.com' };

		startReminderWatch(data);
		endReminderWatch(data);

		expect(bodies()).toEqual([
			{ stage: 'email_captured', email: 'jonas@example.com' },
			{ stage: 'submitted', email: 'jonas@example.com' }
		]);
	});

	it('sends the stage, never a Brevo event name', async () => {
		// The server owns which automation a signal belongs to. A body naming the event would
		// hand that choice to whoever can reach the endpoint.
		const { endReminderWatch } = await freshClient();

		endReminderWatch({ EMail: 'jonas@example.com' });

		expect(bodies()[0].stage).toBe('submitted');
	});

	it('swallows a network failure rather than surfacing it', async () => {
		// A visitor answering medical questions must never see a marketing call fail, and no
		// caller awaits these, so a rejection here would surface as an unhandled rejection.
		vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
		const { startReminderWatch } = await freshClient();

		expect(() => startReminderWatch({ EMail: 'jonas@example.com' })).not.toThrow();
		await Promise.resolve();
	});
});
