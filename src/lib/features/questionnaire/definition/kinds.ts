import type { Answers, QuestionId } from '../answers/types';

/**
 * The question contract. One `QuestionDef` per question the visitor answers, held as data in
 * `questions.ts` rather than expressed by a component, so the whole questionnaire can be read
 * in one file and checked by tests that never render anything.
 */

/**
 * A Paraglide message function, passed by reference rather than looked up by key.
 *
 * `m.q_gender_label`, never `m[key]`. A reference is checked at build time, so a message that
 * does not exist is a failed build instead of a question whose label is the string
 * "q_gender_label" on a live screen. It is the same rule the analytics module states about
 * event names, for the same reason.
 */
export type MessageFn = () => string;

export interface ChoiceOption {
	/**
	 * What is stored and, wherever RxScale has an equivalent, exactly what they store, so
	 * 24b's mapper is an identity for the choice. Every place it cannot be is a place the
	 * mapper has to translate, which is worth seeing in a diff.
	 */
	readonly value: string;
	readonly label: MessageFn;
}

/**
 * The kinds a question can be. Deliberately fewer than RxScale's type list: `multipletext`
 * and `expression` are theirs to model a page, and ours are the controls a person operates.
 */
export type QuestionKind = 'single' | 'multi' | 'text' | 'number' | 'date' | 'comment' | 'consent';

/**
 * Which kinds may write which answer type. This is what stops a question from claiming a kind
 * its answer cannot hold: marking `heightCm` as `single` fails to compile, because a `single`
 * writes `string | null` and `heightCm` is a `string`.
 *
 * The tuple wrappers keep a union answer type from distributing, so `Gender | null` is tested
 * whole rather than one member at a time.
 */
type KindFor<Value> = [Value] extends [boolean]
	? 'consent'
	: [Value] extends [string[]]
		? 'multi'
		: [Value] extends [string]
			? 'text' | 'number' | 'comment'
			: 'single' | 'date';

/** The `*Other` sibling that holds an "other" choice's free text, by naming convention. */
type OtherFieldFor<Id extends QuestionId> = `${Id & string}Other` & QuestionId;

/** Options may depend on earlier answers. See `dynamic options` in the interface below. */
export type Options = readonly ChoiceOption[] | ((answers: Answers) => readonly ChoiceOption[]);

interface QuestionShape<Id extends QuestionId, Kind extends QuestionKind> {
	readonly id: Id;
	readonly kind: Kind;
	readonly label: MessageFn;
	readonly description?: MessageFn;
	/**
	 * Dynamic options are not speculative generality. RxScale asks the dose with four
	 * different option sets depending on which medication was named, and our one dose question
	 * has to offer whichever set applies.
	 */
	readonly options?: Options;
	/** `single` and `multi` only. A `multi` with neither is a plain list. */
	readonly hasNone?: boolean;
	readonly hasOther?: boolean;
	/**
	 * Required when `hasOther` is set: where the free text is stored.
	 *
	 * `NoInfer` keeps this out of inference. Without it `Id` is a candidate from both `id` and
	 * here, TypeScript widens to satisfy both, and the naming rule stops being checked at all:
	 * `diseases` would happily point at `allergiesOther`.
	 */
	readonly otherField?: OtherFieldFor<NoInfer<Id>>;
	/**
	 * `consent` only: the wording beside the box the visitor ticks, as distinct from the
	 * instruction above it. RxScale keeps this as a one-item choice list; ours is a boolean,
	 * so the wording needs a home of its own rather than being invented by a screen.
	 */
	readonly confirmLabel?: MessageFn;
	/**
	 * `number` only: the range a typed value has to fall in.
	 *
	 * A plausibility check, not an eligibility rule, and the distinction decides who owns it.
	 * RxScale's message for a height outside this band is "Bitte überprüfe Deine Angaben",
	 * please check your entry, which is a typo check we can make immediately. Their BMI floor
	 * and age window read "Leider können wir Dir kein Medikament verschreiben", and those are
	 * medical decisions that stay theirs and arrive from the snapshot in 24b.
	 */
	readonly range?: { readonly min: number; readonly max: number };
	/** Defaults to required. RxScale requires nearly every question, and so do we. */
	readonly optional?: boolean;
	/** Answers this question is asked for. Absent means always. */
	readonly visibleIf?: (answers: Answers) => boolean;
}

/**
 * One question, tied to the field it writes: `kind` is whatever that field's type can hold,
 * so marking `heightCm` as `single` does not compile.
 */
export type QuestionDef<Id extends QuestionId> = QuestionShape<Id, KindFor<Answers[Id]>>;

/**
 * A question with its id forgotten, which is what a list of mixed questions holds.
 *
 * It exists because the tie above cannot survive erasure: `KindFor<Answers[QuestionId]>`
 * resolves against the union of every answer type at once and collapses to `single | date`,
 * so a `QuestionDef` with a defaulted id would claim the list can never hold a `multi`. That
 * is not a wider type, it is a wrong one, and it makes `question.kind === 'consent'` a
 * compile error inside the very tests meant to check it.
 */
export type AnyQuestion = QuestionShape<QuestionId, QuestionKind>;

/**
 * The values survey-core assigns to its own "none" and "other" items, and therefore what
 * RxScale's validators compare against: their `Diseases` rule reads `{Diseases} = ['none']`
 * literally. Ours match so the mapper does not have to rename them.
 */
export const NONE_VALUE = 'none';
export const OTHER_VALUE = 'other';

/**
 * Checks one question against the field it writes, then hands it back erased so a list can
 * hold questions of different kinds. Without it, `questions.ts` would either lose the
 * per-question typing or need an annotation on all 27 entries.
 */
export function defineQuestion<Id extends QuestionId>(question: QuestionDef<Id>): AnyQuestion {
	return question;
}

export function optionsFor(question: AnyQuestion, answers: Answers): readonly ChoiceOption[] {
	if (!question.options) return [];

	return typeof question.options === 'function' ? question.options(answers) : question.options;
}

/** One row a choice question draws, with the none and other items in their place. */
export interface ChoiceItem {
	readonly value: string;
	readonly label: MessageFn;
	/** The two special rows behave differently: "none" is exclusive, "other" opens a text box. */
	readonly kind: 'option' | 'none' | 'other';
}

/**
 * The full list a choice question renders: its own options, then the none and other items it
 * declares. Kept out of the components because both of them need it and because the order is
 * a decision, not an implementation detail: "none of the above" reads last, after the things
 * it is above.
 */
export function choiceItems(
	question: AnyQuestion,
	options: readonly ChoiceOption[],
	labels: { none: MessageFn; other: MessageFn }
): readonly ChoiceItem[] {
	const items: ChoiceItem[] = options.map((option) => ({ ...option, kind: 'option' }));

	if (question.hasNone) items.push({ value: NONE_VALUE, label: labels.none, kind: 'none' });
	if (question.hasOther) items.push({ value: OTHER_VALUE, label: labels.other, kind: 'other' });

	return items;
}
