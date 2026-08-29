<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { ARTICLE_TEASER } from './content';
</script>

<div class="max-w-sm border-t border-background/30 pt-4">
	<p class="text-xs font-semibold uppercase tracking-widest text-primary">
		{ARTICLE_TEASER.eyebrow}
	</p>
	<p class="mt-2 font-display text-xl font-semibold text-background">{ARTICLE_TEASER.title}</p>
	<p class="mt-2 text-sm text-background/80">{ARTICLE_TEASER.body}</p>
	<!-- First real consumer of Button's on-dark link treatment from feature 3a. -->
	<Button href={ARTICLE_TEASER.href} variant="link" surface="dark" class="mt-3 text-sm">
		{ARTICLE_TEASER.cta}
		<ArrowRightIcon aria-hidden="true" class="size-4" />
	</Button>
</div>
