<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { checkoutService } from '$lib/features/checkout/checkout-service';

	const selection = $derived(checkoutService.getSelection());
</script>

<svelte:head>
	<title>Guarded scenario · Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
	<p class="font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
		Development surface
	</p>
	<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">Guarded route</h1>
	<p class="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
		Reaching this page at all is the proof. It is guarded on the checkout stage, so it renders only
		when the questionnaire is complete and a treatment is selected. Any other session is redirected
		to the scenario page before this content paints.
	</p>

	<div class="mt-8 flex flex-wrap items-center gap-4">
		<Badge variant="accent">checkout stage entered</Badge>
		<p class="text-sm text-muted-foreground">
			Carried through: {selection.treatment?.name ?? 'no treatment'}
		</p>
	</div>

	<div class="mt-8">
		<Button variant="outline" size="sm" href="/dev/scenario">Back to the scenario page</Button>
	</div>
</main>
