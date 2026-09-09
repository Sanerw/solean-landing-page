/**
 * How long a rendered marketing page may sit in Vercel's shared cache.
 *
 * An hour, chosen by the user on 2026-09-09, and it deliberately re-opens what
 * `blueprint/history/fixes/home-page-edge-cache.md` closed in September: **a published edit can
 * take up to an hour to appear.** What makes that survivable is that a deploy keys its own
 * cache, so a redeploy shows an edit at once, and that the stale window after the hour is a
 * minute rather than the day the old header allowed.
 *
 * The point of it is the visitor who types the address: a hit is answered at the edge, so it
 * pays neither the render nor the cold start behind it, which measured 2.0 to 2.5 seconds.
 */
const ONE_HOUR = 3600;

export const EDGE_CACHE_CONTROL = `public, max-age=0, s-maxage=${ONE_HOUR}, stale-while-revalidate=60`;

/**
 * Nothing is cached while somebody is previewing: those responses carry draft content and the
 * source markers that draw the click-to-edit overlays, and a shared cache is exactly the wrong
 * place for either. Absent rather than `no-store`, because absent is already uncacheable here
 * and says less about what a future caller may do.
 */
export function edgeCacheControl(previewEnabled: boolean): string | null {
	return previewEnabled ? null : EDGE_CACHE_CONTROL;
}
