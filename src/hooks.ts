import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

/**
 * Client-side navigation never reaches `hooks.server.ts`, so the same de-localisation has to
 * happen in the router. Without this, clicking a link on `/de/...` would ask for a route that
 * does not exist.
 */
export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;
