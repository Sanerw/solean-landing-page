import type { Action } from 'svelte/action';

/** Exactly what the decision reads, so neither a browser nor a test has to supply more. */
interface RevealCapabilities {
	IntersectionObserver?: unknown;
	matchMedia?: (query: string) => { matches: boolean };
}

/**
 * Whether an entrance may hide its element before playing it.
 *
 * False means the content is never hidden at all, which is the only safe default: without an
 * observer nothing would ever bring it back, and somebody who asked for less motion should get
 * the page as it is rather than a slower version of it.
 */
export function shouldReveal(win: RevealCapabilities): boolean {
	if (typeof win.IntersectionObserver !== 'function') return false;
	if (typeof win.matchMedia !== 'function') return false;

	return !win.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hides the element until it first scrolls into view, then lets CSS bring it in. The hidden
 * state is a data attribute rather than a class so the styling stays with the element that
 * uses it, and it is set here rather than in the markup because markup cannot ask whether the
 * browser will ever be able to undo it.
 */
export const reveal: Action<HTMLElement, number | undefined> = (node, delayMs = 0) => {
	if (!shouldReveal(window)) return;

	node.dataset.reveal = '';
	node.style.transitionDelay = `${delayMs}ms`;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;

				delete node.dataset.reveal;
				observer.disconnect();
			}
		},
		// A sliver of the element is not an arrival. Waiting for a tenth of it starts the
		// entrance when the eye is already there rather than at the edge of the viewport.
		{ threshold: 0.1 }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
