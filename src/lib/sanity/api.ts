import {
	PUBLIC_SANITY_API_HOST,
	PUBLIC_SANITY_API_VERSION,
	PUBLIC_SANITY_DATASET,
	PUBLIC_SANITY_PROJECT_ID,
	PUBLIC_SANITY_STUDIO_URL
} from '$env/static/public';

/**
 * Read through `$env/static/public`, not `process.env`: this module is imported by the browser
 * client, and Vite replaces the former at build time while the latter does not exist there.
 * The read token stays out of this file for the same reason, in `client.server.ts`.
 */
function required(value: string | undefined, name: string): string {
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value;
}

export const projectId = required(PUBLIC_SANITY_PROJECT_ID, 'PUBLIC_SANITY_PROJECT_ID');
export const dataset = required(PUBLIC_SANITY_DATASET, 'PUBLIC_SANITY_DATASET');
export const apiVersion = PUBLIC_SANITY_API_VERSION || '2026-09-02';
export const studioUrl = PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333';

/**
 * Empty in every real environment, where the client talks to Sanity directly. The browser
 * harness sets it to the fixture server so a test run never leaves the machine.
 */
export const apiHost = PUBLIC_SANITY_API_HOST || '';
