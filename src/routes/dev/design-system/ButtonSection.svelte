<script lang="ts">
	import { Button, type ButtonSize, type ButtonVariant } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const VARIANTS: { value: ButtonVariant; note: string }[] = [
		{ value: 'default', note: 'Primary gold CTA' },
		{ value: 'inverse', note: 'High-emphasis solid CTA' },
		{ value: 'secondary', note: 'Back and low emphasis' },
		{ value: 'outline', note: 'Outlined CTA' },
		{ value: 'ghost', note: 'Navigation and icon actions' },
		{ value: 'link', note: 'Inline actions' },
		{ value: 'destructive', note: 'Remove and destructive actions' }
	];

	const SIZES: { value: ButtonSize; spec: string }[] = [
		{ value: 'sm', spec: 'h-10 px-4 text-sm rounded-full' },
		{ value: 'default', spec: 'h-12 px-6 text-base rounded-full' },
		{ value: 'lg', spec: 'h-17 px-8 text-lg rounded-full' },
		{ value: 'icon', spec: 'size-10' }
	];

</script>

<ShowcaseSection
	id="button"
	title="Button"
	description="Seven variants and four sizes, centralized in the primitive. Hover, active, focus-visible and disabled appear in no artboard, so they follow the interaction-state table rather than the reference."
>
	<div class="space-y-10">
		{#each VARIANTS as variant (variant.value)}
			<div>
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<code class="font-sans text-sm font-medium">variant="{variant.value}"</code>
					<span class="text-xs text-text-tertiary">{variant.note}</span>
				</div>
				<div class="mt-4 flex flex-wrap items-center gap-4">
					{#each SIZES as size (size.value)}
						<div class="space-y-2">
							<Button variant={variant.value} size={size.value}>
								{#if size.value === 'icon'}
									<ArrowRightIcon />
									<span class="sr-only">Continue</span>
								{:else}
									Check your eligibility
								{/if}
							</Button>
							<code class="block font-sans text-xs text-text-faint">{size.value}</code>
						</div>
					{/each}
					<div class="space-y-2">
						<Button variant={variant.value} disabled>Disabled</Button>
						<code class="block font-sans text-xs text-text-faint">disabled</code>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Size specification</h3>
	<div class="mt-4 overflow-x-auto">
		<table class="w-full min-w-lg text-left text-sm">
			<thead>
				<tr class="border-b border-border">
					<th scope="col" class="pb-2 font-medium">Size</th>
					<th scope="col" class="pb-2 font-medium">Classes</th>
					<th scope="col" class="pb-2 font-medium">For</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border">
					<td class="py-2"><code class="font-sans">sm</code></td>
					<td class="py-2"><code class="font-sans">h-10 px-4 text-sm rounded-full</code></td>
					<td class="py-2">Compact UI action</td>
				</tr>
				<tr class="border-b border-border">
					<td class="py-2"><code class="font-sans">default</code></td>
					<td class="py-2"><code class="font-sans">h-12 px-6 text-base rounded-full</code></td>
					<td class="py-2">Forms and standard application actions</td>
				</tr>
				<tr class="border-b border-border">
					<td class="py-2"><code class="font-sans">lg</code></td>
					<td class="py-2"><code class="font-sans">h-17 px-8 text-lg rounded-full</code></td>
					<td class="py-2">Marketing and primary funnel CTA, 68px</td>
				</tr>
				<tr>
					<td class="py-2"><code class="font-sans">icon</code></td>
					<td class="py-2"><code class="font-sans">size-10</code></td>
					<td class="py-2">Square icon-only control</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Focus ring on a dark surface</h3>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		The default ring is deep green on a background-coloured offset, which reads 12.36:1 on the page
		ground. On a dark surface it measures 1.00:1 and vanishes, so the primitive's surface contract
		switches to a gold ring and dark offset. Tab into both panels to compare.
	</p>
	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<div class="rounded-xl border border-border bg-background p-8">
			<p class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
				Light surface, default ring
			</p>
			<div class="mt-4 flex flex-wrap gap-4">
				<Button size="lg">Check your eligibility</Button>
				<Button variant="outline" size="lg">Explore treatments</Button>
			</div>
		</div>
		<div class="rounded-xl bg-foreground p-8">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">
				Dark surface, surface="dark"
			</p>
			<div class="mt-4 flex flex-wrap gap-4">
				{#each VARIANTS as variant (variant.value)}
					<Button variant={variant.value} surface="dark">{variant.value}</Button>
				{/each}
			</div>
			<code class="mt-4 block font-sans text-xs text-background/70">surface="dark"</code>
		</div>
	</div>
</ShowcaseSection>
