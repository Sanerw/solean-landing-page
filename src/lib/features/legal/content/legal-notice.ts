import type { LegalDocument } from '../types';

/**
 * Copied verbatim from https://solean.com/policies/legal-notice on 2026-09-01.
 * Not ours to edit: no rewording, no reformatting, no corrections. Re-import from the
 * source if it changes there.
 */
export const LEGAL_NOTICE: LegalDocument = {
	title: "Impressum",
	source: "https://solean.com/policies/legal-notice",
	copied: "2026-09-01",
	blocks: [
		{
			kind: "paragraph",
			lines: [
				[{ text: "SoLean ist ein Angebot der:" }],
				[{ text: "DTC Healthtech Solution Limited", bold: true }],
			]
		},
		{
			kind: "paragraph",
			lines: [
				[{ text: "Lippmannstraße 8" }],
				[{ text: "22769 Hamburg" }],
				[{ text: "Deutschland" }],
				[{ text: "Telefon: +49 40 87709420" }],
				[{ text: "Kundenservice: support@solean.com" }],
				[{ text: "Corporate Registration:" }],
				[{ text: "1st Floor, Behan House," }],
				[{ text: "10 Mount Street Lower," }],
				[{ text: "D02 HT71, Dublin," }],
				[{ text: "Ireland" }],
				[{ text: "Vertreten durch Geschäftsführer:" }],
				[{ text: "Jan Mehner" }],
				[{ text: "USt-IdNr.: DE342812966" }],
			]
		},
		{
			kind: "paragraph",
			lines: [
				[{ text: "Handelsregisternummer: 681172" }],
				[{ text: "Companies Registration Office Ireland, Dublin" }],
				[{ text: "Außergerichtliche Streitbeilegung: Die Europäische Kommission stellt eine Plattform für die außergerichtliche Online-Streitbeilegung (OS-Plattform) bereit, die unter " }, { text: "www.ec.europa.eu/consumers/odr", href: "http://www.ec.europa.eu/consumers/odr" }, { text: " aufrufbar ist. Wir sind weder verpflichtet noch bereit, an dem Streitschlichtungsverfahren teilzunehmen." }],
			]
		},
		{ kind: "paragraph", lines: [[{ text: "Versandapotheke*" }]] },
		{
			kind: "paragraph",
			lines: [
				[{ text: "Apotheke Bad Nieuweschans" }],
				[{ text: "Verlengde Hoofdstraat 1D," }],
				[{ text: "9693 AB Bad Nieuweschans," }],
				[{ text: "Niederlande" }],
				[{ text: "Stand: 01.03.2024" }],
				[{ text: "*Für die Abgabe von Arzneimitteln zuständige Versandapotheke, sofern eine Zustellung nach Hause gewünscht wird." }],
			]
		},
		{ kind: "paragraph", lines: [[{ text: "Weitere Informationen über das Unternehmen und die Dienstleistungen sind auf der Unternehmens-Website zu finden: " }, { text: "ht-ventures.com", href: "http://ht-ventures.com/" }, { text: ". Diese Seite bietet einen umfassenden Einblick in die Mission und das Engagement für Qualität und Service." }]] },
	]
};
