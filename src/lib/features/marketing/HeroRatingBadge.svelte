<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { RATING } from './content';
	import { formatRating, formatScore, type Rating } from './reviews';

	interface Props {
		/** Null when Reviews.io could not be reached, which the fallback figures answer. */
		rating: Rating | null;
	}

	let { rating }: Props = $props();

	const shown = $derived(rating ?? RATING.fallback);
	const label = $derived(formatRating(shown));
</script>

<!--
	The platform is named here because the figures are now its own, read from its public API on
	the server. The accessible name says it once: repeating it would have the badge announce
	"Reviews.io" twice in a row.
-->
<a
	href={RATING.href}
	target="_blank"
	rel="noopener noreferrer"
	aria-label={m.rating_badge_label({
		score: formatScore(shown.score),
		total: shown.total,
		platform: RATING.platform
	})}
	class="inline-flex items-center gap-2 rounded-full border border-background/25 bg-foreground/50 px-3 py-2 outline-none backdrop-blur-sm transition-colors hover:bg-foreground/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground sm:gap-3 sm:px-4"
>
	<span class="text-xs font-semibold text-background sm:text-sm">{RATING.platform}</span>
	<StarRating rating={shown.score} size="sm" />
	<!--
		The five stars are 116px whatever else happens, so on a phone the badge would otherwise
		run the width of the frame. The count drops from the visible line there, not from the
		accessible name, and the results band prints it in full further down the page.
	-->
	<span class="text-xs font-medium text-background sm:hidden">{formatScore(shown.score)}</span>
	<span class="hidden text-sm font-medium text-background sm:inline">{label}</span>
</a>
