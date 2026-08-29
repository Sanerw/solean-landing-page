export interface Remaining {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Clamps at zero so an expired target counts down to 00:00:00:00 rather than negatives. */
export function remainingUntil(targetMs: number, nowMs: number): Remaining {
	const total = Math.max(0, targetMs - nowMs);

	return {
		days: Math.floor(total / DAY),
		hours: Math.floor((total % DAY) / HOUR),
		minutes: Math.floor((total % HOUR) / MINUTE),
		seconds: Math.floor((total % MINUTE) / SECOND)
	};
}

export function pad(value: number): string {
	return value.toString().padStart(2, '0');
}

/** The mock offer window. Fixed length, restarted per visit; there is no real promotion. */
export const OFFER_WINDOW_MS = 5 * HOUR + 12 * MINUTE + 42 * SECOND;
