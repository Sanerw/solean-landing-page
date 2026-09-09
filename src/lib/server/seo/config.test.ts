import { beforeEach, describe, expect, it, vi } from 'vitest';

const { publicEnv, privateEnv } = vi.hoisted(() => ({
	publicEnv: {} as Record<string, string | undefined>,
	privateEnv: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));

import { seoPolicy } from './config';

beforeEach(() => {
	for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	for (const key of Object.keys(privateEnv)) delete privateEnv[key];
});

describe('SEO environment configuration', () => {
	it('defaults to disabled with no invented domain', () => {
		expect(seoPolicy()).toEqual({ origin: null, enabled: false, vercelEnvironment: undefined });
	});

	it.each([undefined, '', 'false', '1', 'yes', 'TRUE', ' true '])
	('does not treat %s as launch approval', (value) => {
		privateEnv.SEO_INDEXING_ENABLED = value;
		expect(seoPolicy().enabled).toBe(false);
	});

	it('reads updated configuration independently of commerce settings', () => {
		publicEnv.PUBLIC_SITE_URL = 'https://solean-web.vercel.app';
		publicEnv.PUBLIC_SHOPIFY_STORE_DOMAIN = 'shop.example';
		publicEnv.PUBLIC_RXSCALE_SHOP_IDENTIFIER = 'another.example';
		privateEnv.SEO_INDEXING_ENABLED = 'true';
		expect(seoPolicy()).toMatchObject({ origin: 'https://solean-web.vercel.app', enabled: true });
		publicEnv.PUBLIC_SITE_URL = 'https://launch.example';
		expect(seoPolicy().origin).toBe('https://launch.example');
	});

	it('refuses local HTTP on Vercel even if system environment metadata is missing', () => {
		publicEnv.PUBLIC_SITE_URL = 'http://localhost:4173';
		expect(seoPolicy().origin).toBe('http://localhost:4173');
		privateEnv.VERCEL = '1';
		expect(seoPolicy()).toMatchObject({ origin: null, vercelEnvironment: 'unknown' });
	});

	it('refuses local HTTP when only VERCEL_ENV is exposed', () => {
		publicEnv.PUBLIC_SITE_URL = 'http://localhost:4173';
		privateEnv.VERCEL_ENV = 'preview';
		expect(seoPolicy()).toMatchObject({ origin: null, vercelEnvironment: 'preview' });
	});
});
