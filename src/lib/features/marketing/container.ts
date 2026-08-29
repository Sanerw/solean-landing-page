/**
 * The one horizontal rhythm every marketing section shares. Sections own their own
 * vertical spacing, so this deliberately carries none.
 */
export const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/**
 * The page gutter for the near-full-bleed cards (hero, footer). In the reference these
 * sit a little inside the viewport edge rather than inside the content container, so
 * they get the gutter without the max-width; their own contents then use CONTAINER, which
 * keeps text lined up with every other section.
 */
export const BLEED = 'px-4 sm:px-6 lg:px-8';
