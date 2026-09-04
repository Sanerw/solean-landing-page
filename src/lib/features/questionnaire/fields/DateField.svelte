<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { today } from '@internationalized/date';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import type { FieldProps } from '../definition/field-props';

	let { controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const date = $derived(typeof value === 'string' ? value : '');

	/**
	 * The picker is bounded to the window RxScale accepts, so an impossible date is not
	 * offered. It is a convenience, not the gate: their `age({dob}) < 80 && age({dob}) >= 18`
	 * runs from the committed snapshot through `theirErrors`, and 24a's own validation
	 * deliberately checks only that the date is real and not in the future. Anyone who reaches
	 * an out-of-window date another way is refused by their rule, in their words.
	 */
	const todayInGermany = today('Europe/Berlin');
	const minValue = todayInGermany.subtract({ years: 80 }).add({ days: 1 });
	const maxValue = todayInGermany.subtract({ years: 18 });
	const initialValue = todayInGermany.subtract({ years: 35 });
</script>

<DatePicker
	id={controlId}
	value={date}
	{minValue}
	{maxValue}
	{initialValue}
	{invalid}
	{describedBy}
	placeholder="DD/MM/YYYY"
	calendarLabel={m.q_date_of_birth()}
	openLabel={m.q_open_calendar()}
	class="w-full sm:max-w-xs"
	onchange={(next) => onchange(next)}
/>
