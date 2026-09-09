<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { BLEED, CONTAINER, PANEL_ROUND } from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { ArticleLink } from './journal';
	import type { Article } from './types';

	interface Props {
		article: Article;
		/** The Journal's own neighbours. Both ends are open, so both are optional. */
		next?: ArticleLink;
	}

	let { article, next }: Props = $props();
</script>

<section class={BLEED} aria-labelledby="article-title">
	<div class={['bg-surface-warm', PANEL_ROUND]}>
		<div class={[CONTAINER, 'py-4 sm:py-8 lg:py-12']}>
			<!--
				The Journal's featured card at a larger size: the same photograph running the width of
				a bleed panel with the copy over it. `bg-foreground` under the image is not a
				fallback nobody sees, it is what an article published without a photograph looks
				like, and white type has to stay readable on it.
			-->
			<div
				class="relative isolate flex min-h-112 flex-col justify-between overflow-hidden rounded-xl bg-foreground p-5 sm:min-h-128 sm:p-8 lg:min-h-152 lg:p-11"
			>
				{#if article.hero}
					<img
						src={article.hero.src}
						srcset={article.hero.srcset}
						width={article.hero.width}
						height={article.hero.height}
						sizes="(min-width: 1024px) 1768px, 100vw"
						alt={article.hero.alt}
						class="absolute inset-0 -z-10 size-full object-cover"
					/>
				{/if}
				<!--
					The bottom stop is the Journal card's, because that is the end the copy sits
					against and the one that was proven readable. The top two are lighter than the
					card's, as the artboard draws them: the photograph is most of this panel and a
					ramp tuned for a small card buries it.
				-->
				<div
					aria-hidden="true"
					class="absolute inset-0 -z-10 bg-gradient-to-b from-scrim/20 via-scrim/55 to-scrim/95"
				></div>

				<div class="flex items-start justify-between gap-3">
					<Button
						href={localizeHref(ROUTES.learn)}
						variant="secondary"
						size="sm"
						surface="dark"
						class="border border-border"
					>
						<ArrowLeftIcon aria-hidden="true" />
						{m.learn_back_to_journal()}
					</Button>

					<!-- The oldest article has nothing after it, so the pill is not drawn rather than
					     drawn dead. -->
					{#if next}
						<!--
							Drawn from `sm` up. Buttons are `whitespace-nowrap` and `shrink-0`, so the
							two labels cannot share a 390px row in German: "Zurück zum Journal" beside
							"Nächster Artikel" is 34 characters and ran off the edge. The way back is
							what a reader reaches for at the top of an article, so it keeps the row to
							itself there. Nothing is lost: the previous and next articles have their
							own band at the foot of every page.
						-->
						<Button
							href={localizeHref(ROUTES.learnArticle(next.slug))}
							variant="secondary"
							size="sm"
							surface="dark"
							class="max-sm:hidden"
						>
							{m.learn_next_article()}
							<ArrowRightIcon aria-hidden="true" />
						</Button>
					{/if}
				</div>

				<div class="mt-10 flex flex-col items-start gap-3 sm:gap-4">
					<!-- The narrow artboard carries the title and the reviewer and nothing else: at
					     390px the badge, the lead and the chips crowd a photograph out of its own
					     panel. Each of them returns at `sm`. -->
					<Badge
						class="hidden rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground sm:inline-flex"
					>
						{article.category}
					</Badge>

					<h1
						id="article-title"
						class="max-w-4xl text-balance font-display text-3xl font-medium leading-tight tracking-tight text-background sm:text-4xl lg:text-5xl"
					>
						{article.title}
					</h1>

					<p class="hidden max-w-3xl text-base text-background/85 sm:block lg:text-lg">
						{article.summary}
					</p>

					<div
						class="mt-2 flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm font-semibold text-background"
					>
						<div class="flex items-center gap-x-6 gap-y-2">
							{#if article.review.reviewer.name}
								<span class="flex items-center gap-3">
									{#if article.review.reviewer.portrait}
										<!--
											The artboard draws a stethoscope in a circle here. It is kept as the
											fallback rather than the rule: the mock had no photograph and we do,
											and a face carries more than an icon of a profession.
										-->
										<img
											src={article.review.reviewer.portrait.src}
											srcset={article.review.reviewer.portrait.srcset}
											width={article.review.reviewer.portrait.width}
											height={article.review.reviewer.portrait.height}
											sizes="44px"
											alt=""
											aria-hidden="true"
											class="size-10 rounded-full object-cover sm:size-11"
										/>
									{:else}
										<span
											aria-hidden="true"
											class="flex size-8 items-center justify-center rounded-full bg-surface-warm text-foreground sm:size-9"
										>
											<StethoscopeIcon class="size-5" />
										</span>
									{/if}
									{m.journal_reviewed_by({ reviewer: article.review.reviewer.name })}
								</span>

								{#if article.review.readTimeMinutes}
									<span aria-hidden="true" class="hidden h-6 w-px bg-background/35 sm:block"></span>
								{/if}
							{/if}

							{#if article.review.readTimeMinutes}
								<span class="hidden items-center gap-2 sm:flex">
									<ClockIcon aria-hidden="true" class="size-5" />
									{m.learn_read_time({ minutes: article.review.readTimeMinutes })}
								</span>
							{/if}
						</div>

						<ul class="hidden flex-wrap items-center gap-2 sm:flex">
							{#each article.tags as tag (tag)}
								<li
									class="rounded-full border border-background/40 bg-background/15 px-4 py-1.5 text-xs font-semibold"
								>
									{tag}
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
