export interface ProjectionPoint {
	/** Months from now. Spacing on the axis is ordinal, not proportional to this value. */
	month: number;
	label: string;
	kg: number;
}

export interface ProjectionHorizon {
	month: number;
	label: string;
}

/**
 * Chart geometry, kept free of Svelte and the DOM so it stays testable and so feature 8's
 * questionnaire interstitial can reuse it against the patient's own numbers.
 *
 * Coordinates are emitted in a 0-100 space on both axes. The SVG is stretched to its
 * container with preserveAspectRatio="none", which lets HTML markers and value pills be
 * positioned by the same percentages and land exactly on the plotted points at any size.
 * Strokes are kept uniform under that stretch with vector-effect, not by avoiding it.
 */

export interface PlottedPoint extends ProjectionPoint {
	/** Percent across the plot. Ordinal: milestones are evenly spaced, per the reference. */
	x: number;
	/** Percent down the plot, 0 at the top. */
	y: number;
}

export interface ProjectionGeometry {
	points: PlottedPoint[];
	comparison: PlottedPoint[];
	/** Now to the horizon. */
	solidPath: string;
	/** Horizon to the end. Empty when the horizon is the last milestone. */
	dottedPath: string;
	/** Closed shape under the solid segment only. */
	areaPath: string;
	comparisonPath: string;
	horizonIndex: number;
}

/**
 * The reference plots a 96 kg patient at 88, 82 and 78 kg, and the lifestyle comparison at
 * 94, 92 and 90. Those figures are the model: the ratios below reproduce them exactly at
 * 96 kg and scale to any other starting weight, so the landing page and the questionnaire
 * cannot disagree about the curve. Illustrative, not clinical.
 */
const MILESTONES = [
	{ month: 3, label: '3 months', treated: 88 / 96, lifestyle: 94 / 96 },
	{ month: 6, label: '6 months', treated: 82 / 96, lifestyle: 92 / 96 },
	{ month: 12, label: '12 months', treated: 78 / 96, lifestyle: 90 / 96 }
] as const;

/** The weight the reference plots, and the point at which the ratios are exact. */
export const REFERENCE_WEIGHT_KG = 96;

export interface WeightProjection {
	series: ProjectionPoint[];
	comparison: ProjectionPoint[];
}

/**
 * Applies the model to one starting weight. Whole kilograms, because the chart labels and
 * the headline both read as a weight a person would say out loud, not a measurement.
 */
export function buildWeightProjection(currentKg: number): WeightProjection {
	const now = Math.round(currentKg);
	const at = (ratio: number) => Math.round(currentKg * ratio);

	return {
		series: [
			{ month: 0, label: 'Now', kg: now },
			...MILESTONES.map((m) => ({ month: m.month, label: m.label, kg: at(m.treated) }))
		],
		comparison: [
			{ month: 0, label: 'Now', kg: now },
			...MILESTONES.map((m) => ({ month: m.month, label: m.label, kg: at(m.lifestyle) }))
		]
	};
}

export const PROJECTION_HORIZON_OPTIONS: readonly ProjectionHorizon[] = MILESTONES.map((m) => ({
	month: m.month,
	label: m.label
}));

/** Head-room above and below the data so the extreme points are not flush with the edges. */
const PADDING = 12;

function plot(series: readonly ProjectionPoint[], min: number, max: number): PlottedPoint[] {
	const span = max - min || 1;
	const lastIndex = Math.max(1, series.length - 1);

	return series.map((point, index) => ({
		...point,
		x: (index / lastIndex) * 100,
		// Inverted: a heavier weight sits higher up the chart, and y grows downward in SVG.
		y: PADDING + (1 - (point.kg - min) / span) * (100 - PADDING * 2)
	}));
}

/**
 * Catmull-Rom to cubic bezier, which gives the reference's eased curve while passing
 * exactly through every point. A plain quadratic midpoint smooth would miss the markers,
 * and the markers are what the value pills are pinned to.
 */
function curve(points: PlottedPoint[]): string {
	if (points.length === 0) return '';
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

	let d = `M ${points[0].x} ${points[0].y}`;
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] ?? points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] ?? p2;

		const c1x = p1.x + (p2.x - p0.x) / 6;
		const c1y = p1.y + (p2.y - p0.y) / 6;
		const c2x = p2.x - (p3.x - p1.x) / 6;
		const c2y = p2.y - (p3.y - p1.y) / 6;

		d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
	}
	return d;
}

/**
 * `horizonMonth` that matches no milestone falls back to the last one rather than
 * producing an empty chart, because a bad horizon should still render something truthful.
 */
export function buildProjection(
	series: readonly ProjectionPoint[],
	comparison: readonly ProjectionPoint[],
	horizonMonth: number
): ProjectionGeometry {
	const all = [...series, ...comparison];
	const min = Math.min(...all.map((p) => p.kg));
	const max = Math.max(...all.map((p) => p.kg));

	const points = plot(series, min, max);
	const plottedComparison = plot(comparison, min, max);

	const found = points.findIndex((p) => p.month === horizonMonth);
	const horizonIndex = found === -1 ? points.length - 1 : found;

	const solid = points.slice(0, horizonIndex + 1);
	// Overlaps by one point on purpose: the dotted run restarts at the horizon marker, so
	// the two segments meet exactly instead of leaving a gap the width of one interval.
	const dotted = points.slice(horizonIndex);

	const areaPath =
		solid.length < 2
			? ''
			: `${curve(solid)} L ${solid[solid.length - 1].x} 100 L ${solid[0].x} 100 Z`;

	return {
		points,
		comparison: plottedComparison,
		solidPath: curve(solid),
		dottedPath: dotted.length < 2 ? '' : curve(dotted),
		areaPath,
		comparisonPath: curve(plottedComparison),
		horizonIndex
	};
}
