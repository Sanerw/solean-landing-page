import { urlFor } from '$lib/sanity/image';
import { plain } from '$lib/sanity/plain';
import type { OgImage } from './metadata';

/**
 * The card size every scraper is built around, 1.91:1. Facebook, LinkedIn, Slack and X all
 * crop to roughly this, so producing it here is what stops each of them cropping differently.
 */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

interface ImageSource {
	asset?: { _ref?: string };
	alt?: string;
}

/**
 * The sharing card for a photograph the page already displays.
 *
 * `undefined` when there is no photograph. A page without one shares as a plain card rather
 * than with a stand-in, because a stand-in is a picture of something the reader will not find.
 *
 * Three deliberate differences from `picture()` in `$lib/sanity/image`:
 *
 * - **A fixed crop, not a width ladder.** A scraper fetches one URL and reads no `srcset`.
 * - **`format('jpg')`, never `auto('format')`.** Content negotiation answers on the `Accept`
 *   header, and a scraper that sends none, or a permissive one, can be handed AVIF or WebP.
 *   Several social scrapers then store no image at all, which fails silently: the tags are
 *   present and correct and the card is still blank.
 * - **`fit('crop')`**, so the CDN crops to the card's shape around the hotspot an editor set
 *   rather than letterboxing or centring blindly.
 */
export function ogImage(source: ImageSource | undefined | null): OgImage | undefined {
	if (!source?.asset?._ref) return undefined;

	return {
		url: urlFor(source as Parameters<typeof urlFor>[0])
			.width(OG_WIDTH)
			.height(OG_HEIGHT)
			.fit('crop')
			.format('jpg')
			.url(),
		width: OG_WIDTH,
		height: OG_HEIGHT,
		alt: plain(source.alt ?? '')
	};
}
