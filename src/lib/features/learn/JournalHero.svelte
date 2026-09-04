<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { CONTAINER } from '$lib/features/marketing/container';
</script>

<div class={[CONTAINER, 'flex flex-col items-center gap-3 py-10 text-center lg:py-14']}>
	<p class="text-xs font-bold uppercase tracking-widest text-highlight-foreground">
		{m.journal_eyebrow()}
	</p>
	<h1
		id="journal-heading"
		class="max-w-4xl text-balance font-display text-4xl font-medium leading-none tracking-tight text-foreground sm:text-5xl lg:text-6xl"
	>
		{m.journal_heading()}
	</h1>
	<p class="max-w-2xl text-base text-muted-foreground md:text-lg">{m.journal_lead()}</p>
</div>
