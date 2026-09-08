/**
 * This page's own type ladder. It is one step below the landing page's, and deliberately:
 * the artboards set a section heading at 64px on the home page and 48px here, and a price at
 * 30px where the landing page's stats run to 40. A treatment page is a dense product screen,
 * not a poster, so reusing `marketing/type.ts` verbatim renders it larger than it is drawn.
 */

/** Section heading. The reference draws these at 48px on its 1920px canvas. */
export const SECTION_HEADING =
	'font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl';

/** The paragraph directly under a section heading. */
export const SECTION_LEAD = 'mt-3 max-w-2xl text-sm text-muted-foreground md:text-base';

/** Vertical rhythm for a section on the page ground, tighter than the landing page's. */
export const SECTION_Y = 'py-12 lg:py-16';
