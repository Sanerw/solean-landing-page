<script lang="ts">
	import AlertSection from './AlertSection.svelte';
	import BrandSection from './BrandSection.svelte';
	import BreadcrumbSection from './BreadcrumbSection.svelte';
	import ButtonSection from './ButtonSection.svelte';
	import CarouselSection from './CarouselSection.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import DatePickerSection from './DatePickerSection.svelte';
	import ExampleFormSection from './ExampleFormSection.svelte';
	import ChoiceControlsSection from './ChoiceControlsSection.svelte';
	import OverlaysSection from './OverlaysSection.svelte';
	import SurfacesSection from './SurfacesSection.svelte';
	import InputGroupSection from './InputGroupSection.svelte';
	import InputSection from './InputSection.svelte';
	import NavigationMenuSection from './NavigationMenuSection.svelte';
	import ProgressSection from './ProgressSection.svelte';
	import ShowcaseSection from './ShowcaseSection.svelte';
	import TabsSection from './TabsSection.svelte';
	import TextareaSelectSection from './TextareaSelectSection.svelte';
	import TokenSwatch from './TokenSwatch.svelte';
	import TypeSpecimen from './TypeSpecimen.svelte';
	import { COLOR_TOKEN_GROUPS } from './tokens';
</script>

<svelte:head>
	<title>Design system · Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
	<header class="pb-12">
		<p class="font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
			Development surface
		</p>
		<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">Solean design system</h1>
		<p class="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
			The shared foundation every feature builds on: semantic tokens, the two type families and
			their responsive ladders, the radius scale, and the adapted shared primitives. Not a public
			route and not linked from the app.
		</p>
		<p class="mt-4 max-w-3xl text-sm text-text-faint">
			Values follow blueprint/reference/design-system.md. Dark mode is out of scope, so this page
			is light theme only.
		</p>
	</header>

	<ShowcaseSection
		id="colour"
		title="Colour tokens"
		description="Semantic names describing role, never appearance. Components consume these; a hex never appears in a component."
	>
		<div class="space-y-12">
			{#each COLOR_TOKEN_GROUPS as group (group.title)}
				<div>
					<h3 class="font-display text-xl font-semibold">{group.title}</h3>
					{#if group.note}
						<p class="mt-2 max-w-3xl text-sm text-muted-foreground">{group.note}</p>
					{/if}
					<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each group.tokens as token (token.name)}
							<TokenSwatch {token} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="radius"
		title="Radius"
		description="Base --radius is 1.25rem. The stock classes reproduce the reference through the multiplier chain, so no arbitrary radius is ever written."
	>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-sm bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-sm</code>
					<p class="text-xs text-text-tertiary">12px</p>
					<p class="text-xs text-text-faint">Small chips, badges</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-md bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-md</code>
					<p class="text-xs text-text-tertiary">16px</p>
					<p class="text-xs text-text-faint">Inputs</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-lg bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-lg</code>
					<p class="text-xs text-text-tertiary">20px</p>
					<p class="text-xs text-text-faint">Cards, panels</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-xl bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-xl</code>
					<p class="text-xs text-text-tertiary">28px</p>
					<p class="text-xs text-text-faint">Large cards, hero image, bento</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-2xl bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-2xl</code>
					<p class="text-xs text-text-tertiary">36px</p>
					<p class="text-xs text-text-faint">Feature panels</p>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div class="size-16 shrink-0 rounded-full bg-muted"></div>
				<div>
					<code class="block font-sans text-sm font-medium">rounded-full</code>
					<p class="text-xs text-text-tertiary">pill</p>
					<p class="text-xs text-text-faint">Pill buttons</p>
				</div>
			</div>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="typography"
		title="Typography"
		description="Exactly two families. Inter Tight for display: headings, product names, prices, stats. DM Sans for everything else. Stock Tailwind size steps only, never an arbitrary pixel value."
	>
		<div class="grid gap-6 sm:grid-cols-2">
			<div class="rounded-lg border border-border bg-card p-6">
				<p class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
					--font-display
				</p>
				<p class="mt-3 font-display text-3xl font-medium">Inter Tight Variable</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Headings, product names, prices, stats, large numbers.
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-6">
				<p class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
					--font-sans
				</p>
				<p class="mt-3 text-3xl">DM Sans Variable</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Body, navigation, buttons, forms, labels, badges, eyebrows, metadata, captions.
				</p>
			</div>
		</div>

		<h3 class="mt-12 font-display text-xl font-semibold">Responsive ladders</h3>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			The reference is a fixed 1920px canvas, so a single class only ever describes the desktop
			end. These ladders are what gets written. Resize the window to see each one step through its
			breakpoints.
		</p>

		<div class="mt-6">
			<TypeSpecimen
				role="Hero H1"
				font="Inter Tight, medium"
				classes="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl"
			>
				<p class="font-display text-4xl font-medium sm:text-5xl lg:text-7xl xl:text-8xl">
					Your pathway to lasting happiness.
				</p>
			</TypeSpecimen>

			<TypeSpecimen role="Section H2" font="Inter Tight, medium" classes="text-3xl md:text-4xl">
				<p class="font-display text-3xl font-medium md:text-4xl">Weight loss, with care built in.</p>
			</TypeSpecimen>

			<TypeSpecimen
				role="Large stat"
				font="Inter Tight, medium"
				classes="text-4xl md:text-5xl lg:text-6xl"
			>
				<p class="font-display text-4xl font-medium md:text-5xl lg:text-6xl">22 kg</p>
			</TypeSpecimen>

			<TypeSpecimen
				role="Sub-heading H3"
				font="Inter Tight, medium"
				classes="text-2xl md:text-3xl"
			>
				<p class="font-display text-2xl font-medium md:text-3xl">How it works.</p>
			</TypeSpecimen>

			<TypeSpecimen role="Card title" font="Inter Tight, semibold" classes="text-lg md:text-xl">
				<p class="font-display text-lg font-semibold md:text-xl">Doctors who guide every decision.</p>
			</TypeSpecimen>

			<TypeSpecimen
				role="Lead paragraph"
				font="DM Sans, normal"
				classes="text-base md:text-lg lg:text-xl"
			>
				<p class="max-w-2xl text-base text-muted-foreground md:text-lg lg:text-xl">
					Doctor-led treatment, tailored guidance and ongoing support to help you make progress
					that lasts.
				</p>
			</TypeSpecimen>

			<TypeSpecimen role="Body" font="DM Sans, normal" classes="text-base">
				<p class="max-w-2xl text-base">
					Medicated weight loss is not cheating. Stress, hormones and genetics can all influence
					your weight, and a clinician reviews your history before anything is prescribed.
				</p>
			</TypeSpecimen>

			<TypeSpecimen role="Label, body small" font="DM Sans, medium" classes="text-sm">
				<p class="text-sm font-medium">First name</p>
			</TypeSpecimen>

			<TypeSpecimen role="Caption, legal" font="DM Sans, normal" classes="text-xs">
				<p class="text-xs text-text-faint">
					Secure checkout. Prices and final treatment are confirmed after clinical review.
				</p>
			</TypeSpecimen>

			<TypeSpecimen
				role="Eyebrow"
				font="DM Sans, semibold"
				classes="text-xs font-semibold uppercase tracking-widest"
			>
				<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
					Treatment comparison
				</p>
			</TypeSpecimen>
		</div>

		<h3 class="mt-12 font-display text-xl font-semibold">Weight by role</h3>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			Weight follows the element's role. Headings do not all default to semibold.
		</p>
		<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div>
				<p class="font-display text-2xl font-medium">Hero and section</p>
				<code class="mt-1 block font-sans text-xs text-muted-foreground">font-medium</code>
			</div>
			<div>
				<p class="font-display text-2xl font-semibold">Card heading</p>
				<code class="mt-1 block font-sans text-xs text-muted-foreground">font-semibold</code>
			</div>
			<div>
				<p class="text-2xl font-semibold">Button label</p>
				<code class="mt-1 block font-sans text-xs text-muted-foreground">font-semibold</code>
			</div>
			<div>
				<p class="text-2xl font-normal">Body copy</p>
				<code class="mt-1 block font-sans text-xs text-muted-foreground">font-normal</code>
			</div>
		</div>
	</ShowcaseSection>

	<ButtonSection />
	<InputSection />
	<DatePickerSection />
	<InputGroupSection />
	<ProgressSection />
	<NavigationMenuSection />
	<TabsSection />
	<CarouselSection />
	<AlertSection />
	<BreadcrumbSection />
	<CollapsibleSection />
	<TextareaSelectSection />
	<ChoiceControlsSection />

	<SurfacesSection />

	<OverlaysSection />

	<BrandSection />

	<ExampleFormSection />
</main>
