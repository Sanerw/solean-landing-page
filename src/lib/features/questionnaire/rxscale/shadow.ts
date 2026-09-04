import { ElementFactory, Model, Question, Serializer } from 'survey-core';
import type { Answers, QuestionId } from '../answers/types';
import { ourQuestionFor, toAnamnesisData } from './mapping';
import { SNAPSHOT_MODEL } from './snapshot';

/**
 * RxScale's own rules, run here.
 *
 * The questions are ours from feature 24, but the clinical judgement stays theirs: the BMI
 * floor, the age window and every contraindication are expressions in their model, with their
 * own refusal texts. Rather than reimplement any of that, this builds a `survey-core` model
 * from the committed snapshot, feeds it the mapped payload, and reads back what their rules
 * say. Reimplementing them would move a medical decision into this repository, which
 * `project-overview.md` rules out.
 *
 * This survey is never rendered. It exists to be asked questions about data.
 */

/**
 * RxScale's model uses their own `os-date-picker` widget, which stock survey-core does not
 * know. An unregistered type is not merely unrendered: the engine drops the element while
 * parsing, and `dob` is the only element on its page, so the page would leave the shadow
 * entirely and its age validator with it.
 *
 * Registered as their own storefront snippet does, a plain question with no extra
 * properties. Nothing draws it: this survey exists to be asked questions about data.
 */
const OS_DATE_PICKER = 'os-date-picker';

class OsDatePickerQuestion extends Question {
	getType(): string {
		return OS_DATE_PICKER;
	}
}

if (!Serializer.findClass(OS_DATE_PICKER)) {
	ElementFactory.Instance.registerElement(OS_DATE_PICKER, (name) => new OsDatePickerQuestion(name));
	Serializer.addClass(
		OS_DATE_PICKER,
		[],
		() => new OsDatePickerQuestion('OS Date Picker'),
		'question'
	);
}

/**
 * A fresh instance per call.
 *
 * `survey-core` models are stateful: setting data attaches validation errors to questions,
 * and a reused instance would answer the next caller with the last caller's errors. This runs
 * per screen in 24c, so the cost is one parse of a 37 KB document against the alternative of
 * a wrong answer, and the wrong answer is not worth any saving.
 */
function shadowFor(answers: Answers): Model {
	const survey = new Model(SNAPSHOT_MODEL);
	survey.showNavigationButtons = false;

	// Their `visibleIf` expressions read the data, so this is what makes their branching agree
	// with ours: the payload is the only thing the shadow ever sees.
	survey.data = toAnamnesisData(answers);

	return survey;
}

/** Their questions that are visible for these answers and take an answer. */
function askedByThem(survey: Model): Question[] {
	return survey.getAllQuestions().filter((question) => question.isVisible);
}

/**
 * What RxScale would refuse, keyed by the question of ours that shows it.
 *
 * Their sentence, not a code, and deliberately the opposite of 24a's validation. Our codes
 * exist so the wording can be ours in two languages; their refusal is a clinical statement
 * ("Leider können wir Dir kein Medikament verschreiben") that we are not going to paraphrase.
 *
 * Their texts are German only, which after 24a means an English visitor meets an English
 * question and a German refusal. That is a real gap and it is 24c's to decide, not this
 * module's to paper over with a translation nobody has approved.
 */
export function theirErrors(answers: Answers): Partial<Record<QuestionId, string>> {
	const survey = shadowFor(answers);
	const errors: Partial<Record<QuestionId, string>> = {};

	// `validate(true, false)` attaches the errors and does not try to scroll to them. Attaching
	// is fine here precisely because nobody is looking at this instance; 24a's on-screen survey
	// suppresses attachment for the opposite reason.
	survey.validate(true, false);

	for (const question of askedByThem(survey)) {
		const [first] = question.errors;
		if (!first) continue;

		// A refusal about a question nobody asked cannot be shown, so it is skipped rather than
		// dropped somewhere a screen would never look.
		const owner = ourQuestionFor(question.name);
		if (!owner || errors[owner]) continue;

		errors[owner] = first.getText();
	}

	return errors;
}

/**
 * Their questions that are visible, required, and have no answer in the payload.
 *
 * This is the pre-submission guard, and the only thing that watches the seam between their
 * branching and ours. The two are maintained separately: a question their `visibleIf` opens
 * and our `conditions.ts` does not is a required answer we never collect, and RxScale reports
 * it as a 400 after the visitor has filled in the whole questionnaire.
 */
export function missingRequired(answers: Answers): readonly string[] {
	const survey = shadowFor(answers);

	return askedByThem(survey)
		.filter((question) => question.isRequired && question.isEmpty())
		.map((question) => question.name);
}

/** Whether RxScale's rules would let this submission through. */
export function wouldBeAccepted(answers: Answers): boolean {
	return Object.keys(theirErrors(answers)).length === 0 && missingRequired(answers).length === 0;
}
