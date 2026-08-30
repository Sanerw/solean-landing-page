<script lang="ts">
	import { ANNOUNCEMENT } from './content';
	import { CONTAINER } from './container';
	import CountdownTimer from './CountdownTimer.svelte';
</script>

<aside class="bg-foreground text-background" aria-label="Welcome offer">
	<div
		class={[
			CONTAINER,
			'flex flex-col items-center justify-center gap-3 py-3 text-center sm:h-14 sm:flex-row sm:gap-8 sm:py-0'
		]}
	>
		<p class="text-sm leading-snug">
			<span class="block font-semibold uppercase tracking-widest">{ANNOUNCEMENT.title}</span>
			<span class="mt-0.5 flex flex-wrap items-baseline justify-center gap-x-1">
				<span class="font-semibold text-background/80">{ANNOUNCEMENT.prefix}</span>
				<span class="font-bold text-primary">{ANNOUNCEMENT.amount}</span>
				<span class="font-normal text-background/80">{ANNOUNCEMENT.suffix}</span>
			</span>
		</p>
		<CountdownTimer />
	</div>
</aside>
