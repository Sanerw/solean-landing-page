/** The figures Reviews.io reports for the shop, once they have survived parsing. */
export interface Rating {
	/** 0 to 5, as the platform reports it, unrounded. */
	score: number;
	total: number;
}

const MAX_SCORE = 5;

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * `average_rating` arrives as a string and `total_reviews` as a number, but this is a third
 * party's shape on our homepage, so neither is trusted: anything that is not a real score and
 * a real count returns null and the caller shows its own figures instead.
 */
export function parseRating(body: unknown): Rating | null {
	const stats = record(record(body)?.stats);
	if (!stats) return null;

	const score = Number(stats.average_rating);
	const total = Number(stats.total_reviews);

	if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return null;
	if (!Number.isInteger(total) || total < 0) return null;

	return { score, total };
}

/** One decimal, which is how Reviews.io renders its own average. */
export function formatScore(score: number): string {
	return score.toFixed(1);
}

/**
 * The badge's own line. The count is spelled out rather than abbreviated: at this volume an
 * exact number is more credible than a rounded one, and it is the number the platform shows.
 */
export function formatRating(rating: Rating): string {
	const reviews = rating.total === 1 ? 'review' : 'reviews';

	return `${formatScore(rating.score)} - ${rating.total.toLocaleString('en-GB')} ${reviews}`;
}
