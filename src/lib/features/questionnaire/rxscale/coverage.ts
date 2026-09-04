import type { QuestionId } from '../answers/types';
import { QUESTIONS } from '../definition/questions';
import { DROPPED, RULES } from './mapping';
import { modelInventory } from './snapshot';

/**
 * The two directional guards over the mapping.
 *
 * The mapping is the seam between two question sets that are maintained separately, and the
 * ways it can rot are not symmetrical, so each direction has its own guard:
 *
 * - a question of theirs nothing writes means an incomplete submission, which RxScale answers
 *   with a 400 the visitor sees;
 * - a question of ours nothing reads means we ask someone about their health and throw the
 *   answer away, which nothing anywhere would report.
 *
 * Both return what is missing rather than a boolean, so the test that fails names the gap
 * instead of only asserting that one exists.
 */

/** Every model question name some rule writes, including the `-Comment` siblings. */
function writtenNames(): ReadonlySet<string> {
	return new Set(RULES.flatMap((rule) => [...rule.writes]));
}

/**
 * Their questions that no rule writes.
 *
 * `EMail` is included in the check even though their model leaves it optional: 24a decided to
 * require it, and an optional question is still one we mean to send.
 */
export function unmappedModelQuestions(): readonly string[] {
	const written = writtenNames();

	return modelInventory()
		.map((question) => question.name)
		.filter((name) => !written.has(name));
}

/**
 * Model questions a rule claims to write that their model does not have.
 *
 * The opposite failure to the one above, and the one a drifting snapshot produces: a rule
 * keyed to a question RxScale has since renamed writes into the payload forever and is
 * ignored forever, with no error on either side. `-Comment` keys are theirs by convention
 * rather than by declaration, so they resolve against the question they belong to.
 */
export function phantomModelQuestions(): readonly string[] {
	const known = new Set(modelInventory().map((question) => question.name));

	return [...writtenNames()].filter((name) => {
		if (known.has(name)) return false;

		const owner = name.endsWith('-Comment') ? name.slice(0, -'-Comment'.length) : null;

		return owner === null || !known.has(owner);
	});
}

/** Our questions that no rule reads and `DROPPED` does not explain. */
export function unwrittenOurQuestions(): readonly QuestionId[] {
	const read = new Set(RULES.flatMap((rule) => [...rule.reads]));

	return QUESTIONS.map((question) => question.id).filter(
		(id) => !read.has(id) && DROPPED[id] === undefined
	);
}

/**
 * The free-text siblings are fields rather than questions, so they are not in `QUESTIONS` and
 * the guard above cannot see them. A `hasOther` question whose comment nothing carries loses
 * exactly the answer a visitor typed because none of the offered options fitted.
 */
export function unwrittenOtherFields(): readonly QuestionId[] {
	const written = writtenNames();
	const missing: QuestionId[] = [];

	for (const question of QUESTIONS) {
		if (!question.hasOther || !question.otherField) continue;

		const rule = RULES.find((candidate) => candidate.reads.includes(question.id));
		const carriesComment =
			rule !== undefined &&
			rule.writes.some((name) => name.endsWith('-Comment') && written.has(name));

		if (!carriesComment) missing.push(question.otherField);
	}

	return missing;
}

/** Everything the guards can say, for the one place that wants it all at once. */
export function coverageReport() {
	return {
		unmappedModelQuestions: unmappedModelQuestions(),
		phantomModelQuestions: phantomModelQuestions(),
		unwrittenOurQuestions: unwrittenOurQuestions(),
		unwrittenOtherFields: unwrittenOtherFields()
	};
}
