<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Announcement } from '$lib/sanity/queries';

	const { announcement }: { announcement: Announcement | null } = $props();
</script>

<!--
	Nothing rather than an empty bar when the line is unset. The bar sits above every marketing
	page, including the legal ones, so a missing announcement must not cost them a blank strip.
-->
{#if announcement?.text}
	<aside
		data-site-announcement
		class="bg-announcement text-announcement-foreground"
		aria-label={m.a11y_announcement()}
	>
		<!-- One line, the same words at every width: the artboards change the type size and the
		     bar's height, not the copy, so there is no narrow variant to keep in step. -->
		<div
			class="mx-auto flex h-16 w-full items-center justify-center px-4 py-2 sm:h-13 sm:px-14 sm:py-0"
		>
			<p
				class="text-center text-xs font-bold uppercase leading-normal tracking-wider sm:text-sm sm:tracking-widest"
			>
				{announcement.text}
			</p>
		</div>
	</aside>
{/if}
