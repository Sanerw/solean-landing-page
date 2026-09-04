<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { RATING } from './content';
	import { formatScore, type Rating } from './reviews';

	interface Props {
		/** Null when Reviews.io could not be reached, which the fallback figures answer. */
		rating: Rating | null;
	}

	let { rating }: Props = $props();

	const shown = $derived(rating ?? RATING.fallback);
</script>

<!--
	The score carries the rating and the stars restate it, so the platform is named once, in
	the summary line. The accessible name says it once too: repeating it would have the block
	announce "Reviews.io" twice in a row.
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
	class="inline-flex items-center gap-3 rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
>
	<span class="font-display text-3xl font-medium leading-none text-background sm:text-4xl">
		{formatScore(shown.score)}
	</span>
	<span>
		<StarRating rating={shown.score} treatment="inline" surface="dark" />
		<!--
			The count is formatted for the page's own locale rather than one fixed market: a
			German visitor reads 1.200 where an English one reads 1,200.
		-->
		<span class="mt-1 block text-xs font-semibold text-background/85">
			{m.rating_reviews_on({
				count: shown.total.toLocaleString(getLocale()),
				platform: RATING.platform
			})}
		</span>
	</span>
</a>
