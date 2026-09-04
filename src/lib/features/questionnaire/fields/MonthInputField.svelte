<script lang="ts" module>
	/** Everything typed, reduced to the six digits `MM/YYYY` holds. */
	export function digitsOf(text: string): string {
		return text.replace(/\D/g, '').slice(0, 6);
	}

	/** `082026` reads back as `08/2026` while it is still being typed. */
	export function maskDigits(digits: string): string {
		const parts = [digits.slice(0, 2), digits.slice(2, 6)];

		return parts.filter((part) => part.length > 0).join('/');
	}
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(maskDigits(digitsOf(typeof value === 'string' ? value : '')));

	/**
	 * A month and a year, not a free sentence: RxScale asks for the date of the last dose as
	 * precisely as the person remembers it, and a doctor reads the answer to work out the
	 * interval since. "irgendwann im Sommer" is not an interval.
	 *
	 * The separator is inserted rather than required, the same bargain the date of birth
	 * makes: someone typing `08/2026`, `08.2026` or `082026` means the same month.
	 */
	function type(event: Event & { currentTarget: HTMLInputElement }): void {
		onchange(maskDigits(digitsOf(event.currentTarget.value)));
	}

	/**
	 * A typed non-digit is refused at the keystroke, so nothing appears at all.
	 *
	 * Only a single character is judged. Anything longer arrived whole, from the clipboard, an
	 * autofill or an input method, and `type` masks it into shape afterwards; refusing it here
	 * would reject `08/2026` pasted from a mail, which is the likeliest way this field is
	 * filled at all.
	 */
	function guard(event: InputEvent): void {
		if (event.inputType !== 'insertText') return;
		if (event.data === null || event.data.length > 1) return;
		if (/^\d$/.test(event.data)) return;

		event.preventDefault();
	}
</script>

<Input
	id={controlId}
	type="text"
	inputmode="numeric"
	autocomplete="off"
	class="tabular-nums"
	placeholder={question.placeholder?.()}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	value={text}
	onbeforeinput={guard}
	oninput={type}
/>
