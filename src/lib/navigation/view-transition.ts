/** The route group the whole funnel lives in. Ids carry the group, so this is the whole test. */
const QUESTIONNAIRE_GROUP = '/(questionnaire)';

/**
 * Whether a navigation crosses from the rest of the site into the funnel.
 *
 * The one hard cut worth softening: a photographic marketing page is replaced by a bare white
 * shell that then shows a spinner. Movement inside the funnel is deliberately excluded, because
 * the step itself already animates and two entrances on one navigation read as a stutter.
 */
export function entersQuestionnaire(
	fromRouteId: string | null | undefined,
	toRouteId: string | null | undefined
): boolean {
	// No `from` is the first load of the session, which paints once and has nothing to cross from.
	if (!fromRouteId || !toRouteId) return false;
	if (!toRouteId.startsWith(QUESTIONNAIRE_GROUP)) return false;

	return !fromRouteId.startsWith(QUESTIONNAIRE_GROUP);
}
