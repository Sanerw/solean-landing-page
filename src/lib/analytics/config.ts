import { env } from '$env/dynamic/public';

/**
 * Dynamic rather than static env, for the reason `config/rxscale.ts` gives: a build must not
 * break when the token is absent, and one build has to be able to run without analytics at
 * all. An unconfigured token is not an error; it is a deployment that does not measure.
 */

/**
 * EU residency. The project this token belongs to lives in Mixpanel's European region, and a
 * token from an EU project sent to the US ingestion host is simply rejected, so this default
 * is part of the token rather than a preference.
 */
const DEFAULT_API_HOST = 'https://api-eu.mixpanel.com';

function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function mixpanelToken(): string | null {
	return configured(env.PUBLIC_MIXPANEL_TOKEN);
}

/**
 * Whether this deployment measures at all. Read on the server as well as in the browser, so
 * the consent banner is server-rendered or absent rather than appearing after hydration.
 * A deployment with no token must not ask for consent it has no use for.
 */
export function analyticsConfigured(): boolean {
	return mixpanelToken() !== null;
}

export function mixpanelApiHost(): string {
	return configured(env.PUBLIC_MIXPANEL_API_HOST) ?? DEFAULT_API_HOST;
}

/** Recording every consented session is the configured intent; the rest is quota. */
const DEFAULT_REPLAY_PERCENT = 100;

/**
 * Session replay is metered separately from events, so the share of sessions recorded has to
 * be tunable without a deploy: a month that runs into the plan's cap is turned down here
 * rather than in a release. A malformed value reads as an absent one, the same way every
 * other setting in this project treats a blank env var.
 */
export function clampReplayPercent(value: string | undefined): number {
	const trimmed = value?.trim();
	if (!trimmed) return DEFAULT_REPLAY_PERCENT;

	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed)) return DEFAULT_REPLAY_PERCENT;

	return Math.min(100, Math.max(0, parsed));
}

export function replaySessionsPercent(): number {
	return clampReplayPercent(env.PUBLIC_MIXPANEL_REPLAY_PERCENT);
}

/**
 * Whether this session is one of the recorded ones. The SDK samples internally, but recording
 * has to be started by name here (see `client.ts`), and `start_session_recording` forces a
 * recording regardless of the configured share. Sampling therefore happens on this side, by
 * the same rule the SDK uses, so turning the percentage down actually turns recording down.
 */
export function shouldRecordSession(percent: number, roll: number = Math.random()): boolean {
	return percent > 0 && roll * 100 <= percent;
}
