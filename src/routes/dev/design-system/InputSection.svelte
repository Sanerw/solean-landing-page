<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-widest';
</script>

<ShowcaseSection
	id="input-label"
	title="Input and Label"
	description="White fields, a corrected --input boundary, rounded-md corners and the shared focus ring reproduce the reference. Focus-visible, invalid and disabled states are design-system decisions because no artboard captures them."
>
	<div class="grid gap-8 md:grid-cols-2">
		<div class="space-y-2">
			<Label for="input-default" class={FIELD_LABEL}>Default</Label>
			<Input id="input-default" placeholder="First name" />
			<p id="input-default-description" class="text-sm text-muted-foreground">
				Tab here to see the 2px focus ring and real offset.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="input-filled" class={FIELD_LABEL}>Filled</Label>
			<Input id="input-filled" value="Jonas Weber" />
			<p class="text-sm text-muted-foreground">Entered text uses the foreground token.</p>
		</div>

		<div class="space-y-2">
			<Label for="input-email" class={FIELD_LABEL}>Email</Label>
			<div class="relative">
				<MailIcon
					aria-hidden="true"
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-faint"
				/>
				<Input id="input-email" type="email" value="jonas.weber@gmail.com" class="pl-12" />
			</div>
			<p class="text-sm text-muted-foreground">Leading icons are composed around the primitive.</p>
		</div>

		<div class="space-y-2">
			<Label for="input-date" class={FIELD_LABEL}>Date of birth</Label>
			<div class="relative">
				<CalendarIcon
					aria-hidden="true"
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-faint"
				/>
				<Input id="input-date" inputmode="numeric" placeholder="DD / MM / YYYY" class="pl-12" />
			</div>
			<p class="text-sm text-muted-foreground">Placeholder-only date field from checkout.</p>
		</div>

		<div class="space-y-2">
			<Label for="input-weight" class={FIELD_LABEL}>Weight</Label>
			<div class="relative">
				<Input
					id="input-weight"
					inputmode="decimal"
					value="96"
					aria-describedby="input-weight-unit"
					class="pr-12"
				/>
				<span
					id="input-weight-unit"
					class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-text-faint"
				>
					kg
				</span>
			</div>
			<p class="text-sm text-muted-foreground">A unit suffix remains outside the input value.</p>
		</div>

		<div class="space-y-2">
			<Label for="input-disabled" class={FIELD_LABEL}>Disabled</Label>
			<Input id="input-disabled" value="Unavailable" disabled />
			<p class="text-sm text-muted-foreground">Dimmed, muted and unavailable to interaction.</p>
		</div>
	</div>

	<div class="mt-12">
		<h3 class="font-display text-xl font-semibold">Reusable field composition</h3>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			Features 7, 8 and 9 copy this order and ARIA relationship: label, control,
			description, then validation message. The error is shown only when validation fails.
		</p>

		<div class="mt-6 max-w-xl rounded-lg border border-border bg-surface-subtle p-6">
			<div class="space-y-2">
				<Label for="input-invalid" class={FIELD_LABEL}>Email address</Label>
				<Input
					id="input-invalid"
					type="email"
					value="jonas@"
					aria-invalid="true"
					aria-describedby="input-invalid-description input-invalid-error"
				/>
				<p id="input-invalid-description" class="text-sm text-muted-foreground">
					We use this for order updates and clinician messages.
				</p>
				<p id="input-invalid-error" class="text-sm font-medium text-destructive-text">
					Enter a complete email address.
				</p>
			</div>
		</div>

		<ol class="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">1. Label</code>
				<p class="mt-2 text-muted-foreground"><code class="font-sans">for</code> matches the control id.</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">2. Control</code>
				<p class="mt-2 text-muted-foreground">
					<code class="font-sans">aria-describedby</code> names both supporting lines.
				</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">3. Description</code>
				<p class="mt-2 text-muted-foreground">Explain why the value is needed.</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">4. Error</code>
				<p class="mt-2 text-muted-foreground">
					Add the message and set <code class="font-sans">aria-invalid</code>.
				</p>
			</li>
		</ol>
	</div>
</ShowcaseSection>
