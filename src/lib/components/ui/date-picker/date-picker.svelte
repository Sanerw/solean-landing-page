<script lang="ts">
	import {
		DateFormatter,
		parseDate,
		type CalendarDate,
		type DateValue
	} from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';

	interface Props {
		id: string;
		value?: string;
		placeholder?: string;
		locale?: string;
		calendarLabel?: string;
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
		placeholder = 'Datum auswählen',
		locale = 'de-DE',
		calendarLabel = 'Datum auswählen',
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

	let open = $state(false);
	let visibleMonth = $state<DateValue | undefined>(
		untrack(() => parse(value) ?? initialValue ?? maxValue)
	);

	$effect(() => {
		if (selected) visibleMonth = selected;
	});

	function select(next: DateValue | undefined): void {
		if (!next) return;

		onchange(next.toString());
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				{id}
				type="button"
				variant="outline"
				aria-invalid={invalid ? 'true' : undefined}
				aria-describedby={describedBy}
				{disabled}
				class={cn(
					'h-12 w-full justify-between rounded-md border-border bg-card px-3 py-2 text-sm font-normal hover:bg-card active:translate-y-0 active:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-0',
					!selected && 'text-text-faint',
					className
				)}
			>
				<span class="tabular-nums">{formatted || placeholder}</span>
				<CalendarIcon aria-hidden="true" class="size-4 text-muted-foreground" />
			</Button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		class="w-auto overflow-hidden rounded-lg border border-border bg-card p-0 shadow-none ring-0"
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
