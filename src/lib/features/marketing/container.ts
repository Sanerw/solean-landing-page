/** Shared content inset. Nested inside a bleed panel this is 1768px at 1920px. */
export const CONTAINER = 'mx-auto w-full px-4 sm:px-6 lg:px-16';

/** Near-full-width reference panels sit 12px inside the viewport edge. The narrow
    artboard has no such gutter: its sections run edge to edge and square. */
export const BLEED = 'sm:px-3';

/** The radius a bleed panel carries, which only exists once it has a gutter. */
export const PANEL_ROUND = 'sm:rounded-xl';

/** Vertical rhythm for a section sitting directly on the page ground. */
export const SECTION_Y = 'py-16 lg:py-20';

/** A bleed panel carries its own inset, so the gap around it and the padding
    inside it are two separate steps. The narrow artboard has no gap: its panels
    are full-bleed bands that meet, so a strip of page ground between them would
    read as a seam rather than as rhythm. */
export const PANEL_GAP_Y = 'sm:py-8';
export const PANEL_Y = 'py-12 lg:py-16';
