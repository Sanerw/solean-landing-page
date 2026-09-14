import { mixpanelApiHost, mixpanelToken } from './config';

/**
 * The one request this project makes to Mixpanel before anybody has answered the consent
 * banner, and the whole of what makes an experiment possible at all.
 *
 * **Built by hand rather than taken from the SDK, and that is the feature.** `mixpanel.flags`
 * lives inside the bundle this project imports only once somebody has agreed, so using it
 * would put sixty kilobytes of vendor code on the page of a visitor who then declines. The
 * SDK's own fetch turned out to be a plain tokened GET, so this is the same request in about
 * forty lines, with no bundle and nothing measured.
 *
 * It asks which variant to render and reports nothing. Every failure, a missing token, a
 * refusal, a malformed body, a network that is not there, answers with no variants at all,
 * and every caller then renders the control. An experiment that cannot be fetched is a page
 * that looks like today.
 */

/**
 * Every experiment this app runs, one constant each and never composed: the panel matches the
 * name literally, and a typo there raises nothing at all, it simply never assigns anybody.
 *
 * **Empty on purpose.** Feature 29d built the machinery and deliberately wired no experiment
 * to it, so that turning one on is a decision somebody takes rather than something that
 * shipped switched on. Adding the first one is three things: a name here, a component that
 * branches on `experiments.assignment(name)`, and its copy in the message catalogue.
 *
 * **What the panel controls and what it does not.** The panel owns whether an experiment runs,
 * how the traffic splits, and which variant a visitor gets. The copy of each variant lives in
 * the message catalogue, because this site is bilingual and a string typed into the panel
 * would be one language for both. So adding a wording is a deploy; changing the split, pausing
 * the test or picking the winner is not.
 */
export const EXPERIMENTS = {} as const;

/**
 * Mixpanel's own default names for the two arms of a flag. A component branches on
 * `VARIANT_TREATMENT`; anything else renders the control, which is the safe direction for a
 * typo in the panel.
 */
export const VARIANT_CONTROL = 'control';
export const VARIANT_TREATMENT = 'treatment';

/** `get_api_host('flags')` falls back to the configured host, and `api_routes.flags` is this. */
const FLAGS_PATH = '/flags/';

/** What the endpoint buckets on. Both ids are ours, generated per session and never stored. */
export interface FlagsContext {
	distinct_id: string;
	device_id: string;
}

export function flagsUrl(host: string, token: string, context: FlagsContext): string {
	const params = new URLSearchParams({
		context: JSON.stringify(context),
		token,
		mp_lib: 'web'
	});

	return `${host.replace(/\/+$/, '')}${FLAGS_PATH}?${params.toString()}`;
}

/** The token as HTTP Basic with an empty password, which is what the SDK sends. */
export function flagsHeaders(token: string): Record<string, string> {
	return { Authorization: `Basic ${btoa(`${token}:`)}` };
}

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * The response is `{ flags: { "<name>": { variant_key, variant_value } } }`, and only the key
 * is read: it is what the panel's report groups by and what a component branches on. A flag
 * whose key is missing or is not a string is dropped rather than defaulted, because a variant
 * this app invented would be reported as if the panel had assigned it.
 */
export function parseVariants(body: unknown): Map<string, string> {
	const variants = new Map<string, string>();
	const flags = record(record(body)?.flags);
	if (!flags) return variants;

	for (const [name, flag] of Object.entries(flags)) {
		const key = record(flag)?.variant_key;
		if (typeof key === 'string' && key.length > 0) variants.set(name, key);
	}

	return variants;
}

type Fetch = typeof globalThis.fetch;

export async function fetchVariants(
	context: FlagsContext,
	fetchImpl: Fetch = fetch
): Promise<Map<string, string>> {
	const token = mixpanelToken();
	// A deployment that does not measure does not experiment either, and that is a valid state
	// rather than a failure, exactly as it is for events.
	if (!token) return new Map();

	try {
		const response = await fetchImpl(flagsUrl(mixpanelApiHost(), token, context), {
			method: 'GET',
			headers: flagsHeaders(token)
		});
		if (!response.ok) return new Map();

		return parseVariants(await response.json());
	} catch {
		// Deliberately silent. An experiment is not worth an error in front of somebody, and
		// every caller already renders the control when there is no variant.
		return new Map();
	}
}
