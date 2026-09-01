<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { BLEED } from '$lib/features/marketing/container';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { CONTAINER } from '$lib/features/marketing/container';
	import { FEATURED_ARTICLE_SLUG, ROUTES } from '$lib/features/marketing/content';
</script>

<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<section class={[CONTAINER, 'py-20 text-center lg:py-32']} aria-labelledby="article-error-title">
	<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
		{m.learn_error_eyebrow()}
	</p>
	<h1 id="article-error-title" class="mt-4 font-display text-4xl font-medium sm:text-5xl">
		{m.learn_error_title()}
	</h1>
	<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
		{m.learn_error_body()}
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		<Button href={ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)}>{m.learn_error_cta()}</Button>
		<Button href={ROUTES.home} variant="outline">Return home</Button>
	</div>
</section>
