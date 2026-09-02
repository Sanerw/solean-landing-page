<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { storiesFrom } from '$lib/features/marketing/from-sanity';
	import type { SanityTestimonial } from '$lib/sanity/queries';
	import { motivationInterstitial } from './interstitial-content';

	// Read during render so the copy follows the active locale.
	const COPY = $derived(motivationInterstitial());

	interface Props {
		oncontinue: () => void;
		/** Reused rather than restated: duplicated testimonials are a recorded reference defect. */
		stories: readonly SanityTestimonial[];
	}

	let { oncontinue, stories }: Props = $props();

	const TESTIMONIALS = $derived(storiesFrom(stories));

	// Continuing is a client-side navigation, so before hydration this button would do nothing
	// at all. Disabled until it works, like every other action in the questionnaire.
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	// The one testimonial with a portrait, which is the card the reference builds here.
	const story = $derived(TESTIMONIALS.find((testimonial) => testimonial.photo) ?? TESTIMONIALS[0]);
</script>

<p class="text-center font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
	{COPY.eyebrow}
</p>

<h1 class="mt-2 text-center font-display text-2xl font-medium sm:text-3xl">{COPY.headline}</h1>

<div class="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
	{#each COPY.body as line (line)}
		<p>{line}</p>
	{/each}
</div>

<!--
	A static story, not a player. The reference shows a play control and a duration, but no
	video asset exists and video is out of scope, so no affordance promises playback.
-->
<article class="mt-4 flex flex-col gap-3 rounded-lg bg-surface-warm p-4 sm:flex-row sm:items-center">
	{#if story.photo}
		<img
			src={story.photo.src}
			srcset={story.photo.srcset}
			alt=""
			decoding="async"
			sizes="80px"
			aria-hidden="true"
			width="96"
			height="96"
			class="size-20 shrink-0 rounded-lg object-cover"
		/>
	{/if}
	<div class="flex-1">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				{COPY.storyLabel}
			</p>
			<StarRating rating={story.rating} treatment="inline" />
		</div>
		<blockquote class="mt-1 text-sm text-foreground">
			<p>“{story.quote}”</p>
		</blockquote>
		<p class="mt-2 text-xs text-muted-foreground">
			<span class="font-medium text-foreground">{story.name}</span>
			· {story.memberLabel}
		</p>
	</div>
</article>

<div class="mt-3 grid gap-3 sm:grid-cols-2">
	{#each COPY.stats as stat (stat.figure)}
		<div class="rounded-lg bg-highlight p-4">
			<p class="font-display text-3xl font-medium text-foreground">{stat.figure}</p>
			<p class="mt-1 text-sm text-foreground">{stat.label}</p>
			<p class="mt-1 text-xs text-text-tertiary">{stat.source}</p>
		</div>
	{/each}
</div>

<p class="mt-3 text-center text-xs text-text-tertiary">{COPY.footnote}</p>

<Button
	type="button"
	size="default"
	class="relative mt-5 w-full"
	disabled={!hydrated}
	onclick={oncontinue}
>
	{m.q_continue()}
	<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
</Button>
