import { env } from '$env/dynamic/private';

/**
 * Sanity signs each webhook body and sends the result as
 * `sanity-webhook-signature: t=<unix-ms>,v1=<base64url HMAC-SHA256>`, computed over
 * `<t>.<raw body>` with the shared secret.
 *
 * Verified here with Web Crypto rather than `@sanity/webhook` or Node's `crypto`. The vendor
 * package is not a dependency, and the Customer.io client already set the rule this follows:
 * nothing on a request path may assume the Node runtime rather than the edge one.
 */
const HEADER = 'sanity-webhook-signature';

/**
 * How old a signed request may be. The endpoint is idempotent, so replay is a nuisance rather
 * than a compromise, but an unbounded window means a single captured request stays valid
 * forever, and five minutes costs a legitimate webhook nothing.
 */
const MAX_AGE_MS = 5 * 60 * 1000;

export function webhookSecret(): string | null {
	return env.SANITY_WEBHOOK_SECRET?.trim() || null;
}

/** `t=...,v1=...` in either order, ignoring any future `v2` the vendor adds beside them. */
function parseHeader(header: string | null): { timestamp: number; signature: string } | null {
	if (!header) return null;

	const parts = new Map(
		header
			.split(',')
			.map((part) => part.trim().split('='))
			.filter((pair): pair is [string, string] => pair.length === 2)
			.map(([name, value]) => [name.trim(), value.trim()])
	);

	const timestamp = Number(parts.get('t'));
	const signature = parts.get('v1');
	if (!signature || !Number.isFinite(timestamp)) return null;

	return { timestamp, signature };
}

/**
 * Constant time, on purpose.
 *
 * A short-circuiting `===` on a digest leaks how many leading characters were right, which is
 * enough to forge one byte at a time. The length is compared first because the loop needs a
 * fixed bound, and a wrong length is not a secret worth protecting.
 */
function equalInConstantTime(a: string, b: string): boolean {
	if (a.length !== b.length) return false;

	let difference = 0;
	for (let index = 0; index < a.length; index += 1) {
		difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}

	return difference === 0;
}

function base64Url(bytes: ArrayBuffer): string {
	const binary = String.fromCharCode(...new Uint8Array(bytes));

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function sign(secret: string, timestamp: number, body: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	return base64Url(
		await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`))
	);
}

/**
 * Whether this request really came from our Sanity project.
 *
 * `body` must be the exact bytes that arrived. Parsing the JSON and re-serialising it changes
 * key order and whitespace, and the signature covers the original, so a re-serialised body
 * never verifies.
 *
 * An unconfigured secret refuses everything. This is the opposite of the reminder's "absent
 * credentials mean this deployment does not send": there, an absent credential disables an
 * outbound courtesy, while here it would disable the only thing standing in front of one.
 */
export async function verifyWebhook(
	headers: Headers,
	body: string,
	now = Date.now()
): Promise<boolean> {
	const secret = webhookSecret();
	if (!secret) return false;

	const parsed = parseHeader(headers.get(HEADER));
	if (!parsed) return false;

	// Both directions: a clock ahead of ours is as much a sign of a forged timestamp as one
	// far behind.
	if (Math.abs(now - parsed.timestamp) > MAX_AGE_MS) return false;

	return equalInConstantTime(parsed.signature, await sign(secret, parsed.timestamp, body));
}
