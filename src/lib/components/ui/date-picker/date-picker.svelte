<script lang="ts" module>
	import { parseDate, type CalendarDate } from '@internationalized/date';

	/**
	 * Everything the field accepts, reduced to its digits. Separators are dropped rather than
	 * required: someone typing `14.05.1990`, `14/05/1990` or `14051990` means the same date,
	 * and refusing two of the three would be pedantry the visitor pays for.
	 */
	export function digitsOf(text: string): string {
		return text.replace(/\D/g, '').slice(0, 8);
	}

	/** `14051990` reads back as `14/05/1990` while it is still being typed. */
	export function maskDigits(digits: string): string {
		const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];

		return parts.filter((part) => part.length > 0).join('/');
	}

	/**
	 * Whether a keystroke should be refused outright. Only single characters typed in are
	 * judged here: a paste or an autofill may carry separators and is cleaned up afterwards
	 * instead, because refusing the whole thing would reject `14/05/1990` off the clipboard.
	 */
	export function blocksInsertion(inputType: string, data: string | null): boolean {
		if (inputType !== 'insertText') return false;

		return data === null || !/^\d+$/.test(data);
	}

	/**
	 * The ISO date those digits name, or null when they do not name one yet or name one that
	 * does not exist. `parseDate` is the judge of the second case: it refuses 31 February
	 * rather than rolling it into March, which is the whole reason it does the checking here.
	 */
	export function isoFromDigits(digits: string): string | null {
		if (digits.length !== 8) return null;

		const day = digits.slice(0, 2);
		const month = digits.slice(2, 4);
		const year = digits.slice(4, 8);
		const iso = `${year}-${month}-${day}`;

		try {
			parseDate(iso);
		} catch {
			return null;
		}

		return iso;
	}
</script>

<script lang="ts">
	import { DateFormatter, type DateValue } from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';

	interface Props {
		id: string;
		value?: string;
		placeholder?: string;
		locale?: string;
		calendarLabel?: string;
		/** Names the icon that opens the calendar, which has no text of its own. */
		openLabel?: string;
		minValue?: CalendarDate;
		maxValue?: CalendarDate;
		initialValue?: CalendarDate;
		invalid?: boolean;
		describedBy?: string;
		disabled?: boolean;
		class?: string;
		onchange: (value: string) => void;
	}

	let {
		id,
		value = '',
		placeholder = 'DD/MM/YYYY',
		locale = 'en-GB',
		calendarLabel = 'Choose a date',
		openLabel = 'Open the calendar',
		minValue,
		maxValue,
		initialValue,
		invalid = false,
		describedBy,
		disabled = false,
		class: className,
		onchange
	}: Props = $props();

	function parse(value: string): CalendarDate | undefined {
		if (!value) return undefined;

		try {
			return parseDate(value);
		} catch {
			return undefined;
		}
	}

	const selected = $derived(parse(value));
	const formatter = $derived(
		new DateFormatter(locale, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'UTC'
		})
	);
	const formatted = $derived(selected ? formatter.format(selected.toDate('UTC')) : '');

	/**
	 * What the field shows. Held separately from the answer because a half-typed date is a
	 * real state the visitor is in and the answer has no way to represent it.
	 */
	let text = $state(untrack(() => (parse(value) ? formatter.format(parse(value)!.toDate('UTC')) : '')));
	let typing = $state(false);

	// The answer changing from anywhere else, the calendar included, is what the field shows,
	// except while someone is typing into it.
	$effect(() => {
		const next = formatted;
		if (!typing) untrack(() => (text = next));
	});

	let open = $state(false);
	let visibleMonth = $state<DateValue | undefined>(
		untrack(() => parse(value) ?? initialValue ?? maxValue)
	);

	$effect(() => {
		if (selected) visibleMonth = selected;
	});

	/**
	 * Letters never reach the field. Refused here rather than stripped afterwards, because a
	 * stripped character has already moved the caret, and typing one into an empty field
	 * leaves nothing for the renderer to correct: the masked value is unchanged, so Svelte
	 * has no reason to touch the element and the letter stays on screen.
	 */
	function guard(event: InputEvent & { currentTarget: HTMLInputElement }): void {
		if (blocksInsertion(event.inputType, event.data)) event.preventDefault();
	}

	function type(event: Event & { currentTarget: HTMLInputElement }): void {
		typing = true;

		const digits = digitsOf(event.currentTarget.value);
		text = maskDigits(digits);

		// A paste or an autofill can still bring anything in, and this is the same blind spot:
		// when the mask leaves the value unchanged the element is corrected directly.
		if (event.currentTarget.value !== text) event.currentTarget.value = text;

		const iso = isoFromDigits(digits);
		// Reported the moment the date is whole, and cleared the moment the field is. Anything
		// in between leaves the answer alone: a partial date is not a different date.
		if (iso !== null) onchange(iso);
		else if (digits.length === 0 && value) onchange('');
	}

	/**
	 * Leaving with something that is not a date empties the field, because the alternative is
	 * a field reading `14/05/19` beside an answer that holds nothing.
	 */
	function settle(): void {
		typing = false;
		text = formatted;
	}

	function select(next: DateValue | undefined): void {
		if (!next) return;

		typing = false;
		onchange(next.toString());
		open = false;
	}
</script>

<div class={cn('relative', className)}>
	<Input
		{id}
		type="text"
		inputmode="numeric"
		autocomplete="bday"
		value={text}
		{placeholder}
		{disabled}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		class="pr-12 tabular-nums"
		onbeforeinput={guard}
		oninput={type}
		onblur={settle}
	/>

	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					variant="ghost"
					aria-label={openLabel}
					{disabled}
					class="absolute top-1 right-1 size-10 rounded-md p-0 hover:bg-muted"
				>
					<CalendarIcon aria-hidden="true" class="size-4 text-muted-foreground" />
				</Button>
			{/snippet}
		</Popover.Trigger>

		<!--
			`mp-sensitive` because this content is portalled to `document.body`, which puts it
			outside `QuestionnaireShell` and outside the class the shell carries for exactly this
			purpose. Mixpanel's heatmap reports the tracked attributes of every ancestor of a
			click, and the calendar labels its grid and its cells with the date they name, so
			without this a click here sends the visitor's date of birth in clear. A browser run
			caught precisely that. The class is on the content rather than the trigger because
			the walk goes upward from the element clicked.
		-->
		<Popover.Content
			class="mp-sensitive w-auto overflow-hidden rounded-lg border border-border bg-card p-0 shadow-none ring-0"
			align="start"
		>
			<Calendar
				data-slot="calendar"
				type="single"
				value={selected}
				bind:placeholder={visibleMonth}
				{minValue}
				{maxValue}
				{locale}
				{calendarLabel}
				weekStartsOn={1}
				captionLayout="dropdown"
				initialFocus
				onValueChange={select}
			/>
		</Popover.Content>
	</Popover.Root>
</div>
