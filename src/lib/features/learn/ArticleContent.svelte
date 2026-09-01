<script lang="ts">
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();

	const comparisonRows = $derived([
		{
			label: 'Active ingredient',
			values: article.comparison.profiles.map((profile) => profile.activeIngredient)
		},
		{
			label: 'Manufacturer',
			values: article.comparison.profiles.map((profile) => profile.manufacturer)
		},
		{
			label: 'How often',
			values: article.comparison.profiles.map((profile) => profile.frequency)
		},
		{
			label: 'Main action',
			values: article.comparison.profiles.map((profile) => profile.mainAction)
		},
		{
			label: 'Prototype result claim',
			values: article.comparison.profiles.map((profile) => profile.treatment.claim)
		}
	]);
</script>

<div class="min-w-0 space-y-12 lg:col-span-2">
	<section id="quick-answer" class="scroll-mt-6" aria-labelledby="quick-answer-title">
		<h2 id="quick-answer-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			Quick answer
		</h2>
		<div class="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
			{#each article.quickAnswer as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="at-a-glance" class="scroll-mt-6" aria-labelledby="comparison-title">
		<h2 id="comparison-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			{article.comparison.profiles[0].treatment.name} vs
			{article.comparison.profiles[1].treatment.name} at a glance
		</h2>

		<div class="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
			<table class="w-full min-w-lg border-collapse text-left text-sm">
				<caption class="sr-only">
					Comparison of {article.comparison.profiles[0].treatment.name} and
					{article.comparison.profiles[1].treatment.name}
				</caption>
				<thead class="bg-foreground text-background">
					<tr>
						<!-- Blank by design, as drawn: the row headers below name each attribute, so a
						     column head here would label the labels. The caption carries the table's
						     name for assistive tech. -->
						<th scope="col" class="px-5 py-4 font-semibold"><span class="sr-only">Attribute</span></th>
						{#each article.comparison.profiles as profile (profile.treatment.id)}
							<th scope="col" class="px-5 py-4 font-semibold">{profile.treatment.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each comparisonRows as row (row.label)}
						<tr class="border-t border-border first:border-t-0">
							<th scope="row" class="px-5 py-4 font-medium text-foreground">{row.label}</th>
							{#each row.values as value}
								<td class="px-5 py-4 text-muted-foreground">{value}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section id="how-they-work" class="scroll-mt-6" aria-labelledby="how-they-work-title">
		<h2 id="how-they-work-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			How the treatments work
		</h2>
		<div class="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
			{#each article.howTheyWork as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="expected-results" class="scroll-mt-6" aria-labelledby="expected-results-title">
		<h2 id="expected-results-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			Expected weight-loss results
		</h2>
		<div class="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
			{#each article.expectedResults as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="side-effects" class="scroll-mt-6" aria-labelledby="side-effects-title">
		<h2 id="side-effects-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			Side effects and safety
		</h2>
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">{article.sideEffects.intro}</p>
		<ul class="mt-5 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-highlight-foreground">
			{#each article.sideEffects.items as item (item)}
				<li class="pl-1">{item}</li>
			{/each}
		</ul>
	</section>

	<section id="manufacturers" class="scroll-mt-6" aria-labelledby="manufacturers-title">
		<h2 id="manufacturers-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
			Who makes {article.manufacturers[0].treatment.name} and
			{article.manufacturers[1].treatment.name}?
		</h2>
		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			{#each article.manufacturers as profile (profile.treatment.id)}
				<section class="rounded-lg bg-secondary p-6" aria-labelledby="maker-{profile.treatment.id}">
					<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
						{profile.manufacturerLabel}
					</p>
					<h3 id="maker-{profile.treatment.id}" class="mt-3 font-display text-xl font-semibold">
						{profile.manufacturer}
					</h3>
					<p class="mt-1 text-sm font-semibold text-foreground">{profile.treatment.name}</p>
					<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
						{profile.manufacturerBody}
					</p>
				</section>
			{/each}
		</div>
	</section>
</div>
