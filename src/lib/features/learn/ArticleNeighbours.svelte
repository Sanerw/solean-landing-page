<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { ArticleLink } from './journal';

	interface Props {
		previous?: ArticleLink;
		next?: ArticleLink;
	}

	let { previous, next }: Props = $props();
</script>

<!--
	Both ends are open, so all three states are real: two neighbours, one, or none at all. With
	none the band is not drawn, which is the state the site is in today with one article
	published, and an empty band promising more to read would be the page lying.
-->
{#if previous || next}
	<!--
		No gap above it and no rounded top: the band is the foot of the article's own panel, not a
		second one under it. The artboard runs white from beneath the hero to the footer, and the
		page squares the reading panel's bottom corners to meet this whenever a band follows.
	-->
	<nav class={BLEED} aria-label={m.learn_neighbours_label()}>
		<div class="bg-card sm:rounded-b-xl">
			<div class={[CONTAINER, 'flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:gap-16']}>
				{#if previous}
					<a
						href={localizeHref(ROUTES.learnArticle(previous.slug))}
						class="group flex items-center gap-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
					>
						<ChevronLeftIcon
							aria-hidden="true"
							class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
						/>
						<span>
							<span class="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
								{m.learn_previous_article()}
							</span>
							<span
								class="mt-1 block font-display text-lg font-semibold text-foreground group-hover:text-highlight-foreground"
							>
								{previous.title}
							</span>
						</span>
					</a>
				{/if}

				{#if next}
					<a
						href={localizeHref(ROUTES.learnArticle(next.slug))}
						class="group flex items-center gap-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:ml-auto sm:text-right"
					>
						<span>
							<span class="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
								{m.learn_next_article()}
							</span>
							<span
								class="mt-1 block font-display text-lg font-semibold text-foreground group-hover:text-highlight-foreground"
							>
								{next.title}
							</span>
						</span>
						<ChevronRightIcon
							aria-hidden="true"
							class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
						/>
					</a>
				{/if}
			</div>
		</div>
	</nav>
{/if}
