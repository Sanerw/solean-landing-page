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
	required: 'Diese Angabe wird benötigt.',
	outOfRange: 'Bitte überprüfe Deine Angaben.',
	invalidDate: 'Bitte gib ein gültiges Datum an.',
	invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
	submissionRejected: 'Deine Antworten wurden nicht angenommen',
	submissionFailed: 'Wir konnten deine Antworten nicht senden',
	openMenu: 'Menü öffnen',
	closeMenu: 'Menü schließen',
	tableOfContents: 'Auf dieser Seite',
	mainNav: 'Hauptnavigation',
	/** The progress bar names the position; the specs read the numbers back out of it. */
	progressPrefix: 'Frage ',
	announcementRegion: 'Wegovy-Pillen-Angebot',
	teaserEyebrow: 'Neu im Wissensbereich',
	logoHome: 'Solean, Startseite',
	reviewCta: 'Bewertung schreiben'
} as const;
