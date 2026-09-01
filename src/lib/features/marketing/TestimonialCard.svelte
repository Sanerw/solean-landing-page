<script lang="ts">
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { findTreatment } from '$lib/domain';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import PillIcon from '@lucide/svelte/icons/pill';
	import SyringeIcon from '@lucide/svelte/icons/syringe';
	import { TESTIMONIALS_SECTION, type Testimonial } from './content';

	interface Props {
		testimonial: Testimonial;
	}

	let { testimonial }: Props = $props();

	// Resolved from the catalogue, so a rename cannot leave a story advertising a
	// treatment that no longer exists.
	const treatment = $derived(findTreatment(testimonial.treatmentId));
	const onPhoto = $derived(Boolean(testimonial.photo));
</script>

<article
	class={[
		'relative isolate flex h-full flex-col overflow-hidden rounded-xl p-6 sm:p-8',
		onPhoto ? 'text-background' : 'bg-background text-foreground'
	]}
>
	{#if testimonial.photo}
		<enhanced:img
			src={testimonial.photo}
			alt=""
			aria-hidden="true"
			loading="lazy"
			decoding="async"
			sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
			class="absolute inset-0 -z-10 size-full object-cover"
		/>
		<!-- Contrast comes from the scrim, not the artwork, the same rule the hero follows.
		     Measured against a pure-white worst case rather than the image behind it. -->
		<div
			aria-hidden="true"
			class="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/85 via-foreground/70 to-foreground/90"
		></div>
	{/if}

	<p class="font-display text-4xl font-medium md:text-5xl">{testimonial.kgLost} kg</p>
	<p class={['mt-1 text-sm', onPhoto ? 'text-background/80' : 'text-muted-foreground']}>
		{TESTIMONIALS_SECTION.weightLostLabel}
	</p>

	<figure class="mt-6 flex flex-1 flex-col">
		<blockquote class="text-lg leading-snug">
			<p>&ldquo;{testimonial.quote}&rdquo;</p>
		</blockquote>

		<figcaption class="mt-auto pt-8">
			<span class="block font-semibold">{testimonial.name}</span>
			<span class={['block text-sm', onPhoto ? 'text-background/80' : 'text-muted-foreground']}>
				{testimonial.memberLabel}
			</span>

			<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
				<StarRating
					rating={testimonial.rating}
					size="sm"
					treatment="inline"
					surface={onPhoto ? 'dark' : 'default'}
				/>

				<div class="flex flex-col items-end gap-1">
					{#if treatment}
						<span
							class={[
								'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
								onPhoto ? 'bg-background text-foreground' : 'bg-accent text-accent-foreground'
							]}
						>
							{#if treatment.form === 'tablet'}
								<PillIcon aria-hidden="true" class="size-3.5" />
							{:else}
								<SyringeIcon aria-hidden="true" class="size-3.5" />
							{/if}
							{treatment.name}
						</span>
					{/if}
					{#if testimonial.verified}
						<span
							class={[
								'inline-flex items-center gap-1 text-xs',
								onPhoto ? 'text-background' : 'text-muted-foreground'
							]}
						>
							<BadgeCheckIcon aria-hidden="true" class="size-3.5" />
							{TESTIMONIALS_SECTION.verifiedLabel}
						</span>
					{/if}
				</div>
			</div>
		</figcaption>
	</figure>
</article>
