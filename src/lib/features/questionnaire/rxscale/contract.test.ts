import { describe, expect, it } from 'vitest';
import type { QuestionnaireDocument } from '../anamnesis-client';
import { compareModel, describeDrift } from './contract';
import { MODEL_SNAPSHOT } from './snapshot';

/** A deep copy, so a test that edits the live document cannot alter the snapshot. */
function liveCopy(): QuestionnaireDocument {
	return structuredClone(MODEL_SNAPSHOT);
}

/** The element for one question name, wherever it sits. */
function element(document: QuestionnaireDocument, name: string): Record<string, unknown> {
	for (const page of document.model.pages as Record<string, unknown>[]) {
		for (const candidate of (page.elements ?? []) as Record<string, unknown>[]) {
			if (candidate.name === name) return candidate;
		}
	}

	throw new Error(`No element named "${name}"`);
}

describe('no drift', () => {
	it('reports nothing when the documents match', () => {
		const comparison = compareModel(MODEL_SNAPSHOT, liveCopy());

		expect(comparison.hasDrift).toBe(false);
		expect(describeDrift(comparison)).toEqual([]);
	});
});

describe('structural changes are drift', () => {
	it('reports a renamed question as one removed and one added', () => {
		const live = liveCopy();
		element(live, 'Gender').name = 'BiologicalSex';

		const comparison = compareModel(MODEL_SNAPSHOT, live);

		expect(comparison.removed).toContain('Gender');
		expect(comparison.added).toContain('BiologicalSex');
		expect(comparison.hasDrift).toBe(true);
	});

	it('reports a new required question', () => {
		const live = liveCopy();
		(live.model.pages[0] as { elements: unknown[] }).elements.push({
			type: 'radiogroup',
			name: 'SmokingStatus',
			isRequired: true,
			choices: ['yes', 'no']
		});

		expect(compareModel(MODEL_SNAPSHOT, live).added).toContain('SmokingStatus');
	});

	it('reports a question that stopped being optional', () => {
		const live = liveCopy();
		element(live, 'EMail').isRequired = true;

		const [changed] = compareModel(MODEL_SNAPSHOT, live).changed;

		expect(changed.name).toBe('EMail');
		expect(changed.changes[0].field).toBe('isRequired');
	});

	it('reports a changed visibleIf, which is a branch moving under us', () => {
		const live = liveCopy();
		element(live, 'isPregnantorBreastfeeding').visibleIf = "{Gender} != 'male'";

		const [changed] = compareModel(MODEL_SNAPSHOT, live).changed;

		expect(changed.name).toBe('isPregnantorBreastfeeding');
		expect(changed.changes[0].field).toBe('visibleIf');
	});

	it('reports a removed choice value, which would orphan an answer we still offer', () => {
		const live = liveCopy();
		const diseases = element(live, 'Diseases');
		diseases.choices = (diseases.choices as unknown[]).slice(1);

		const [changed] = compareModel(MODEL_SNAPSHOT, live).changed;

		expect(changed.name).toBe('Diseases');
		expect(changed.changes[0].field).toBe('choiceValues');
	});

	it('reports a changed validator, which is their clinical rule moving', () => {
		const live = liveCopy();
		element(live, 'dob').validators = [
			{ type: 'expression', expression: 'age({dob}) < 75 && age({dob}) >= 18', text: 'x' }
		];

		const [changed] = compareModel(MODEL_SNAPSHOT, live).changed;

		expect(changed.name).toBe('dob');
		expect(changed.changes[0].field).toBe('validators');
	});

	it('reports a changed multipletext item, which changes the shape of an answer', () => {
		const live = liveCopy();
		const weightSize = element(live, 'WeightSize');
		weightSize.items = [{ name: 'height' }, { name: 'weight' }];

		const [changed] = compareModel(MODEL_SNAPSHOT, live).changed;

		expect(changed.changes.some((change) => change.field === 'items')).toBe(true);
	});

	it('reports a changed identifier and version, the cheapest first signal', () => {
		const live = liveCopy();
		live.identifier = 'LIVE: MedQ NEW RECOMMENDER (02/26)';
		live.version = '2';

		const comparison = compareModel(MODEL_SNAPSHOT, live);

		expect(comparison.identifierChanged).toEqual({
			snapshot: MODEL_SNAPSHOT.identifier,
			live: 'LIVE: MedQ NEW RECOMMENDER (02/26)'
		});
		expect(comparison.versionChanged?.live).toBe('2');
		expect(comparison.hasDrift).toBe(true);
	});
});

describe('cosmetic changes are not drift', () => {
	it('ignores a reworded title, because the wording is ours from 24a', () => {
		const live = liveCopy();
		element(live, 'Gender').title = 'Welches Geschlecht wurde Dir bei der Geburt zugewiesen?';

		expect(compareModel(MODEL_SNAPSHOT, live).hasDrift).toBe(false);
	});

	it('ignores a reworded description and a changed choice label', () => {
		const live = liveCopy();
		element(live, 'EatingDisorder').description = 'Neuer Hinweistext.';
		const gender = element(live, 'Gender');
		gender.choices = [
			{ value: 'female', text: 'Frau' },
			{ value: 'male', text: 'Mann' }
		];

		expect(compareModel(MODEL_SNAPSHOT, live).hasDrift).toBe(false);
	});

	it('ignores a changed refusal text, which the shadow reads live from the snapshot', () => {
		const live = liveCopy();
		element(live, 'dob').validators = [
			{ type: 'expression', expression: 'age({dob}) < 80 && age({dob}) >= 18', text: 'Neu.' }
		];

		expect(compareModel(MODEL_SNAPSHOT, live).hasDrift).toBe(false);
	});
});

describe('describeDrift', () => {
	it('names the question, the field, and both values', () => {
		const live = liveCopy();
		element(live, 'EMail').isRequired = true;

		const lines = describeDrift(compareModel(MODEL_SNAPSHOT, live));

		expect(lines.join('\n')).toContain('changed: EMail.isRequired');
		expect(lines.join('\n')).toContain('was:  false');
		expect(lines.join('\n')).toContain('now:  true');
	});
});
