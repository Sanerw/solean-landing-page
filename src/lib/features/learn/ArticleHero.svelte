<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { BLEED, CONTAINER, PANEL_ROUND } from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
	import { formatArticleDate } from './format-article-date';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();

</script>

<section class={BLEED} aria-labelledby="article-title">
	<div class={['bg-surface-warm', PANEL_ROUND]}>
		<div class={[CONTAINER, 'py-8 sm:py-10 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-12 lg:py-12']}>
			<div class="flex flex-col justify-center">
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={ROUTES.home}>{m.breadcrumb_home()}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={ROUTES.learn}>{m.learn_breadcrumb_learn()}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/learn/blog">Blog</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>{article.shortTitle}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>

				<p class="mt-10 text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
					{article.category}
				</p>
				<h1
					id="article-title"
					class="mt-4 max-w-3xl font-display text-4xl font-medium text-foreground sm:text-5xl lg:text-6xl"
				>
					{article.title}
				</h1>
				<p class="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
					{article.summary}
				</p>

				<div class="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
					{#if article.review.reviewer.portrait}
						<enhanced:img
							src={article.review.reviewer.portrait}
							alt=""
							loading="lazy"
							decoding="async"
							sizes="40px"
							aria-hidden="true"
							class="size-10 rounded-full object-cover"
							width="40"
							height="40"
						/>
					{/if}
					<p>
						<span class="block font-semibold text-foreground">
							Medically reviewed by {article.review.reviewer.name}
						</span>
						<span>
							{m.learn_updated()}
							<time datetime={article.review.updatedAt}>{formatArticleDate(article.review.updatedAt)}</time>
							<span aria-hidden="true"> · </span>{m.learn_read_time({ minutes: article.review.readTimeMinutes })}
						</span>
					</p>
				</div>
			</div>

			{#if article.hero.src}
				<img
					src={article.hero.src}
					alt={article.hero.alt}
					class="mt-10 aspect-4/3 w-full rounded-xl object-cover lg:mt-0 lg:h-full"
					width="805"
					height="650"
				/>
			{/if}
		</div>
	</div>
</section>
