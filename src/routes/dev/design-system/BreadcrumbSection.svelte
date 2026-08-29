<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import ShowcaseSection from './ShowcaseSection.svelte';
</script>

<ShowcaseSection
	id="breadcrumb"
	title="Breadcrumb"
	description="A neutral article hierarchy, not the final learn route. The trail sits in a labelled navigation landmark, separators are decorative, and the current item is aria-current, not a link."
>
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/learn">Learn</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/learn/blog">Blog</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>Mounjaro vs Wegovy</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<h3 class="mt-12 font-display text-xl font-semibold">Collapsed trail</h3>
	<Breadcrumb.Root class="mt-4">
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Ellipsis />
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item class="max-w-40 sm:max-w-none">
				<Breadcrumb.Page class="block truncate">
					A genuinely long article title that would otherwise overflow
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
	<p class="mt-3 max-w-3xl text-sm text-muted-foreground">
		Tab through the links: focus is visible on each one. The truncated title on the right keeps its
		full text as its accessible name even though the visible label is clipped at 375px.
	</p>
</ShowcaseSection>
