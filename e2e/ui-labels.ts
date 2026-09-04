/**
 * The words the app shows in its default language, which is German. The specs walk the site a
 * visitor actually gets, so they press the German control names; the fixture's own questions
 * are German too, which is why the funnel reads consistently.
 *
 * Collected here rather than repeated, so a copy change is one edit and so that a spec's
 * intent is not buried under a translated string.
 */
export const UI = {
	continue: 'Weiter',
	back: 'Zurück',
	home: 'Start',
	checkout: 'Zur Kasse',
	checkoutWith: 'Zur Kasse mit',
	tryAgain: 'Erneut versuchen',
	openCalendar: 'Kalender öffnen',
	checkEligibility: 'Eignung prüfen',
	chooseTreatment: 'Wähle deine Behandlung',
	modeTreatment: 'Behandlung',
	modePrescription: 'Nur Rezept',
	faqHeading: 'Häufige Fragen.',
	keyTakeaways: 'Das Wichtigste in Kürze',
	notRecommended: 'Diese Behandlung steht dir nicht zur Verfügung',
	refused: 'Deine Bestellung wurde nicht angenommen',
	unavailable: 'Wir konnten die Kasse nicht erreichen',
	noPlans: 'Eine Ärztin oder ein Arzt prüft deine Antworten',
	projectedWeight: 'Prognostiziertes Gewicht',
	projectionEyebrow: 'Deine Prognose',
	motivationHeadline: 'Hier beginnt die Veränderung.',
	/** Our own validation's wording, from feature 24c. The model's used to supply this. */
	/**
	 * A refusal names the field it means, because a screen can carry four of them. The
	 * unnamed wording still exists for a question that stands alone with no short name, and
	 * no spec asserts it: every screen these walk through has several fields.
	 */
	requiredField: (field: string) => `${field} wird benötigt.`,
	outOfRange: (field: string) => `${field} sieht nicht richtig aus.`,
	invalidDate: 'Bitte gib ein gültiges Datum an.',
	invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
	submissionRejected: 'Deine Antworten wurden nicht angenommen',
	submissionFailed: 'Wir konnten deine Antworten nicht senden',
	openMenu: 'Menü öffnen',
	closeMenu: 'Menü schließen',
	tableOfContents: 'Auf dieser Seite',
	mainNav: 'Hauptnavigation',
	/**
	 * The artboards' eyebrow, which from feature 24e is where the count is on screen. The
	 * progress bar is named by it rather than carrying its own label, so the specs read the
	 * element, not an attribute.
	 */
	progressPrefix: 'Frage ',
	progressEyebrow: '#questionnaire-progress-label',
	announcementRegion: 'Wegovy-Pillen-Angebot',
	teaserEyebrow: 'Neu im Wissensbereich',
	logoHome: 'Solean, Startseite',
	/** Feature 24e's screen system: the parts a spec can name. */
	aboutYouTitle: 'Erzähl uns von Dir',
	selectAll: 'Wähle alles Zutreffende aus',
	orRule: 'ODER',
	genderShort: 'Biologisches Geschlecht',
	dateOfBirthShort: 'Geburtsdatum',
	firstNameShort: 'Vorname',
	heightShort: 'Größe',
	weightShort: 'Gewicht',
	diseasesQuestion: 'Hast Du eine oder mehrere der folgenden Erkrankungen?',
	noneOfThese: 'Keine der Genannten',
	neverTaken: 'Nein, ich nehme keines dieser Medikamente ein',
	mounjaroDetails: 'Deine Angaben zu Mounjaro',
	reviewCta: 'Bewertung schreiben'
} as const;
