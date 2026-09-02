import { describe, expect, it } from 'vitest';
import { clampReplayPercent, shouldRecordSession } from './config';

describe('clampReplayPercent', () => {
	it('records every session when nothing is configured', () => {
		for (const value of [undefined, '', '   ']) {
			expect(clampReplayPercent(value)).toBe(100);
		}
	});

	it('takes a configured share', () => {
		expect(clampReplayPercent('25')).toBe(25);
		expect(clampReplayPercent(' 10 ')).toBe(10);
		expect(clampReplayPercent('0')).toBe(0);
	});

	it('clamps a value outside the range rather than passing it to the SDK', () => {
		expect(clampReplayPercent('150')).toBe(100);
		expect(clampReplayPercent('-5')).toBe(0);
	});

	it('falls back rather than handing the SDK a NaN', () => {
		// `record_sessions_percent: NaN` compares false against every threshold, which would
		// disable recording silently instead of reporting a bad setting.
		for (const value of ['abc', '10%', 'true']) {
			expect(clampReplayPercent(value)).toBe(100);
		}
	});

	it('zero is a real answer and must not read as unset', () => {
		expect(clampReplayPercent('0')).not.toBe(100);
	});
});

describe('shouldRecordSession', () => {
	it('records nothing at zero, whatever the roll', () => {
		// The off switch. `start_session_recording` forces a recording and ignores the
		// configured share, so this is the only thing standing between 0 and recording.
		for (const roll of [0, 0.5, 0.99]) {
			expect(shouldRecordSession(0, roll)).toBe(false);
		}
	});

	it('records everything at a hundred', () => {
		for (const roll of [0, 0.5, 0.999]) {
			expect(shouldRecordSession(100, roll)).toBe(true);
		}
	});

	it('splits at the configured share', () => {
		expect(shouldRecordSession(25, 0.1)).toBe(true);
		expect(shouldRecordSession(25, 0.25)).toBe(true);
		expect(shouldRecordSession(25, 0.26)).toBe(false);
		expect(shouldRecordSession(25, 0.9)).toBe(false);
	});
});
