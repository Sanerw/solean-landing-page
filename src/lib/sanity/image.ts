import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { dataset, projectId } from '$lib/sanity/api';

// The named export, not the default: the default is deprecated and warns at runtime. Built from
// the project ids rather than the client so this module stays importable from a component
// without pulling the client into its chunk.
const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
	return builder.image(source);
}
