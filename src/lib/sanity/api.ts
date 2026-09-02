import { env } from '$env/dynamic/public';
import { PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID } from '$env/static/public';

/**
 * Read through `$env`, not `process.env`: this module is imported by the browser client, where
 * `process.env` does not exist. The read token stays out of this file for the same reason, in
 * `client.server.ts`.
 *
 * The two values the site cannot run without are static, so a missing one fails the build rather
 * than a request. The three with a fallback are dynamic, because a static import fails the build
 * on an absent variable and Vercel will not store an empty one: an optional variable would have to
 * be given an untrue value just to let the build finish.
 */
function required(value: string | undefined, name: string): string {
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value;
}

export const projectId = required(PUBLIC_SANITY_PROJECT_ID, 'PUBLIC_SANITY_PROJECT_ID');
export const dataset = required(PUBLIC_SANITY_DATASET, 'PUBLIC_SANITY_DATASET');
export const apiVersion = env.PUBLIC_SANITY_API_VERSION || '2026-09-02';
export const studioUrl = env.PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333';

/**
 * Empty in every real environment, where the client talks to Sanity directly. The browser
 * harness sets it to the fixture server so a test run never leaves the machine.
 */
export const apiHost = env.PUBLIC_SANITY_API_HOST || '';
