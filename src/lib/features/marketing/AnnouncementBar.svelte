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
		<!-- Two stacked lines, as drawn: the offer name reads as a label above the detail. -->
		<p class="text-sm leading-snug">
			<span class="block font-semibold uppercase tracking-widest">{ANNOUNCEMENT.title}</span>
			<span class="mt-0.5 block text-background/80">{ANNOUNCEMENT.body}</span>
		</p>
		<CountdownTimer />
	</div>
</aside>
