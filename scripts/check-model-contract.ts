/**
 * Asks RxScale whether their questionnaire still matches the snapshot this repository builds
 * against, and reports what moved.
 *
 * Deliberately its own command and not part of `pnpm test`: their availability is not this
 * project's build status, and an outage of theirs must not redden a build for a change that
 * has nothing to do with them. Open question 13 in `project-overview.md` records that the
 * schedule for running it is still undecided.
 *
 * When it fires, the fix is a fresh snapshot plus whatever the change implies for the mapping,
 * and that is a deploy. It is a report a person reads, not an assertion.
 */
import { buildQuestionnaireUrl, configured } from '../src/lib/config/rxscale-urls';
import { compareModel, describeDrift } from '../src/lib/features/questionnaire/rxscale/contract';
import { MODEL_SNAPSHOT } from '../src/lib/features/questionnaire/rxscale/snapshot';
import type { QuestionnaireDocument } from '../src/lib/features/questionnaire/anamnesis-client';

/**
 * Read straight from the process rather than through `$lib/config/rxscale`, which imports
 * `$env/dynamic/public` and therefore only resolves inside SvelteKit's build. The URL itself
 * still comes from the shared builder, so this script and the app cannot drift apart about
 * which document they mean.
 *
 * `pnpm check:model` loads `.env` through Node's own `--env-file`, so a developer's local
 * configuration applies here exactly as it does to `pnpm dev`.
 */

/**
 * Two failures that must never look alike: their questionnaire moved, and we could not ask.
 * One is a deploy, the other is a network blip, and sharing an exit code would make a flaky
 * connection read as "RxScale changed the questionnaire".
 */
const EXIT_DRIFT = 1;
const EXIT_UNREACHABLE = 2;

async function main(): Promise<number> {
	const uid = configured(process.env.PUBLIC_RXSCALE_QUESTIONNAIRE_UID);
	if (!uid) {
		console.error('PUBLIC_RXSCALE_QUESTIONNAIRE_UID is not set, so there is nothing to compare.');

		return EXIT_UNREACHABLE;
	}

	const url = buildQuestionnaireUrl(
		uid,
		process.env.PUBLIC_RXSCALE_API_BASE_URL,
		process.env.PUBLIC_RXSCALE_ANAMNESIS_BASE_PATH
	);
	console.log(`Comparing the snapshot against ${url}\n`);

	let response: Response;
	try {
		response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
	} catch (error) {
		console.error(`Could not reach RxScale: ${error instanceof Error ? error.message : error}`);

		return EXIT_UNREACHABLE;
	}

	if (!response.ok) {
		console.error(`RxScale answered ${response.status}. Nothing was compared.`);

		return EXIT_UNREACHABLE;
	}

	let live: QuestionnaireDocument;
	try {
		live = (await response.json()) as QuestionnaireDocument;
	} catch {
		console.error('RxScale answered something that is not JSON. Nothing was compared.');

		return EXIT_UNREACHABLE;
	}

	if (!live?.model?.pages?.length) {
		console.error('RxScale answered a document with no pages. Nothing was compared.');

		return EXIT_UNREACHABLE;
	}

	const comparison = compareModel(MODEL_SNAPSHOT, live);

	if (!comparison.hasDrift) {
		console.log(`No drift. "${MODEL_SNAPSHOT.identifier}" version ${MODEL_SNAPSHOT.version}.`);

		return 0;
	}

	console.error('The live questionnaire has moved away from the snapshot:\n');
	for (const line of describeDrift(comparison)) console.error(`  ${line}`);
	console.error(
		'\nRe-take the snapshot, then check the mapping and the coverage guards still hold.'
	);

	return EXIT_DRIFT;
}

process.exit(await main());
