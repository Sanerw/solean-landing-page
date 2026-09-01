<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { OFFER_WINDOW_MS, pad, remainingUntil, type Remaining } from './countdown';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	// Rendered on the server too, so the initial value must not depend on Date.now():
	// the server and the client would disagree and hydration would warn. The full window
	// is a stable starting frame that the first client tick immediately replaces.
	let remaining = $state<Remaining>(remainingUntil(OFFER_WINDOW_MS, 0));

	// The narrow bar has room for three units under one-letter labels, so seconds and the
	// colons drop out below `sm` rather than being rebuilt as a second component.
	const units = $derived([
		{ value: remaining.days, label: m.countdown_days(), short: m.countdown_days_short() },
		{ value: remaining.hours, label: m.countdown_hours(), short: m.countdown_hours_short() },
		{ value: remaining.minutes, label: m.countdown_minutes(), short: m.countdown_minutes_short() },
		{ value: remaining.seconds, label: m.countdown_seconds(), short: m.countdown_seconds_short() }
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
<div class={['flex items-center gap-1.5 sm:gap-2.5', className]}>
	<span class="sr-only">{m.countdown_sr({ hours: remaining.hours })}</span>
	{#each units as unit, index (unit.label)}
		{#if index > 0}
			<span aria-hidden="true" class="hidden text-sm font-bold leading-normal sm:inline">:</span>
		{/if}
		<span
			aria-hidden="true"
			class={[
				'flex-col items-center leading-normal',
				unit.label === 'secs' ? 'hidden sm:flex' : 'flex'
			]}
		>
			<span class="text-sm font-bold">{pad(unit.value)}</span>
			<span class="text-xs font-semibold uppercase sm:hidden">{unit.short}</span>
			<span class="hidden text-xs uppercase tracking-wide sm:inline">{unit.label}</span>
		</span>
	{/each}
</div>
