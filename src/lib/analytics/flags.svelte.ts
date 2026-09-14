import { browser } from '$app/environment';
import { fetchVariants, type FlagsContext } from './flags';

/**
 * Which variant this visitor is in, as the components see it.
 *
 * **Seeded empty on purpose.** The server renders no variant and neither does the first
 * client frame, so both produce the fallback, which is always the current UI. A variant that
 * arrived before the page was painted would still be the right answer; one that arrived after
 * would be a flicker on every load for every visitor, which is worse than having no
 * experiment at all.
 *
 * **The bucketing id lives here and is never stored.** Persisting an identifier on somebody's
 * device before they have answered the banner is precisely what the banner is for, and a
 * variant assignment is not strictly necessary. Holding it in memory also matches how this
 * app already defines a session: the answers live in one module and a reload starts the
 * questionnaire over, so a reload being a fresh assignment is the existing rule rather than a
 * new compromise. Client-side navigation keeps it, which covers the whole funnel.
 */
class Experiments {
	#variants = $state(new Map<string, string>());
	#started = false;

	/**
	 * Fetch the assignment, once per session and regardless of consent. This is the one thing
	 * this project asks Mixpanel before the banner is answered: it sends no event, records
	 * nothing, and loads none of the vendor's code.
	 */
	start(): void {
		if (this.#started || !browser) return;
		this.#started = true;

		void fetchVariants(sessionContext()).then((variants) => {
			this.#variants = variants;
		});
	}

	/**
	 * The variant the panel assigned, or null when it assigned none.
	 *
	 * Null and `control` are different answers and the caller has to treat them so. `control` is
	 * a real arm of a running experiment and its exposure must be reported, or the panel sees a
	 * one-armed test. Null means no experiment exists: the page renders what it always did and
	 * **nothing is reported**, so a deployment with no experiment running sends no
	 * `$experiment_started` at all rather than a stream of them about nothing.
	 */
	assignment(experiment: string): string | null {
		return this.#variants.get(experiment) ?? null;
	}
}

/**
 * Two ids the panel buckets on, generated here and belonging to nothing else. They are the
 * same value: this app has no device identity apart from the session, and inventing a second
 * one would mean storing it.
 */
function sessionContext(): FlagsContext {
	const id = crypto.randomUUID();

	return { distinct_id: id, device_id: id };
}

export const experiments = new Experiments();
