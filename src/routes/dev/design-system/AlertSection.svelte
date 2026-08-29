<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import XIcon from '@lucide/svelte/icons/x';
	import ShowcaseSection from './ShowcaseSection.svelte';

	let dismissed = $state(false);
	let saved = $state(false);
</script>

<ShowcaseSection
	id="alert"
	title="Alert"
	description="Visual variant and announcement urgency are independent choices. Static information carries no role at all; runtime feedback opts into role=status or role=alert explicitly."
>
	<div class="grid gap-6 lg:grid-cols-2">
		{#if !dismissed}
			<Alert.Root>
				<TruckIcon aria-hidden="true" />
				<Alert.Title>Good news, delivery is on us</Alert.Title>
				<Alert.Description>Free tracked delivery in 2 working days.</Alert.Description>
				<Alert.Action>
					<Button
						variant="ghost"
						size="icon"
						class="size-8"
						aria-label="Dismiss"
						onclick={() => (dismissed = true)}
					>
						<XIcon aria-hidden="true" />
					</Button>
				</Alert.Action>
			</Alert.Root>
		{/if}

		<Alert.Root variant="highlighted">
			<SparklesIcon aria-hidden="true" />
			<Alert.Title>At 6 months</Alert.Title>
			<Alert.Description>
				Enough time to lose weight steadily, build healthier habits and see meaningful, lasting
				change.
			</Alert.Description>
		</Alert.Root>

		<Alert.Root variant="destructive">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>This treatment may not be suitable</Alert.Title>
			<Alert.Description>
				Your answers indicate a condition a clinician needs to review before prescribing.
			</Alert.Description>
		</Alert.Root>

		<div class="space-y-3">
			<Button
				variant="secondary"
				onclick={() => {
					saved = true;
					setTimeout(() => (saved = false), 3000);
				}}
			>
				Save answer
			</Button>
			{#if saved}
				<Alert.Root role="status" class="py-2">
					<Alert.Description>Saved. A screen reader announces this once, politely.</Alert.Description>
				</Alert.Root>
			{/if}
		</div>
	</div>

	<p class="mt-6 max-w-3xl text-sm text-muted-foreground">
		The first three alerts above are static page content: no <code class="font-sans">role</code>, so
		a screen reader does not treat them as events. "Save answer" mounts a
		<code class="font-sans">role="status"</code> alert only when the action actually happens, the
		correct place for a genuine live announcement.
	</p>
</ShowcaseSection>
