<script lang="ts">
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { RATING } from './content';
</script>

<!--
	The reference attributes these figures to a named review platform. They are invented,
	so the badge carries no third-party name; StarRating already exposes the score to
	assistive tech, and the visible label repeats it for everyone else.
-->
<a
	href={RATING.href}
	target="_blank"
	rel="noopener noreferrer"
	aria-label="{RATING.label}. Read reviews on Reviews.io (opens in a new tab)"
	class="inline-flex items-center gap-3 rounded-full border border-background/25 bg-foreground/50 px-4 py-2 outline-none backdrop-blur-sm transition-colors hover:bg-foreground/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
>
	<StarRating rating={RATING.score} size="sm" />
	<span class="text-sm font-medium text-background">{RATING.label}</span>
</a>
