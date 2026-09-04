import { describe, expect, it } from 'vitest';
import { DROPPED } from './mapping';
import {
	phantomModelQuestions,
	unmappedModelQuestions,
	unwrittenOtherFields,
	unwrittenOurQuestions
} from './coverage';

describe('their side: every question of theirs is written', () => {
	it('leaves no model question unmapped', () => {
		// A gap here is a required answer RxScale never receives, which they answer with a 400
		// the visitor meets after filling in the whole questionnaire.
		expect(unmappedModelQuestions()).toEqual([]);
	});

	it('writes nothing under a name their model does not have', () => {
		// The failure a drifting snapshot produces: a rule keyed to a renamed question writes
		// into the payload forever and is ignored forever, silently on both sides.
		expect(phantomModelQuestions()).toEqual([]);
	});
});

describe('our side: every question of ours is read', () => {
	it('reads or explicitly drops each of our questions', () => {
		// A gap here is worse than a 400 and quieter: we ask a person about their health and
		// throw the answer away, and nothing anywhere reports it.
		expect(unwrittenOurQuestions()).toEqual([]);
	});

	it('carries the free text of every question that offers "other"', () => {
		expect(unwrittenOtherFields()).toEqual([]);
	});

	it('drops only the phone, and says why', () => {
		expect(Object.keys(DROPPED)).toEqual(['phone']);
		expect(DROPPED.phone).toBeTruthy();
	});
});
