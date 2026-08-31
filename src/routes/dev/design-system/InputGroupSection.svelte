<script lang="ts">
	import { FieldDescription } from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import MailIcon from '@lucide/svelte/icons/mail';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ShowcaseSection from './ShowcaseSection.svelte';

	let search = $state('Mounjaro');
</script>

<ShowcaseSection
	id="input-group"
	title="InputGroup"
	description="Inherits Input's own box (h-12, rounded-md, border-border, bg-card) rather than the vendor's translucent pill, so an icon, a unit or an action can sit inside the control without a second competing border. Focus and invalid state key off the contained input and render only on the shared boundary."
>
	<div class="grid gap-8 md:grid-cols-2">
		<div class="space-y-2">
			<InputGroup.Root>
				<InputGroup.Addon>
					<MailIcon aria-hidden="true" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="input-group-email"
					type="email"
					placeholder="jonas.weber@gmail.com"
					aria-label="Email"
				/>
			</InputGroup.Root>
			<FieldDescription>Leading icon, decorative and hidden from assistive tech.</FieldDescription>
		</div>

		<div class="space-y-2">
			<InputGroup.Root>
				<InputGroup.Input id="input-group-weight" inputmode="decimal" value="96" aria-label="Weight" />
				<InputGroup.Addon align="inline-end">
					<InputGroup.Text>kg</InputGroup.Text>
				</InputGroup.Addon>
			</InputGroup.Root>
			<FieldDescription>Trailing unit, discoverable as real text rather than a decorative overlay.</FieldDescription>
		</div>

		<div class="space-y-2 md:col-span-2">
			<InputGroup.Root>
				<InputGroup.Addon>
					<SearchIcon aria-hidden="true" />
				</InputGroup.Addon>
				<InputGroup.Input bind:value={search} aria-label="Search treatments" />
				{#if search.length > 0}
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button aria-label="Clear search" onclick={() => (search = '')}>
							<XIcon aria-hidden="true" />
						</InputGroup.Button>
					</InputGroup.Addon>
				{/if}
			</InputGroup.Root>
			<FieldDescription>
				A compact inline action. Tab to the button and press Enter or Space to clear the field.
			</FieldDescription>
		</div>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Invalid and disabled</h3>
	<div class="mt-6 grid gap-8 md:grid-cols-2">
		<div class="space-y-2">
			<InputGroup.Root>
				<InputGroup.Addon>
					<MailIcon aria-hidden="true" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="input-group-invalid"
					type="email"
					value="jonas@"
					aria-invalid="true"
					aria-describedby="input-group-invalid-error"
					aria-label="Email"
				/>
			</InputGroup.Root>
			<p id="input-group-invalid-error" class="text-sm text-destructive-text">
				Enter a complete email address.
			</p>
		</div>

		<div class="space-y-2">
			<InputGroup.Root>
				<InputGroup.Input id="input-group-disabled" value="Unavailable" disabled aria-label="Disabled" />
				<InputGroup.Addon align="inline-end">
					<InputGroup.Text>kg</InputGroup.Text>
				</InputGroup.Addon>
			</InputGroup.Root>
			<FieldDescription>The disabled control dims the whole group, not just the input.</FieldDescription>
		</div>
	</div>
</ShowcaseSection>
