<script lang="ts">
	import ShowcaseSection from '../design-system/ShowcaseSection.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { formatMoney } from '$lib/domain';
	import { checkoutService } from '$lib/features/checkout/checkout-service';
	import { orderService } from '$lib/features/order-status/order-service';
	import { questionnaireService } from '$lib/features/questionnaire/questionnaire-service';
	import { journey } from '$lib/journey/journey.svelte';
	import { STAGES, canEnter } from '$lib/journey/stages';

	const answers = $derived(questionnaireService.getAnswers());
	const answerCount = $derived(Object.keys(answers.byQuestionId).length);
	const selection = $derived(checkoutService.getSelection());
	const orderId = $derived(journey.session.orderId);
	const orderStatus = $derived(orderId === null ? null : orderService.getStatus(orderId));
	const guards = $derived(STAGES.map((stage) => ({ stage, access: canEnter(stage, journey.session) })));
	const seededOrders = $derived(
		orderService.listSeededOrderIds().map((id) => ({ id, status: orderService.getStatus(id) }))
	);

	const treatments = checkoutService.listTreatments();
	const addOns = checkoutService.listAddOns();

	// A stand-in for a real questionnaire answer, which feature 7's schema will define.
	const SAMPLE_ANSWER_ID = 'scenario-sample';
</script>

<svelte:head>
	<title>Prototype scenario · Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#snippet field(label: string, value: string)}
	<div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-b-0">
		<dt class="font-sans text-sm text-muted-foreground">{label}</dt>
		<dd class="font-display text-sm font-medium">{value}</dd>
	</div>
{/snippet}

<main class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
	<header class="pb-12">
		<p class="font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
			Development surface
		</p>
		<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">Prototype scenario</h1>
		<p class="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
			The journey session, the stage derived from it, and the guards that decide what a visitor may
			enter. Every value below is read through a service or the journey module, never from a
			fixture or session storage directly. Not a public route and not linked from the app.
		</p>
		<p class="mt-4 max-w-3xl text-sm text-text-faint">
			State lives in sessionStorage under solean.journey and is per tab. Nothing here is a design
			deliverable.
		</p>
		<div class="mt-6">
			<Button variant="outline" size="sm" href="/dev/scenario/guarded">
				Open the guarded route
			</Button>
		</div>
	</header>

	<ShowcaseSection
		id="stage"
		title="Stage"
		description="Derived from the session's facts on every read, never stored, so it cannot drift out of agreement with them."
	>
		<div class="flex flex-wrap items-center gap-4">
			<Badge variant="highlight">{journey.stage}</Badge>
			<p class="text-sm text-muted-foreground">
				The furthest stage the session justifies. An empty session reads browsing.
			</p>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="controls"
		title="Controls"
		description="Every service method this layer exposes, driven by hand. Selections are written through the services, never straight into storage."
	>
		<div class="grid gap-12 lg:grid-cols-2">
			<fieldset>
				<legend class="font-display text-xl font-semibold">Treatment</legend>
				<p id="treatment-help" class="mt-2 text-sm text-muted-foreground">
					CheckoutService.selectTreatment. Selecting one flips the checkout guard once the
					questionnaire is also complete.
				</p>
				<RadioGroup.Root
					bind:value={
						() => journey.session.selectedTreatmentId ?? 'none',
						(value) => checkoutService.selectTreatment(value === 'none' ? null : value)
					}
					aria-describedby="treatment-help"
					class="mt-6"
				>
					<div class="flex items-center gap-3">
						<RadioGroup.Item id="treatment-none" value="none" />
						<Label for="treatment-none">None</Label>
					</div>
					{#each treatments as treatment (treatment.id)}
						<div class="flex items-center gap-3">
							<RadioGroup.Item id="treatment-{treatment.id}" value={treatment.id} />
							<Label for="treatment-{treatment.id}">
								{treatment.name} · {formatMoney(treatment.price)}
							</Label>
						</div>
					{/each}
				</RadioGroup.Root>
			</fieldset>

			<fieldset>
				<legend class="font-display text-xl font-semibold">Add-ons</legend>
				<p class="mt-2 text-sm text-muted-foreground">CheckoutService.toggleAddOn.</p>
				<div class="mt-6 space-y-3">
					{#each addOns as addOn (addOn.id)}
						<div class="flex items-center gap-3">
							<Checkbox
								id="addon-{addOn.id}"
								bind:checked={
									() => journey.session.selectedAddOnIds.includes(addOn.id),
									(checked) => {
										if (checked !== journey.session.selectedAddOnIds.includes(addOn.id)) {
											checkoutService.toggleAddOn(addOn.id);
										}
									}
								}
							/>
							<Label for="addon-{addOn.id}">{addOn.name} · {formatMoney(addOn.price)}</Label>
						</div>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="font-display text-xl font-semibold">Questionnaire</legend>
				<p class="mt-2 text-sm text-muted-foreground">
					QuestionnaireService.setCompleted, saveAnswer and clear. Feature 7 owns the real schema,
					so the recorded answer is a stand-in.
				</p>
				<div class="mt-6 flex items-center gap-3">
					<Checkbox
						id="questionnaire-completed"
						bind:checked={
							() => journey.session.questionnaire.completed,
							(checked) => questionnaireService.setCompleted(checked)
						}
					/>
					<Label for="questionnaire-completed">Completed</Label>
				</div>
				<div class="mt-4 flex flex-wrap gap-3">
					<Button
						variant="outline"
						size="sm"
						onclick={() =>
							questionnaireService.saveAnswer(SAMPLE_ANSWER_ID, {
								kind: 'single-select',
								optionId: 'yes'
							})}
					>
						Record a sample answer
					</Button>
					<Button variant="outline" size="sm" onclick={() => questionnaireService.clear()}>
						Clear answers
					</Button>
				</div>
			</fieldset>

			<fieldset>
				<legend class="font-display text-xl font-semibold">Session</legend>
				<p class="mt-2 text-sm text-muted-foreground">
					Reset clears both the in-memory session and the storage key.
				</p>
				<div class="mt-6">
					<Button variant="destructive" size="sm" onclick={() => journey.reset()}>
						Reset session
					</Button>
				</div>
			</fieldset>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="session"
		title="Session"
		description="The persisted facts. Stage is deliberately absent from this list because it is derived, not stored."
	>
		<dl class="max-w-3xl">
			{@render field('Version', String(journey.session.version))}
			{@render field('Questionnaire completed', journey.session.questionnaire.completed ? 'yes' : 'no')}
			{@render field('Answers recorded', String(answerCount))}
			{@render field('First unanswered index', String(answers.firstUnansweredIndex))}
			{@render field('Selected treatment id', journey.session.selectedTreatmentId ?? 'none')}
			{@render field(
				'Selected add-on ids',
				journey.session.selectedAddOnIds.length > 0 ? journey.session.selectedAddOnIds.join(', ') : 'none'
			)}
			{@render field('Patient details', journey.session.patient === null ? 'none' : 'present')}
			{@render field('Shipping address', journey.session.shipping === null ? 'none' : 'present')}
			{@render field('Order id', orderId ?? 'none')}
			{@render field('Order status', orderStatus ?? 'none')}
		</dl>
	</ShowcaseSection>

	<ShowcaseSection
		id="selection"
		title="Resolved selection"
		description="Ids from the session resolved through the catalogue. A stored id the catalogue no longer knows resolves to nothing rather than a phantom selection."
	>
		<div class="grid gap-8 lg:grid-cols-2">
			<div>
				<h3 class="font-display text-xl font-semibold">Treatment</h3>
				{#if selection.treatment}
					<div class="mt-4 rounded-lg border border-border p-6">
						<div class="flex flex-wrap items-center gap-3">
							<p class="font-display text-lg font-medium">{selection.treatment.name}</p>
							<Badge variant={selection.treatment.form === 'injection' ? 'accent' : 'highlight'}>
								{selection.treatment.form}
							</Badge>
						</div>
						<p class="mt-2 text-sm text-muted-foreground">
							{selection.treatment.dose} · {selection.treatment.claim}
						</p>
						<p class="mt-4 font-display text-2xl font-medium">
							{formatMoney(selection.treatment.price)}
						</p>
					</div>
				{:else}
					<p class="mt-4 text-sm text-muted-foreground">No treatment selected.</p>
				{/if}
			</div>

			<div>
				<h3 class="font-display text-xl font-semibold">Add-ons</h3>
				{#if selection.addOns.length > 0}
					<ul class="mt-4 space-y-3">
						{#each selection.addOns as addOn (addOn.id)}
							<li class="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border p-4">
								<div>
									<p class="font-display text-base font-medium">{addOn.name}</p>
									<p class="text-sm text-muted-foreground">{addOn.description}</p>
								</div>
								<p class="font-display text-base font-medium">
									{formatMoney(addOn.price)} <span class="text-sm text-text-tertiary">{addOn.unit}</span>
								</p>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-4 text-sm text-muted-foreground">No add-ons selected.</p>
				{/if}
			</div>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="guards"
		title="Guards"
		description="What the current session may enter. A denial carries the route to send the visitor to and a reason a layout can act on."
	>
		<div class="overflow-x-auto">
			<table class="w-full min-w-lg text-left text-sm">
				<thead class="border-b border-border">
					<tr>
						<th scope="col" class="py-3 pr-4 font-sans font-semibold">Stage</th>
						<th scope="col" class="py-3 pr-4 font-sans font-semibold">Access</th>
						<th scope="col" class="py-3 pr-4 font-sans font-semibold">Reason</th>
						<th scope="col" class="py-3 font-sans font-semibold">Redirect</th>
					</tr>
				</thead>
				<tbody>
					{#each guards as { stage, access } (stage)}
						<tr class="border-b border-border last:border-b-0">
							<td class="py-3 pr-4 font-display font-medium">{stage}</td>
							<td class="py-3 pr-4">
								<Badge variant={access.allowed ? 'accent' : 'destructive'}>
									{access.allowed ? 'allowed' : 'denied'}
								</Badge>
							</td>
							<td class="py-3 pr-4 text-muted-foreground">{access.allowed ? '' : access.reason}</td>
							<td class="py-3 text-muted-foreground">{access.allowed ? '' : access.redirectTo}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		id="orders"
		title="Seeded orders"
		description="The six presented order states, each reachable directly by id without walking the funnel. Seeding one flips the order guard."
	>
		<ul class="grid max-w-3xl gap-3 sm:grid-cols-2">
			{#each seededOrders as order (order.id)}
				<li>
					<Button
						variant={order.id === orderId ? 'secondary' : 'outline'}
						class="w-full justify-between"
						aria-pressed={order.id === orderId}
						onclick={() => journey.setOrderId(order.id)}
					>
						<code class="font-sans text-sm">{order.id}</code>
						<span class="font-sans text-sm font-normal">{order.status}</span>
					</Button>
				</li>
			{/each}
		</ul>
		<div class="mt-4">
			<Button variant="outline" size="sm" onclick={() => journey.setOrderId(null)}>
				Clear order id
			</Button>
		</div>
	</ShowcaseSection>
</main>
