<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { articleTeaser } from './content';

	// Read during render so the copy follows the active locale.
	const ARTICLE_TEASER = $derived(articleTeaser());
</script>

<div data-testid="hero-article-teaser" class="w-full max-w-80">
	<p class="text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-primary">
		{ARTICLE_TEASER.eyebrow}
	</p>
	<p class="mt-2 font-display text-lg font-semibold leading-[1.15] text-background">
		{ARTICLE_TEASER.title}
	</p>
	<div aria-hidden="true" class="mt-2.5 h-0.5 w-[42px] bg-background/60"></div>
	<p class="mt-2.5 text-xs leading-5 text-background/80">{ARTICLE_TEASER.body}</p>
	<!-- First real consumer of Button's on-dark link treatment from feature 3a. -->
	<Button href={ARTICLE_TEASER.href} variant="link" surface="dark" class="mt-2.5 text-[13px]">
		{ARTICLE_TEASER.cta}
		<ArrowRightIcon aria-hidden="true" class="size-4" />
	</Button>
</div>
