<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { CONTAINER } from '$lib/features/marketing/container';
	import { FEATURED_ARTICLE_SLUG, ROUTES } from '$lib/features/marketing/content';
</script>

<SiteHeader eligibilityAvailable={false} />

<section class={[CONTAINER, 'py-20 text-center lg:py-32']} aria-labelledby="article-error-title">
	<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
		Article unavailable
	</p>
	<h1 id="article-error-title" class="mt-4 font-display text-4xl font-medium sm:text-5xl">
		We could not find that guide.
	</h1>
	<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
		The address may be incorrect, or the guide may no longer be available.
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		<Button href={ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)}>Read the featured guide</Button>
		<Button href={ROUTES.home} variant="outline">Return home</Button>
	</div>
</section>
