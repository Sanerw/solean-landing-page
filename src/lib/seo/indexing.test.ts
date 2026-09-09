import { describe, expect, it } from 'vitest';
import { deploymentMayIndex, pageMayIndex, type IndexingPolicy } from './indexing';

const policy: IndexingPolicy = {
	origin: 'https://solean-web.vercel.app',
	enabled: true,
	vercelEnvironment: 'production'
};
const publicPage = {
	requestOrigin: policy.origin!,
	routeId: '/(marketing)',
	previewEnabled: false,
	status: 200,
	contentType: 'text/html; charset=utf-8'
};

describe('indexing policy', () => {
	it('requires explicit launch approval even for the production domain', () => {
		expect(pageMayIndex(policy, publicPage)).toBe(true);
		expect(pageMayIndex({ ...policy, enabled: false }, publicPage)).toBe(false);
		expect(pageMayIndex({ ...policy, origin: null }, publicPage)).toBe(false);
	});

	it.each(['preview', 'development', 'unknown', ''])('never indexes Vercel %s', (environment) => {
		expect(pageMayIndex({ ...policy, vercelEnvironment: environment }, publicPage)).toBe(false);
	});

	it('allows explicit local verification with an exact matching origin', () => {
		expect(deploymentMayIndex({ ...policy, vercelEnvironment: undefined }, publicPage.requestOrigin))
			.toBe(true);
	});

	it('changing domain disables the old origin and permits the new one', () => {
		const nextPolicy = { ...policy, origin: 'https://launch.example' };
		expect(pageMayIndex(nextPolicy, publicPage)).toBe(false);
		expect(pageMayIndex(nextPolicy, { ...publicPage, requestOrigin: 'https://launch.example' }))
			.toBe(true);
	});

	it.each(['https://branch.vercel.app', 'https://solean-web.vercel.app.evil.test', 'http://solean-web.vercel.app'])
	('does not index an alias or different origin: %s', (requestOrigin) => {
		expect(pageMayIndex(policy, { ...publicPage, requestOrigin })).toBe(false);
	});

	it('does not expose Sanity drafts to indexing', () => {
		expect(pageMayIndex(policy, { ...publicPage, previewEnabled: true })).toBe(false);
	});

	it.each([null, '/dev/definition', '/dev/design-system', '/dev/sanity/[slug]',
		'/(questionnaire)/questionnaire', '/(questionnaire)/questionnaire/[step]',
		'/api/reminder', '/api/checkout', '/preview/enable', '/(marketing)/learn/blog'])
	('excludes internal, unknown and redirect routes: %s', (routeId) => {
		expect(pageMayIndex(policy, { ...publicPage, routeId })).toBe(false);
	});

	it.each(['/(marketing)/learn', '/(marketing)/learn/blog/[slug]',
		'/(marketing)/treatments/[slug]', '/(marketing)/privacy'])
	('permits a successfully served public page: %s', (routeId) => {
		expect(pageMayIndex(policy, { ...publicPage, routeId })).toBe(true);
	});

	it.each([204, 301, 302, 307, 308, 400, 404, 500, 503])('excludes response status %s', (status) => {
		expect(pageMayIndex(policy, { ...publicPage, status })).toBe(false);
	});

	it.each([null, 'application/json', 'text/plain', 'application/xml'])
	('does not index data responses with content type %s', (contentType) => {
		expect(pageMayIndex(policy, { ...publicPage, contentType })).toBe(false);
	});
});
