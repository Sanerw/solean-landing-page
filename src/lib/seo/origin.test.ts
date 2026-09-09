import { describe, expect, it } from 'vitest';
import { parseSiteOrigin } from './origin';

describe('parseSiteOrigin', () => {
	it.each([
		['https://solean-web.vercel.app', 'https://solean-web.vercel.app'],
		[' https://EXAMPLE.com:443/ ', 'https://example.com'],
		['https://example.com:8443/', 'https://example.com:8443']
	])('normalizes %s', (value, expected) => {
		expect(parseSiteOrigin(value)).toBe(expected);
	});

	it.each([
		undefined, '', ' ', 'example.com', '//example.com', 'https:example.com',
		'http://example.com', 'ftp://example.com', 'javascript:alert(1)',
		'https://user:password@example.com', 'https://example.com/en',
		'https://@example.com', 'https://example.com/path/..',
		'https://example.com/?utm_source=test', 'https://example.com/#section',
		'https://example.com/?', 'https://example.com/#', 'https://exa mple.com',
		'https://example.com\\other', 'https://', 'https://example.com:bad'
	])('rejects invalid configuration %s without throwing', (value) => {
		expect(parseSiteOrigin(value)).toBeNull();
	});

	it.each(['http://localhost:4173', 'http://127.0.0.1:4173', 'http://[::1]:4173'])
	('accepts %s only in local verification mode', (value) => {
		expect(parseSiteOrigin(value)).toBeNull();
		expect(parseSiteOrigin(value, true)).toBe(value);
	});

	it.each(['http://example.com', 'http://localhost.example.com', 'http://192.168.0.1'])
	('does not extend the local HTTP exception to %s', (value) => {
		expect(parseSiteOrigin(value, true)).toBeNull();
	});
});
