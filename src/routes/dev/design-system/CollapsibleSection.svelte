<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ShowcaseSection from './ShowcaseSection.svelte';

	let open = $state(true);
</script>

<ShowcaseSection
	id="collapsible"
	title="Collapsible"
	description="Behavior only. A generic sequential section with a heading trigger and content region, matching the checkout disclosure rhythm. Progression between steps is CheckoutStep's job, built later; this only proves open and close."
>
	<Collapsible.Root bind:open class="max-w-md rounded-lg border border-border bg-card">
		<h3>
			<Collapsible.Trigger
				class="flex w-full items-center justify-between gap-4 p-4 text-left font-medium hover:bg-accent"
			>
				2. Shipping information
				<ChevronDownIcon
					aria-hidden="true"
					class="size-4 shrink-0 transition-transform duration-200 {open ? 'rotate-180' : ''}"
				/>
			</Collapsible.Trigger>
		</h3>
		<Collapsible.Content class="border-t border-border p-4 text-sm text-muted-foreground">
			A generic placeholder region. The real shipping fields belong to feature 9.
		</Collapsible.Content>
	</Collapsible.Root>

	<p class="mt-6 max-w-3xl text-sm text-muted-foreground">
		Tab to the heading, press Enter or Space to toggle. <code class="font-sans">aria-expanded</code>
		is set on the trigger automatically, and the closed region is removed from the accessibility
		tree rather than just hidden visually.
	</p>
</ShowcaseSection>
