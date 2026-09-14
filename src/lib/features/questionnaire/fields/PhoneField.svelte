<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { InputGroup, InputGroupAddon, InputGroupInput } from '$lib/components/ui/input-group';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { CountryCode } from 'libphonenumber-js/max';
	import {
		chooseCountry,
		countryList,
		enterPhone,
		keepDiallable,
		searchCountries,
		readPhone,
		type PhoneEntry
	} from '../definition/phone';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	/**
	 * Seeded once from the stored answer, then owned here.
	 *
	 * The answer stays one E.164 string with no country stored beside it, so the selector reads
	 * its country back out of the number. That is what lets the 30-day session and the mapper
	 * carry on unchanged, and it is why this is `$state` seeded from the prop rather than
	 * `$derived` of it: the box holds the national part, which is not what the answer holds.
	 */
	const initial = untrack(() => readPhone(typeof value === 'string' ? value : ''));
	let country = $state<CountryCode>(initial.country);
	let national = $state(initial.national);
	let open = $state(false);
	let search = $state('');
	let numberInput = $state<HTMLInputElement | null>(null);
	/**
	 * Which of the two ways out of the popover was taken. Escape belongs back on the trigger,
	 * the way every popover behaves; a chosen country belongs in the number box. The popover
	 * restores focus itself after the click handler has run, so calling `focus` there alone was
	 * silently undone.
	 */
	let picked = false;

	const countries = $derived(countryList(getLocale()));
	const chosen = $derived(countries.find((entry) => entry.code === country));
	/**
	 * Filtered and ordered here rather than by the list component, which hides what does not
	 * match but leaves it where it was: searching "pol" drew Französisch-Polynesien above Polen
	 * and handed the wrong country to the Enter key.
	 */
	const visible = $derived(searchCountries(countries, search));

	/**
	 * Typing, with the characters a number cannot contain dropped on the way in.
	 *
	 * The caret is put back by hand, counted in surviving characters rather than in typed ones:
	 * assigning `value` moves it to the end of the box, so without this a letter typed in the
	 * middle of a number would throw the caret to the end of it.
	 */
	function type(event: Event & { currentTarget: HTMLInputElement }): void {
		const field = event.currentTarget;
		const typed = field.value;
		const kept = keepDiallable(typed);

		if (kept !== typed) {
			const caret = field.selectionStart ?? typed.length;
			const keptBeforeCaret = keepDiallable(typed.slice(0, caret)).length;

			field.value = kept;
			field.setSelectionRange(keptBeforeCaret, keptBeforeCaret);
		}

		apply(enterPhone(kept, country));
	}

	function apply(next: PhoneEntry): void {
		country = next.country;
		national = next.national;
		onchange(next.value);
	}

	/**
	 * Picking a country is never the last thing somebody wants to do here: the number still has
	 * to be typed. Focus follows the choice into the box rather than being left on a closed
	 * popover, which would cost a keyboard user a Tab and a sighted user the caret.
	 */
	function pick(next: CountryCode): void {
		apply(chooseCountry(national, next));
		picked = true;
		open = false;
		search = '';
	}

	/**
	 * Formatting happens here and nowhere else. Between keystrokes it would move the caret to
	 * the end of the box; on the way out it is confirmation that the number was understood, in
	 * the shape the country writes it. A number that is not valid is left exactly as typed,
	 * because reformatting something about to be reported as wrong only hides what was wrong.
	 */
	function formatOnBlur(): void {
		const stored = typeof value === 'string' ? value : '';
		if (!stored) return;

		const read = readPhone(stored);
		if (read.value === stored) national = read.national;
	}
</script>

<InputGroup>
	<!--
		The artboard draws a smartphone icon here. The selector takes its place rather than
		sitting beside it: both are the same slot, and a country nobody can change is worth less
		than the icon it would displace.
	-->
	<InputGroupAddon align="inline-start" class="p-0">
		<Popover.Root bind:open>
			<!--
				A segment of the field rather than a chip floating inside it: full height, rounded
				only where the field is rounded, and a rule separating it from the number. A
				rounded box inside a box of the same radius is what made the hover read as a
				second control, and the divider is what keeps the two halves legible without one.
			-->
			<Popover.Trigger
				class="flex h-full items-center gap-2 rounded-l-md border-r border-border px-4 font-medium outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=open]:bg-muted"
				aria-label={m.qn_phone_country()}
			>
				<!--
					The country name is here for a screen reader alone. Without it the control
					announces "Ländervorwahl, +49", which is the one thing a person who cannot see
					the flag needs spelled out.
				-->
				<span class="sr-only">{chosen?.name}</span>
				<img src={chosen?.flagSrc} alt="" width="20" height="20" class="size-5 shrink-0" />
				<span aria-hidden="true">+{chosen?.callingCode}</span>
				<ChevronDownIcon class="size-3 text-text-faint" aria-hidden="true" />
			</Popover.Trigger>
			<!--
				`mp-sensitive` because this content is portalled to `document.body`, which puts it
				outside the shell that carries the class for the rest of the questionnaire.
				Without it the heatmap collects this list's own labels off a questionnaire screen.
			-->
			<!--
				The panel's own radius, not the Popover's. That default is `rounded-3xl`, which
				this scale resolves to 44px: right for the card the date picker opens, far too
				round for a list whose rows are 12px.
			-->
			<Popover.Content
				class="mp-sensitive w-72 gap-0 rounded-md border border-border p-1.5 sm:w-96"
				align="start"
				sideOffset={8}
				onCloseAutoFocus={(event) => {
					if (!picked) return;

					event.preventDefault();
					picked = false;
					numberInput?.focus();
				}}
			>
				<Command.Root shouldFilter={false}>
					<Command.Input placeholder={m.qn_phone_country_search()} bind:value={search} />
					<Command.List>
						{#if visible.length === 0}
							<p class="py-6 text-center text-sm text-muted-foreground">
								{m.qn_phone_country_empty()}
							</p>
						{/if}
						{#each visible as entry, index (entry.code)}
							{#if !entry.pinned && visible[index - 1]?.pinned && !search}
								<Command.Separator />
							{/if}
							<!-- Keyed by the country's own name, which is what `score` looks it up by. -->
							<Command.Item
								value={entry.name}
								onSelect={() => pick(entry.code)}
							>
								<img src={entry.flagSrc} alt="" loading="lazy" width="20" height="20" class="size-5 shrink-0" />
								<span class="flex-1 truncate">{entry.name}</span>
								<span class="text-muted-foreground">+{entry.callingCode}</span>
								{#if entry.code === country}
									<CheckIcon class="size-4" aria-hidden="true" />
								{/if}
							</Command.Item>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</InputGroupAddon>
	<InputGroupInput
		bind:ref={numberInput}
		id={controlId}
		type="tel"
		inputmode="tel"
		class="h-full pl-3"
		autocomplete="tel-national"
		placeholder={question.placeholder?.()}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		value={national}
		oninput={type}
		onblur={formatOnBlur}
	/>
</InputGroup>
