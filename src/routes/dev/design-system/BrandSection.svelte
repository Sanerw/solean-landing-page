<script lang="ts">
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import ShowcaseSection from './ShowcaseSection.svelte';
</script>

<ShowcaseSection
	id="brand"
	title="Brand foundations"
	description="The logo is one normalised viewBox composing the export's seven glyph paths, filled with currentColor so it inherits from its surface. StarRating is the only consumer of --rating."
>
	<h3 class="font-display text-xl font-semibold">SoleanLogo</h3>
	<div class="mt-6 grid gap-6 md:grid-cols-2">
		<div class="rounded-lg border border-border bg-card p-8">
			<p class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Light surface</p>
			<div class="mt-6 flex flex-wrap items-end gap-8 text-foreground">
				<SoleanLogo size="sm" />
				<SoleanLogo />
				<SoleanLogo size="lg" />
			</div>
		</div>
		<div class="rounded-lg border border-border bg-foreground p-8">
			<p class="text-xs font-semibold uppercase tracking-widest text-background/70">Dark surface</p>
			<div class="mt-6 flex flex-wrap items-end gap-8 text-background">
				<SoleanLogo size="sm" />
				<SoleanLogo />
				<SoleanLogo size="lg" />
			</div>
			<p class="mt-6 text-sm text-background/70">
				No reference shows the logo on a dark surface. This panel proves the currentColor
				contract, which is an architecture decision rather than a reference state.
			</p>
		</div>
	</div>
	<p class="mt-3 text-sm text-muted-foreground">
		Sizes are sm, default and lg. The 166:60 aspect ratio drives the width, so no size distorts
		the mark.
	</p>

	<h3 class="mt-12 font-display text-xl font-semibold">StarRating</h3>
	<div class="mt-6 space-y-6">
		<div class="flex flex-wrap items-center gap-4">
			<StarRating rating={5} />
			<span class="text-base text-muted-foreground">5 of 5</span>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<StarRating rating={4} />
			<span class="text-base text-muted-foreground">4 of 5</span>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<StarRating rating={4.7} size="sm" />
			<span class="text-base text-muted-foreground">
				4.7 of 5, small, as in the hero reviews block
			</span>
		</div>
	</div>
	<p class="mt-4 text-sm text-muted-foreground">
		Each instance exposes a text equivalent to assistive technology, for example
		<code class="font-sans">4.7 out of 5 stars</code>. The squares themselves are hidden from the
		accessibility tree.
	</p>
</ShowcaseSection>
