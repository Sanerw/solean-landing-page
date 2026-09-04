import type { QuestionnaireDocument } from '../anamnesis-client';
import { modelInventory, type ModelQuestion } from './snapshot';

/**
 * What changed between the committed snapshot and RxScale's live document.
 *
 * The snapshot is the contract, so an edit they make in their Admin Tool is invisible here
 * until this runs. That is the trade feature 24 accepted: their change stops being an
 * immediate change to the funnel and becomes a failing command instead.
 *
 * Structure only. Titles and descriptions are display, and display is ours from 24a, so a
 * reworded question of theirs is not drift; a renamed one, a new required one, a changed
 * `visibleIf`, a dropped choice value or an altered validator all are.
 */

export interface ChangedField {
	readonly field: 'type' | 'isRequired' | 'visibleIf' | 'choiceValues' | 'validators' | 'items';
	readonly snapshot: string;
	readonly live: string;
}

export interface ChangedQuestion {
	readonly name: string;
	readonly changes: readonly ChangedField[];
}

export interface ModelComparison {
	/** Their identity, which is the cheapest first signal that anything moved at all. */
	readonly identifierChanged: { snapshot: string; live: string } | null;
	readonly versionChanged: { snapshot: string; live: string } | null;
	readonly added: readonly string[];
	readonly removed: readonly string[];
	readonly changed: readonly ChangedQuestion[];
	readonly hasDrift: boolean;
}

function compareQuestion(snapshot: ModelQuestion, live: ModelQuestion): readonly ChangedField[] {
	const changes: ChangedField[] = [];

	const field = (
		field: ChangedField['field'],
		before: string | boolean | readonly string[] | null,
		after: string | boolean | readonly string[] | null
	) => {
		const a = JSON.stringify(before ?? null);
		const b = JSON.stringify(after ?? null);
		if (a !== b) changes.push({ field, snapshot: a, live: b });
	};

	field('type', snapshot.type, live.type);
	field('isRequired', snapshot.isRequired, live.isRequired);
	field('visibleIf', snapshot.visibleIf, live.visibleIf);
	// Order matters: a reordered choice list changes what a radio group's first option is, and
	// is cheap to review, so it is reported rather than sorted away.
	field('choiceValues', snapshot.choiceValues, live.choiceValues);
	field('items', snapshot.itemNames, live.itemNames);
	field('validators', snapshot.validatorExpressions, live.validatorExpressions);

	return changes;
}

export function compareModel(
	snapshot: QuestionnaireDocument,
	live: QuestionnaireDocument
): ModelComparison {
	const ours = new Map(modelInventory(snapshot.model).map((q) => [q.name, q]));
	const theirs = new Map(modelInventory(live.model).map((q) => [q.name, q]));

	const added = [...theirs.keys()].filter((name) => !ours.has(name));
	const removed = [...ours.keys()].filter((name) => !theirs.has(name));

	const changed: ChangedQuestion[] = [];
	for (const [name, question] of ours) {
		const counterpart = theirs.get(name);
		if (!counterpart) continue;

		const changes = compareQuestion(question, counterpart);
		if (changes.length > 0) changed.push({ name, changes });
	}

	const identifierChanged =
		snapshot.identifier === live.identifier
			? null
			: { snapshot: snapshot.identifier, live: live.identifier };
	const versionChanged =
		snapshot.version === live.version ? null : { snapshot: snapshot.version, live: live.version };

	return {
		identifierChanged,
		versionChanged,
		added,
		removed,
		changed,
		hasDrift:
			identifierChanged !== null ||
			versionChanged !== null ||
			added.length > 0 ||
			removed.length > 0 ||
			changed.length > 0
	};
}

/** What moved, as a person reads it. Empty when nothing did. */
export function describeDrift(comparison: ModelComparison): readonly string[] {
	const lines: string[] = [];

	if (comparison.identifierChanged) {
		lines.push(
			`identifier: "${comparison.identifierChanged.snapshot}" -> "${comparison.identifierChanged.live}"`
		);
	}
	if (comparison.versionChanged) {
		lines.push(
			`version: ${comparison.versionChanged.snapshot} -> ${comparison.versionChanged.live}`
		);
	}
	for (const name of comparison.added) lines.push(`added: ${name}`);
	for (const name of comparison.removed) lines.push(`removed: ${name}`);
	for (const question of comparison.changed) {
		for (const change of question.changes) {
			lines.push(`changed: ${question.name}.${change.field}`);
			lines.push(`    was:  ${change.snapshot}`);
			lines.push(`    now:  ${change.live}`);
		}
	}

	return lines;
}
