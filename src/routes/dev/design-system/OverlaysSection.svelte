<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const faqs = [
		{
			id: 'eligibility',
			question: 'Who is eligible for treatment?',
			answer:
				'A clinician reviews your questionnaire and decides whether treatment is appropriate. Eligibility is never confirmed automatically.'
		},
		{
			id: 'delivery',
			question: 'How is my treatment delivered?',
			answer:
				'A partner pharmacy dispenses and ships discreetly once a prescription has been issued. Delivery estimates always depend on clinical approval first.'
		},
		{
			id: 'pause',
			question: 'Can I pause my plan?',
			answer: 'The plan is billed monthly on a six month commitment and can be paused at any time.'
		}
	];
</script>

<ShowcaseSection
	id="overlays"
	title="Dialog, Sheet and Accordion"
	description="All three sit on the popover tokens behind a deep green veil. A neutral black scrim reads cold over the warm ground, so the overlay uses the foreground token at low alpha. Accordion hover reuses accent rather than introducing a hover token."
>
	<h3 class="font-display text-xl font-semibold">Dialog</h3>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Footer pairs an outline Button with the gold primary, as in the change-treatment reference.
	</p>
	<div class="mt-6">
		<Dialog.Root>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props}>Switch to an injection</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Switch to an injection</Dialog.Title>
					<Dialog.Description>
						Choose the injection you'd prefer. Your clinician will confirm whether it is safe and
						suitable for you.
					</Dialog.Description>
				</Dialog.Header>
				<div class="rounded-md border border-border bg-surface-subtle p-4 text-base">
					Current treatment: Wegovy Pill
				</div>
				<Dialog.Footer class="gap-3 sm:justify-between">
					<Dialog.Close>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Keep Wegovy Pill</Button>
						{/snippet}
					</Dialog.Close>
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props}>Confirm switch to Mounjaro</Button>
						{/snippet}
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Sheet</h3>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		No Sheet appears anywhere in the reference set, because the export has no mobile artboards. This
		is a considered adaptation reusing the Dialog's surface, radius and scrim tokens. Feature 3's
		mobile navigation is its first real consumer.
	</p>
	<div class="mt-6 flex flex-wrap gap-3">
		<Sheet.Root>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" {...props}>Open from the right</Button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content side="right">
				<Sheet.Header>
					<Sheet.Title>Menu</Sheet.Title>
					<Sheet.Description>The shape feature 3's mobile navigation will take.</Sheet.Description>
				</Sheet.Header>
				<nav class="flex flex-col gap-1 p-4">
					{#each ['How it works', 'Treatments', 'Pricing', 'Learn'] as item (item)}
						<a
							href="#overlays"
							class="rounded-md px-4 py-3 text-base transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							{item}
						</a>
					{/each}
				</nav>
			</Sheet.Content>
		</Sheet.Root>

		<Sheet.Root>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" {...props}>Open from the bottom</Button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content side="bottom">
				<Sheet.Header>
					<Sheet.Title>Bottom sheet</Sheet.Title>
					<Sheet.Description>The same surface, entering from a different edge.</Sheet.Description>
				</Sheet.Header>
				<div class="p-4 text-base text-muted-foreground">
					Useful for short mobile confirmations rather than full navigation.
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Accordion</h3>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		The references use two affordances: a chevron on the landing page FAQ and a plus on the learn
		article. The chevron wins and is used everywhere, rotating on expand.
	</p>
	<div class="mt-6 max-w-3xl rounded-lg border border-border bg-card">
		<Accordion.Root type="single">
			{#each faqs as faq (faq.id)}
				<Accordion.Item value={faq.id}>
					<Accordion.Trigger>{faq.question}</Accordion.Trigger>
					<Accordion.Content>
						<p class="text-muted-foreground">{faq.answer}</p>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
</ShowcaseSection>
