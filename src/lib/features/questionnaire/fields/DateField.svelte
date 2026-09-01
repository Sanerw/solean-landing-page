<script lang="ts">
	import { today } from '@internationalized/date';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import type { QuestionFieldProps } from '../question-registry';

	let { controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	/**
	 * RxScale's validator accepts visitors from their 18th birthday until the day before
	 * their 80th. The picker mirrors that rule so impossible dates are not offered, while
	 * SurveyJS remains the authority that validates the submitted answer.
	 */
	const date = $derived(typeof value === 'string' ? value : '');
	const todayInGermany = today('Europe/Berlin');
	const minValue = todayInGermany.subtract({ years: 80 }).add({ days: 1 });
	const maxValue = todayInGermany.subtract({ years: 18 });
	const initialValue = todayInGermany.subtract({ years: 35 });
</script>

<DatePicker
	id={controlId}
	value={date}
	placeholder="DD/MM/YYYY"
	calendarLabel="Date of birth"
	openLabel="Open the calendar"
	{minValue}
	{maxValue}
	{initialValue}
	{invalid}
	{describedBy}
	class="w-full sm:max-w-xs"
	onchange={(next) => onchange(next)}
/>
