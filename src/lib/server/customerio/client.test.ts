import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const { basicAuth, reminderConfigured, sendReminderEvent, wasAccepted } = await import('./client');

/** `sid:key` base64-encoded, so the expectation is not just the implementation repeated. */
const EXPECTED_HEADER = 'Basic c2lkOmtleQ==';

/**
 * The address alone, so the language assertion below still proves nothing else is invented on
 * the way out. What the record may carry is `payload.test.ts`'s subject.
 */
const PERSON = { email: 'jonas@example.com' };

function configure(siteId?: string, apiKey?: string): void {
	mockEnv.CUSTOMERIO_SITE_ID = siteId;
	mockEnv.CUSTOMERIO_TRACK_API_KEY = apiKey;
}

function answerWith(status: number, body: string) {
	return vi.fn().mockResolvedValue(new Response(body, { status }));
}

beforeEach(() => configure('sid', 'key'));
afterEach(() => vi.unstubAllGlobals());

describe('basicAuth', () => {
	it('encodes the pair as HTTP Basic', () => {
		expect(basicAuth('sid', 'key')).toBe(EXPECTED_HEADER);
	});

	it('refuses a half-configured deployment rather than authenticating badly', () => {
		// The failure this prevents is a 401 on every single questionnaire, which is much worse
		// than a deployment that knowingly sends no reminders.
		expect(basicAuth(undefined, 'key')).toBeNull();
		expect(basicAuth('sid', undefined)).toBeNull();
		expect(basicAuth('', 'key')).toBeNull();
		expect(basicAuth('sid', '   ')).toBeNull();
	});
});

describe('wasAccepted', () => {
	it('accepts the documented success, a 200 with an empty object', () => {
		// Brevo answered 204 and this answers 200. Carrying the old check across unchanged would
		// have reported every successful send as a failure.
		expect(wasAccepted(true, '{}')).toBe(true);
	});

	it('refuses a batch that answered 200 while rejecting an entry', () => {
		// The submitted stage is a batch, and a batch reports per-entry failures inside the body.
		// Reading the status alone would accept a call whose identify or event was dropped.
		expect(wasAccepted(true, '{"errors":[{"reason":"invalid"}]}')).toBe(false);
	});

	it('accepts a 200 carrying an empty errors array', () => {
		expect(wasAccepted(true, '{"errors":[]}')).toBe(true);
	});

	it('accepts a 200 whose body is not JSON', () => {
		// A response shape we did not anticipate is not worth losing a reminder over.
		expect(wasAccepted(true, 'OK')).toBe(true);
	});

	it('refuses anything that was not a 2xx', () => {
		expect(wasAccepted(false, '{}')).toBe(false);
	});
});

describe('reminderConfigured', () => {
	it('is true only when both credentials are present', () => {
		expect(reminderConfigured()).toBe(true);

		configure(undefined, 'key');
		expect(reminderConfigured()).toBe(false);

		configure('sid', undefined);
		expect(reminderConfigured()).toBe(false);
	});
});

describe('sendReminderEvent', () => {
	it('sends the capture to the EU batch endpoint with the Basic header', async () => {
		const fetchMock = answerWith(200, '{}');
		vi.stubGlobal('fetch', fetchMock);

		await expect(sendReminderEvent('email_captured', PERSON, 'de')).resolves.toBe('sent');

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://track-eu.customer.io/api/v2/batch');
		expect(init.headers.authorization).toBe(EXPECTED_HEADER);
	});

	it('carries the language the campaign branches on', async () => {
		const fetchMock = answerWith(200, '{}');
		vi.stubGlobal('fetch', fetchMock);

		await sendReminderEvent('email_captured', PERSON, 'en');

		const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(sent.batch[0].attributes).toEqual({ language: 'en' });
	});

	it('sends the submission to the batch endpoint', async () => {
		const fetchMock = answerWith(200, '{}');
		vi.stubGlobal('fetch', fetchMock);

		await expect(sendReminderEvent('submitted', PERSON, 'de')).resolves.toBe('sent');
		expect(fetchMock.mock.calls[0][0]).toBe('https://track-eu.customer.io/api/v2/batch');
	});

	it('makes no call at all when the deployment is not configured', async () => {
		configure(undefined, undefined);
		const fetchMock = answerWith(200, '{}');
		vi.stubGlobal('fetch', fetchMock);

		await expect(sendReminderEvent('email_captured', PERSON, 'de')).resolves.toBe('not-configured');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reports a refusal as failed', async () => {
		vi.stubGlobal('fetch', answerWith(400, '{"errors":[{"reason":"bad"}]}'));

		await expect(sendReminderEvent('email_captured', PERSON, 'de')).resolves.toBe('failed');
	});

	it('reports a network that went away as failed rather than throwing', async () => {
		// The caller answers 204 to a visitor either way, so this must resolve, never reject.
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

		await expect(sendReminderEvent('email_captured', PERSON, 'de')).resolves.toBe('failed');
	});
});
