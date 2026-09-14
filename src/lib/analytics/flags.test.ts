import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_MIXPANEL_TOKEN: 'token-1', PUBLIC_MIXPANEL_API_HOST: 'https://api-eu.mixpanel.com' }
}));

import { fetchVariants, flagsHeaders, flagsUrl, parseVariants } from './flags';

const CONTEXT = { distinct_id: 'session-1', device_id: 'session-1' };

function answering(body: unknown, ok = true) {
	return vi.fn(() =>
		Promise.resolve({ ok, json: () => Promise.resolve(body) } as unknown as Response)
	);
}

describe('flagsUrl', () => {
	it('carries the context, the token and the library, and nothing else', () => {
		const url = new URL(flagsUrl('https://api-eu.mixpanel.com', 'token-1', CONTEXT));

		expect(url.origin + url.pathname).toBe('https://api-eu.mixpanel.com/flags/');
		expect([...url.searchParams.keys()].sort()).toEqual(['context', 'mp_lib', 'token']);
		expect(JSON.parse(url.searchParams.get('context') ?? '{}')).toEqual(CONTEXT);
	});

	it('does not double the slash on a host that carries one', () => {
		expect(flagsUrl('https://api-eu.mixpanel.com/', 'token-1', CONTEXT)).toContain(
			'https://api-eu.mixpanel.com/flags/?'
		);
	});
});

describe('flagsHeaders', () => {
	it('sends the token as Basic with an empty password, as the SDK does', () => {
		expect(flagsHeaders('token-1')).toEqual({ Authorization: `Basic ${btoa('token-1:')}` });
	});
});

describe('parseVariants', () => {
	it('reads the variant key of each flag', () => {
		const variants = parseVariants({
			flags: {
				hero_cta: { variant_key: 'b', variant_value: 'Jetzt starten' },
				other: { variant_key: 'control', variant_value: null }
			}
		});

		expect([...variants]).toEqual([
			['hero_cta', 'b'],
			['other', 'control']
		]);
	});

	it('drops a flag with no usable key rather than inventing one', () => {
		// A variant this app made up would be reported as if the panel had assigned it, which
		// is worse than no experiment: the result would look real.
		const variants = parseVariants({
			flags: { a: { variant_value: 'x' }, b: { variant_key: 42 }, c: { variant_key: '' } }
		});

		expect(variants.size).toBe(0);
	});

	it('answers empty for a body that is not the shape it expects', () => {
		for (const body of [null, undefined, 'nope', {}, { flags: null }, { flags: 'x' }]) {
			expect(parseVariants(body).size).toBe(0);
		}
	});
});

describe('fetchVariants', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('asks once and returns what the panel assigned', async () => {
		const fetchImpl = answering({ flags: { hero_cta: { variant_key: 'b' } } });

		expect([...(await fetchVariants(CONTEXT, fetchImpl))]).toEqual([['hero_cta', 'b']]);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it('renders the control when the endpoint refuses', async () => {
		const fetchImpl = answering({ flags: { hero_cta: { variant_key: 'b' } } }, false);

		expect((await fetchVariants(CONTEXT, fetchImpl)).size).toBe(0);
	});

	it('renders the control when the network is not there', async () => {
		// Every failure mode ends in no variants, because an experiment may never be the reason
		// a visitor sees an error or an empty page.
		const fetchImpl = vi.fn(() => Promise.reject(new Error('offline')));

		expect((await fetchVariants(CONTEXT, fetchImpl)).size).toBe(0);
	});

	it('renders the control when the body cannot be read', async () => {
		const fetchImpl = vi.fn(() =>
			Promise.resolve({ ok: true, json: () => Promise.reject(new Error('html')) } as unknown as Response)
		);

		expect((await fetchVariants(CONTEXT, fetchImpl)).size).toBe(0);
	});
});

describe('fetchVariants without a token', () => {
	it('asks nothing at all', async () => {
		vi.resetModules();
		vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_MIXPANEL_TOKEN: '  ' } }));

		const { fetchVariants: unconfigured } = await import('./flags');
		const fetchImpl = answering({ flags: {} });

		// A deployment that does not measure does not experiment either, and that is an ordinary
		// state rather than a failure.
		expect((await unconfigured(CONTEXT, fetchImpl)).size).toBe(0);
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
