<script lang="ts">
	import { OFFER_WINDOW_MS, pad, remainingUntil, type Remaining } from './countdown';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	// Rendered on the server too, so the initial value must not depend on Date.now():
	// the server and the client would disagree and hydration would warn. The full window
	// is a stable starting frame that the first client tick immediately replaces.
	let remaining = $state<Remaining>(remainingUntil(OFFER_WINDOW_MS, 0));

	const units = $derived([
		{ value: remaining.days, label: 'days' },
		{ value: remaining.hours, label: 'hrs' },
		{ value: remaining.minutes, label: 'mins' },
		{ value: remaining.seconds, label: 'secs' }
	]);

	$effect(() => {
		const target = Date.now() + OFFER_WINDOW_MS;
		remaining = remainingUntil(target, Date.now());

		const id = setInterval(() => {
			remaining = remainingUntil(target, Date.now());
		}, 1000);

		return () => clearInterval(id);
	});
</script>

<!--
	The digits change every second, so they are hidden from assistive tech entirely and a
	single static sentence carries the meaning instead. A live region here would interrupt
	a screen reader once per second for a mock promotion.
-->
<div class={['flex items-center gap-2', className]}>
	<span class="sr-only">Offer ends in about {remaining.hours} hours.</span>
	{#each units as unit, index (unit.label)}
		{#if index > 0}
			<span aria-hidden="true" class="pb-3 text-xs text-background/50">:</span>
		{/if}
		<span aria-hidden="true" class="flex w-9 flex-col items-center leading-none">
			<span class="font-display text-lg font-semibold text-background">{pad(unit.value)}</span>
			<span class="mt-1 text-xs uppercase tracking-widest text-background/60">{unit.label}</span>
		</span>
	{/each}
</div>
