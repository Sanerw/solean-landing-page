/**
 * Strips the invisible source markers Sanity embeds in every string while preview is on.
 *
 * The markers are what the Presentation tool turns into click-to-edit overlays, and they are
 * harmless in text. They are not harmless in a value used as *logic*: a lookup key, an icon
 * name, an href, a catalogue id. `BENTO_IMAGES['treatment' + markers]` is `undefined`, so a
 * previewed page silently loses its photographs while the live one keeps them.
 *
 * This is `stegaClean` from `@sanity/client`, reimplemented in three lines because that
 * package is not a dependency here and the one that re-exports it, `@sanity/sveltekit`, drags
 * Sanity UI's stylesheet in with it. The encoding uses only zero-width codepoints, verified
 * against `@vercel/stega` itself, so removing them returns exactly the original key.
 */
const STEGA = /[​-‍⁠-⁣﻿]/g;

export function plain(value: string): string;
export function plain(value: string | undefined): string | undefined;
export function plain(value: string | undefined): string | undefined {
	return value?.replace(STEGA, '');
}
