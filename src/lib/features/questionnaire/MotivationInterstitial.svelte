<script lang="ts">
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	// Reused rather than restated: duplicated testimonials are a recorded reference defect,
	// and the learn feature already sets the precedent for reading marketing content fixtures.
	import { TESTIMONIALS } from '$lib/features/marketing/content';
	import { MOTIVATION_INTERSTITIAL as COPY } from './interstitial-content';

	interface Props {
		oncontinue: () => void;
	}

	let { oncontinue }: Props = $props();

	// The one testimonial with a portrait, which is the card the reference builds here.
	const story = TESTIMONIALS.find((testimonial) => testimonial.photo) ?? TESTIMONIALS[0];
</script>

<p class="text-center font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
	{COPY.eyebrow}
</p>

<h1 class="mt-3 text-center font-display text-4xl font-medium sm:text-5xl">{COPY.headline}</h1>

<div class="mx-auto mt-4 max-w-xl text-center text-base text-muted-foreground md:text-lg">
	{#each COPY.body as line (line)}
		<p>{line}</p>
	{/each}
</div>

<!--
	A static story, not a player. The reference shows a play control and a duration, but no
	video asset exists and video is out of scope, so no affordance promises playback.
-->
<article class="mt-8 flex flex-col gap-4 rounded-lg bg-surface-warm p-6 sm:flex-row sm:items-center">
	{#if story.photo}
		<img
			src={story.photo}
			alt=""
			aria-hidden="true"
			width="96"
			height="96"
			class="size-24 shrink-0 rounded-lg object-cover"
		/>
	{/if}
	<div class="flex-1">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				{COPY.storyLabel}
			</p>
			<StarRating rating={story.rating} />
		</div>
		<blockquote class="mt-2 text-base text-foreground">
			<p>“{story.quote}”</p>
		</blockquote>
		<p class="mt-3 text-sm text-muted-foreground">
			<span class="font-medium text-foreground">{story.name}</span>
			· {story.memberLabel}
		</p>
	</div>
</article>

<div class="mt-4 grid gap-4 sm:grid-cols-2">
	{#each COPY.stats as stat (stat.figure)}
		<div class="rounded-lg bg-highlight p-6">
			<p class="font-display text-4xl font-medium text-foreground">{stat.figure}</p>
			<p class="mt-2 text-sm text-foreground">{stat.label}</p>
			<p class="mt-2 text-xs text-text-tertiary">{stat.source}</p>
		</div>
	{/each}
</div>

<p class="mt-6 text-center text-xs text-text-tertiary">{COPY.footnote}</p>

<Button type="button" size="lg" class="relative mt-10 w-full" onclick={oncontinue}>
	Continue
	<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
</Button>
