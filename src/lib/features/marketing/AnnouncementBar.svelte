<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { announcement } from './content';

	// Read during render so the bar follows the active locale.
	const ANNOUNCEMENT = $derived(announcement());
	import CountdownTimer from './CountdownTimer.svelte';
</script>

<aside class="bg-announcement text-announcement-foreground" aria-label={m.a11y_announcement()}>
	<div
		class="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 py-2 text-left sm:h-11 sm:justify-center sm:gap-24 sm:px-9 sm:py-0 sm:text-center"
	>
		<div class="flex min-w-0 flex-col gap-0.5 sm:hidden">
			<span class="text-xs font-bold tracking-wide">{ANNOUNCEMENT.mobile.title}</span>
			<span class="text-xs">{ANNOUNCEMENT.mobile.detail}</span>
		</div>

		<p class="hidden leading-normal sm:block">
			<span class="block text-xs font-bold tracking-wide">{ANNOUNCEMENT.title}</span>
			<span class="mt-0.5 block text-xs">
				<span class="font-bold">{ANNOUNCEMENT.prefix}</span>{' '}
				<span><span class="font-bold text-primary">{ANNOUNCEMENT.amount}</span>{ANNOUNCEMENT.suffix}</span>
			</span>
		</p>

		<CountdownTimer class="shrink-0" />
	</div>
</aside>
