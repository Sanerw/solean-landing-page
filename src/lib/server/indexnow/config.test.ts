import { beforeEach, describe, expect, it, vi } from 'vitest';

const { publicEnv, privateEnv } = vi.hoisted(() => ({
	publicEnv: {} as Record<string, string | undefined>,
	privateEnv: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));

import { indexNowKey, notificationsAllowed } from './config';

const ORIGIN = 'https://solean-web.vercel.app';
const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

/** Everything switched on, so each case below can turn exactly one thing off. */
function launched() {
	publicEnv.PUBLIC_SITE_URL = ORIGIN;
	privateEnv.SEO_INDEXING_ENABLED = 'true';
	privateEnv.VERCEL_ENV = 'production';
	privateEnv.INDEXNOW_KEY = KEY;
}

beforeEach(() => {
	for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	for (const key of Object.keys(privateEnv)) delete privateEnv[key];
});

describe('indexNowKey', () => {
	it('is absent by default, which is a deployment that notifies nobody', () => {
		expect(indexNowKey()).toBeNull();
	});

	it.each([KEY, 'abcd1234', 'A-VALID-KEY-1234'])('accepts %s', (key) => {
		privateEnv.INDEXNOW_KEY = key;
		expect(indexNowKey()).toBe(key);
	});

	it('trims, because an env var with a stray newline is a common accident', () => {
		privateEnv.INDEXNOW_KEY = `  ${KEY}\n`;
		expect(indexNowKey()).toBe(KEY);
	});

	// A key IndexNow would refuse on every submission is worse than no key: it fails on every
	// publish forever rather than visibly not being configured.
	it.each(['', '   ', 'short', 'has spaces in it', 'has/a/slash', 'ünïcode', 'a'.repeat(129)])(
		'refuses the unusable key %s',
		(key) => {
			privateEnv.INDEXNOW_KEY = key;
			expect(indexNowKey()).toBeNull();
		}
	);
});

describe('notificationsAllowed', () => {
	it('allows only a launched, configured deployment answering on its own origin', () => {
		launched();
		expect(notificationsAllowed(ORIGIN)).toBe(true);
	});

	it('sends nothing without a key, however launched the deployment is', () => {
		launched();
		delete privateEnv.INDEXNOW_KEY;
		expect(notificationsAllowed(ORIGIN)).toBe(false);
	});

	// Notifying a search engine about a page served `noindex` asks it to crawl what we told it
	// to ignore, so every gate 28a applies to indexing applies here too.
	it('sends nothing before indexing is launched', () => {
		launched();
		privateEnv.SEO_INDEXING_ENABLED = 'false';
		expect(notificationsAllowed(ORIGIN)).toBe(false);
	});

	it.each(['preview', 'development', 'unknown'])('sends nothing from a %s deployment', (env) => {
		launched();
		privateEnv.VERCEL_ENV = env;
		expect(notificationsAllowed(ORIGIN)).toBe(false);
	});

	it.each(['https://branch-xyz.vercel.app', 'https://solean-web.vercel.app.evil.test'])(
		'sends nothing for a webhook that arrived on %s',
		(requestOrigin) => {
			launched();
			expect(notificationsAllowed(requestOrigin)).toBe(false);
		}
	);

	it('sends nothing without a valid configured origin', () => {
		launched();
		publicEnv.PUBLIC_SITE_URL = 'not-a-url';
		expect(notificationsAllowed(ORIGIN)).toBe(false);
	});
});
