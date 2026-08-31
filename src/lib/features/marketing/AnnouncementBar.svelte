<script lang="ts">
	import { ANNOUNCEMENT } from './content';
	import CountdownTimer from './CountdownTimer.svelte';
</script>

<aside class="bg-announcement text-announcement-foreground" aria-label="Wegovy Pill offer">
	<div
		class="mx-auto flex w-full flex-col items-center justify-center gap-3 px-4 py-3 text-center sm:h-11 sm:flex-row sm:gap-24 sm:px-9 sm:py-0"
	>
		<p class="leading-normal">
			<span class="block text-xs font-bold tracking-wide">{ANNOUNCEMENT.title}</span>
			<span class="mt-0.5 block text-xs">
				<span class="font-bold">{ANNOUNCEMENT.prefix}</span>{' '}
				<span><span class="font-bold text-primary">{ANNOUNCEMENT.amount}</span>{ANNOUNCEMENT.suffix}</span>
			</span>
		</p>
		<CountdownTimer />
	</div>
</aside>
