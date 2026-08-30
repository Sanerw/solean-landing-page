<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const badges = [
		{ variant: 'accent', label: 'INJECTION' },
		{ variant: 'highlight', label: 'TABLET' },
		{ variant: 'secondary', label: 'PAUSED' },
		{ variant: 'destructive', label: 'DECLINED' }
	] as const;
</script>

<ShowcaseSection
	id="surfaces"
	title="Card, Badge and Separator"
	description="Cards sit on the card surface behind a hairline border, with no shadow. A static Card has no hover treatment; only an interactive Card takes hover and focus-visible, which is a design-system decision because no Card hover is captured in the references."
>
	<h3 class="font-display text-xl font-semibold">Card</h3>
	<div class="mt-6 grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Static Card</Card.Title>
				<Card.Description>Hovering this Card changes nothing.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-base text-muted-foreground">
					Used for testimonials, clinician profiles and bento panels, which are read, not
					clicked.
				</p>
			</Card.Content>
		</Card.Root>

		<a
			href="/dev/questionnaire"
			class="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<Card.Root class="h-full cursor-pointer transition-colors hover:bg-accent">
				<Card.Header>
					<Card.Title>Interactive Card</Card.Title>
					<Card.Description>Open the questionnaire model surface.</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-base text-muted-foreground">
						Hover reuses <code class="font-mono text-sm">accent</code>, matching the shared
						interaction-state table. The real link is keyboard focusable and Enter follows it.
					</p>
				</Card.Content>
			</Card.Root>
		</a>
	</div>

	<div class="mt-6">
		<Card.Root size="sm">
			<Card.Header>
				<Card.Title>Order summary</Card.Title>
			</Card.Header>
			<Card.Content class="text-base">
				<div class="flex items-center justify-between">
					<span>Treatment plan, first month</span>
					<span class="font-display font-semibold">144.00 EUR</span>
				</div>
				<Separator class="my-3" />
				<div class="flex items-center justify-between">
					<span>Initial treatment fee</span>
					<span class="font-display font-semibold">9.90 EUR</span>
				</div>
				<Separator class="my-3" />
				<div class="flex items-center justify-between">
					<span>Shipping</span>
					<span class="font-display font-semibold">Free</span>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Badge</h3>
	<div class="mt-6 flex flex-wrap items-center gap-3">
		{#each badges as badge (badge.variant)}
			<Badge variant={badge.variant}>{badge.label}</Badge>
		{/each}
	</div>
	<p class="mt-3 text-sm text-muted-foreground">
		Accent and highlight are the reference pairing, shown side by side on the treatment options.
		Secondary and destructive follow the shared token families.
	</p>

	<h3 class="mt-12 font-display text-xl font-semibold">Separator</h3>
	<div class="mt-6 max-w-md">
		<p class="text-base">Horizontal</p>
		<Separator class="my-4" />
		<p class="text-base">Divides stacked content and summary line items.</p>
	</div>
	<div class="mt-8 flex h-10 items-center gap-4 text-base">
		<span>Vertical</span>
		<Separator orientation="vertical" />
		<span>Divides inline metadata.</span>
		<Separator orientation="vertical" />
		<span>Like this.</span>
	</div>
</ShowcaseSection>
