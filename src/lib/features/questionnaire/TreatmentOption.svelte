<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { findTreatment } from '$lib/domain';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import PillIcon from '@lucide/svelte/icons/pill';
	import SyringeIcon from '@lucide/svelte/icons/syringe';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import { ROUTES, FEATURED_ARTICLE_SLUG } from '$lib/features/marketing/content';

	interface Props {
		treatmentId: string;
		controlId: string;
		invalid: boolean;
		describedBy: string | undefined;
	}

	let { treatmentId, controlId, invalid, describedBy }: Props = $props();

	const treatment = $derived(findTreatment(treatmentId));
	const nameId = $derived(`${controlId}-name`);
	const detailId = $derived(`${controlId}-detail`);
</script>

{#if treatment}
	<!--
		The reference shows a product photograph per treatment. None exist in this repository,
		and reusing one generic photo for all three would state something false about the
		products, so the form carries the distinction instead: a syringe or a tablet.

		The row is a plain container, not one big label: the "Learn more" link has to sit
		inside the card as the reference draws it, and nested in a label activating it would
		also select the option. The label covers the icon and the copy, which is the part
		worth clicking, and reaches the radio through `for`.
	-->
	<div
		class="flex items-center gap-4 rounded-md border border-border bg-card p-4 transition-colors has-data-checked:border-primary has-data-checked:bg-surface-subtle"
	>
		<label for={controlId} class="flex flex-1 cursor-pointer items-center gap-4">
			<span
				aria-hidden="true"
				class="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-warm text-foreground"
			>
				{#if treatment.form === 'tablet'}
					<PillIcon class="size-6" />
				{:else}
					<SyringeIcon class="size-6" />
				{/if}
			</span>

			<span class="flex-1">
				<span class="flex flex-wrap items-center gap-2">
					<span id={nameId} class="font-display text-lg font-semibold text-foreground">
						{treatment.name}
					</span>
					<Badge variant={treatment.form === 'tablet' ? 'highlight' : 'accent'}>
						{treatment.form}
					</Badge>
				</span>
				<span id={detailId} class="mt-1 block text-sm text-muted-foreground">{treatment.claim}</span>
			</span>
		</label>

		<!-- Named with the treatment: "Learn more" alone repeats three times on this screen. -->
		<a
			href={ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)}
			class="hidden shrink-0 items-center gap-1.5 rounded-sm text-sm text-foreground underline underline-offset-4 outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
		>
			<span class="sr-only">Learn more about {treatment.name}</span>
			<span aria-hidden="true">Learn more</span>
			<ExternalLinkIcon aria-hidden="true" class="size-3.5" />
		</a>

		<!--
			Named by the product alone, described by its form and claim, so three options do not
			announce as one long run of text with the product buried in it.
		-->
		<RadioGroup.Item
			id={controlId}
			value={treatment.id}
			aria-labelledby={nameId}
			aria-describedby={[detailId, describedBy].filter(Boolean).join(' ')}
			aria-invalid={invalid ? 'true' : undefined}
		/>
	</div>

	<!-- Narrow screens have no room for the link in the row, so it sits under the card. -->
	<a
		href={ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)}
		class="mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm text-foreground underline underline-offset-4 outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
	>
		Learn more about {treatment.name}
		<ExternalLinkIcon aria-hidden="true" class="size-3.5" />
	</a>
{/if}
