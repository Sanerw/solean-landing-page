<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldDescription, FieldError, FieldLabel } from '$lib/components/ui/field';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ShowcaseSection from './ShowcaseSection.svelte';
</script>

<ShowcaseSection
	id="input-label"
	title="Input and Label"
	description="White fields, a corrected --input boundary, rounded-md corners and the shared focus ring reproduce the reference. Focus-visible, invalid and disabled states are design-system decisions because no artboard captures them."
>
	<div class="grid gap-8 md:grid-cols-2">
		<Field>
			<FieldLabel for="input-default">Default</FieldLabel>
			<Input id="input-default" placeholder="First name" />
			<FieldDescription>Tab here to see the 2px focus ring and real offset.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="input-filled">Filled</FieldLabel>
			<Input id="input-filled" value="Jonas Weber" />
			<FieldDescription>Entered text uses the foreground token.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="input-email">Email</FieldLabel>
			<div class="relative">
				<MailIcon
					aria-hidden="true"
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-faint"
				/>
				<Input id="input-email" type="email" value="jonas.weber@gmail.com" class="pl-12" />
			</div>
			<FieldDescription>Leading icons are composed around the primitive.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="input-date">Date of birth</FieldLabel>
			<div class="relative">
				<CalendarIcon
					aria-hidden="true"
					class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-faint"
				/>
				<Input id="input-date" inputmode="numeric" placeholder="DD / MM / YYYY" class="pl-12" />
			</div>
			<FieldDescription>Placeholder-only date field from checkout.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="input-weight">Weight</FieldLabel>
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
			<FieldDescription>A unit suffix remains outside the input value.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="input-disabled">Disabled</FieldLabel>
			<Input id="input-disabled" value="Unavailable" disabled />
			<FieldDescription>Dimmed, muted and unavailable to interaction.</FieldDescription>
		</Field>
	</div>

	<div class="mt-12">
		<h3 class="font-display text-xl font-semibold">Reusable field composition</h3>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			Features 7, 8 and 9 compose this same <code class="font-sans">Field</code>: label, control,
			description, then <code class="font-sans">FieldError</code>, shown only when validation fails.
		</p>

		<div class="mt-6 max-w-xl rounded-lg border border-border bg-surface-subtle p-6">
			<Field data-invalid="true">
				<FieldLabel for="input-invalid">Email address</FieldLabel>
				<Input
					id="input-invalid"
					type="email"
					value="jonas@"
					aria-invalid="true"
					aria-describedby="input-invalid-description input-invalid-error"
				/>
				<FieldDescription id="input-invalid-description">
					We use this for order updates and clinician messages.
				</FieldDescription>
				<FieldError id="input-invalid-error">Enter a complete email address.</FieldError>
			</Field>
		</div>

		<ol class="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">1. FieldLabel</code>
				<p class="mt-2 text-muted-foreground"><code class="font-sans">for</code> matches the control id.</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">2. Control</code>
				<p class="mt-2 text-muted-foreground">
					<code class="font-sans">aria-describedby</code> names both supporting lines.
				</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">3. FieldDescription</code>
				<p class="mt-2 text-muted-foreground">Explain why the value is needed.</p>
			</li>
			<li class="rounded-md border border-border bg-card p-4">
				<code class="font-sans font-medium">4. FieldError</code>
				<p class="mt-2 text-muted-foreground">
					Renders only when passed content, and sets <code class="font-sans">role="alert"</code>.
				</p>
			</li>
		</ol>
	</div>
</ShowcaseSection>
