<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Announcement } from '$lib/sanity/queries';
	import CountdownTimer from './CountdownTimer.svelte';

	const { announcement }: { announcement: Announcement | null } = $props();
</script>

<!--
	Nothing rather than an empty bar when the offer is unset. The bar sits above every marketing
	page, including the legal ones, so a missing announcement must not cost them a blank strip.
-->
{#if announcement}
	<aside
		data-site-announcement
		class="bg-announcement text-announcement-foreground"
		aria-label={m.a11y_announcement()}
	>
		<div
			class="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 py-2 text-left sm:h-11 sm:justify-center sm:gap-24 sm:px-9 sm:py-0 sm:text-center"
		>
			<div class="flex min-w-0 flex-col gap-0.5 sm:hidden">
				<span class="text-xs font-bold tracking-wide">{announcement.mobileTitle}</span>
				<span class="text-xs">{announcement.mobileDetail}</span>
			</div>

			<p class="hidden leading-normal sm:block">
				<span class="block text-xs font-bold tracking-wide">{announcement.title}</span>
				<span class="mt-0.5 block text-xs">
					<span class="font-bold">{announcement.prefix}</span>{' '}
					<span><span class="font-bold text-primary">{announcement.amount}</span>{announcement.suffix}</span>
				</span>
			</p>

			<CountdownTimer class="shrink-0" />
		</div>
	</aside>
{/if}
