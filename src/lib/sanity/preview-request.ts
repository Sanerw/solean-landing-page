/**
 * Whether this request has anything to do with preview, and so whether it needs
 * `@sanity/sveltekit` at all.
 *
 * The package has one entry point and it statically imports the Studio: `PerspectiveProvider`,
 * `WorkspaceLoader`, React, Sanity UI. That graph was in the server bundle for every request,
 * and evaluating it cost 354 ms of every cold start, measured on 2026-09-09. It is now loaded
 * only when this returns true, which for an ordinary visitor is never.
 *
 * Both values are `handlePreviewMode`'s own defaults, which this app does not override. They
 * are duplicated here rather than imported, because importing them is the cost being avoided.
 * A change to either in `hooks.server.ts` has to be made here too, and `preview-request.test.ts`
 * is what says so.
 */
const PREVIEW_COOKIE = '__sanity_preview';

const PREVIEW_PATHS = ['/preview/enable', '/preview/disable'];

/**
 * The cookie is checked for presence, not validity. `handlePreviewMode` compares it against a
 * secret this module cannot see, so a forged or stale cookie still resolves to
 * `previewEnabled: false` there; it costs its sender the slow path and nobody else anything.
 * The alternative, guessing at validity here, would be a second implementation of the rule.
 */
export function isPreviewRequest(pathname: string, cookie: string | null): boolean {
	if (PREVIEW_PATHS.includes(pathname)) return true;

	return (
		cookie
			?.split(';')
			.some((part) => part.trim().startsWith(`${PREVIEW_COOKIE}=`)) ?? false
	);
}
