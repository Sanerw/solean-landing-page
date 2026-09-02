import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { dataset, projectId } from '$lib/sanity/api';

// The named export, not the default: the default is deprecated and warns at runtime. Built from
// the project ids rather than the client so this module stays importable from a component
// without pulling the client into its chunk.
const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
	return builder.image(source);
}

export interface SanityPicture {
	src: string;
	srcset: string;
	alt: string;
	/** Reserves the box before the bytes arrive, so a loading image cannot shift the layout. */
	width: number;
	height: number;
}

/**
 * Sanity encodes an asset's dimensions in its reference (`image-<hash>-<w>x<h>-<ext>`), which is
 * how a caller learns the source size without a second request. It replaces what `enhanced:img`
 * exposed as `img.w`.
 */
function dimensions(source: unknown): { width: number; height: number } {
	const ref = (source as { asset?: { _ref?: string } })?.asset?._ref ?? '';
	const match = ref.match(/-(\d+)x(\d+)-/);
	return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 0, height: 0 };
}

/**
 * Builds the `w`-descriptor srcset a responsive `<img>` needs, replacing what
 * `@sveltejs/enhanced-img` generated at build time before these photographs moved into the
 * Content Lake.
 *
 * The width lists are carried over from those imports rather than left to a default ladder, and
 * they are not decoration: `marketing-fidelity.spec.ts` measures every marketing image at four
 * viewports and fails when one is drawn at less than the density it carries. A generic ladder
 * starting at 540 hands a 40px avatar something several times too wide and a full-bleed hero
 * something too narrow, so each caller passes the widths its own frame actually uses.
 *
 * `auto=format` lets the CDN answer with AVIF or WebP by content negotiation, which is the same
 * choice the build step used to make ahead of time.
 */
export function picture(
	source: SanityImageSource & { alt?: string },
	widths: readonly number[]
): SanityPicture {
	const at = (width: number) => urlFor(source).width(width).auto('format').url();

	return {
		src: at(widths[widths.length - 1]),
		srcset: widths.map((width) => `${at(width)} ${width}w`).join(', '),
		alt: source.alt ?? '',
		...dimensions(source)
	};
}

/**
 * The same, for a frame with a fixed aspect: the CDN crops to the ratio around the hotspot the
 * editor set, so a portrait stays on the face when the frame is square.
 */
export function croppedPicture(
	source: SanityImageSource & { alt?: string },
	widths: readonly number[],
	ratio: number
): SanityPicture {
	const height = (width: number) => Math.round(width / ratio);
	const at = (width: number) =>
		urlFor(source).width(width).height(height(width)).fit('crop').auto('format').url();

	const widest = widths[widths.length - 1];

	return {
		src: at(widest),
		srcset: widths.map((width) => `${at(width)} ${width}w`).join(', '),
		alt: source.alt ?? '',
		// The crop's shape, not the source's, because the crop is what the browser draws.
		width: widest,
		height: height(widest)
	};
}
