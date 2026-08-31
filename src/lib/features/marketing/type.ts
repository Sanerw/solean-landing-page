/** Shared type ladders, so a scale is changed here rather than in every section. */

/** Section heading. The reference draws these at 64px on its 1920px canvas. */
export const SECTION_HEADING =
	'font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl';

/** Half the section scale, for a block the reference deliberately keeps quiet. */
export const SUB_HEADING =
	'font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl';

/** The paragraph directly under a section heading. */
export const SECTION_LEAD = 'mt-4 max-w-2xl text-base text-muted-foreground md:text-lg';

/** Heading inside a card, tile, or list row. */
export const CARD_HEADING = 'font-display text-lg font-semibold text-foreground md:text-xl';
