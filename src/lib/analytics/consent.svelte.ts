import { browser } from '$app/environment';
import { setAnalyticsConsent } from './client';
import { serializeConsent, type ConsentDecision, type ConsentState } from './consent';

/**
 * The visitor's decision, as the banner and the client both see it. Seeded from the server,
 * which read the cookie, so the banner never appears to someone who already answered.
 */
class AnalyticsConsent {
	#state = $state<ConsentState>(null);

	/** True only while nobody has decided, which is exactly when the banner is owed. */
	get undecided(): boolean {
		return this.#state === null;
	}

	get state(): ConsentState {
		return this.#state;
	}

	/** Seeded once per load from the layout, before anything can be tracked. */
	hydrate(state: ConsentState): void {
		this.#state = state;
		setAnalyticsConsent(state);
	}

	decide(decision: ConsentDecision): void {
		this.#state = decision;
		setAnalyticsConsent(decision);

		if (browser) document.cookie = serializeConsent(decision);
	}
}

export const analyticsConsent = new AnalyticsConsent();
