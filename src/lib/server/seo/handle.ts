import type { Handle } from '@sveltejs/kit';
import { pageMayIndex } from '$lib/seo/indexing';
import { seoPolicy } from './config';

export const handleSeo: Handle = async ({ event, resolve }) => {
	const requestOrigin = event.url.origin;
	const response = await resolve(event);
	const indexable = pageMayIndex(seoPolicy(), {
		requestOrigin,
		routeId: event.route.id,
		previewEnabled: event.locals.sanity?.previewEnabled ?? false,
		status: response.status,
		contentType: response.headers.get('content-type')
	});
	if (indexable) return response;

	// Some redirect responses have immutable headers. Preserve the body stream and other flags.
	const headers = new Headers(response.headers);
	headers.append('X-Robots-Tag', 'noindex');
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};
