<script lang="ts">
	import { today } from '@internationalized/date';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Field, FieldDescription, FieldLabel } from '$lib/components/ui/field';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const currentDate = today('Europe/Berlin');
	const minValue = currentDate.subtract({ years: 80 }).add({ days: 1 });
	const maxValue = currentDate.subtract({ years: 18 });
	const initialValue = currentDate.subtract({ years: 35 });

	let emptyDate = $state('');
	let selectedDate = $state('1990-05-14');
</script>

<ShowcaseSection
	id="date-picker"
	title="Date Picker"
	description="A compact date-of-birth field. It takes DD/MM/YYYY typed straight in, putting the separators in itself, opens a calendar with month and year dropdowns, and returns locale-independent YYYY-MM-DD values."
>
	<div class="grid gap-8 md:grid-cols-2">
		<Field>
			<FieldLabel for="date-picker-empty">Date of birth</FieldLabel>
			<DatePicker
				id="date-picker-empty"
				value={emptyDate}
				calendarLabel="Date of birth"
				{minValue}
				{maxValue}
				{initialValue}
				onchange={(value) => (emptyDate = value)}
			/>
			<FieldDescription>Empty state and the selectable 18–79 age range.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="date-picker-selected">Selected date</FieldLabel>
			<DatePicker
				id="date-picker-selected"
				value={selectedDate}
				calendarLabel="Date of birth"
				{minValue}
				{maxValue}
				{initialValue}
				onchange={(value) => (selectedDate = value)}
			/>
			<FieldDescription>
				Displayed as 14/05/1990; component value: <code class="font-sans">{selectedDate}</code>.
			</FieldDescription>
		</Field>
	</div>
</ShowcaseSection>
