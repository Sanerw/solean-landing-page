import { m } from '$lib/paraglide/messages';

/**
 * Copy for the two mid-questionnaire screens. Illustrative prototype content only.
 *
 * Functions rather than constants: the messages resolve against the active locale at call
 * time, and a module-level object would freeze whichever locale was current at import.
 */

export function projectionInterstitial() {
	return {
		eyebrow: m.proj_eyebrow(),
		headline: m.proj_headline(),
		tabsLabel: m.proj_tabs_label(),
		seriesLabel: m.proj_series_label(),
		comparisonLabel: m.proj_comparison_label(),
		chartTitle: m.proj_chart_title(),
		tableCaption: m.proj_table_caption(),
		footnote: m.proj_footnote(),
		loading: m.proj_loading(),
		callouts: {
			3: { title: m.proj_callout_3_title(), body: m.proj_callout_3_body() },
			6: { title: m.proj_callout_6_title(), body: m.proj_callout_6_body() },
			12: { title: m.proj_callout_12_title(), body: m.proj_callout_12_body() }
		},
		missingWeight: {
			title: m.proj_missing_title(),
			body: m.proj_missing_body(),
			action: m.proj_missing_action()
		}
	};
}

export function motivationInterstitial() {
	return {
		eyebrow: m.motivation_eyebrow(),
		headline: m.motivation_headline(),
		body: [m.motivation_body_1(), m.motivation_body_2()],
		storyLabel: m.motivation_story_label(),
		// Figures and trial citations are data, not prose: they read the same in both languages.
		stats: [
			{
				figure: '-15%',
				label: m.motivation_stat_1_label(),
				source: 'Semaglutide, STEP 1 trial, NEJM 2021'
			},
			{
				figure: '-21%',
				label: m.motivation_stat_2_label(),
				source: 'Tirzepatide, SURMOUNT-1 trial, NEJM 2022'
			}
		],
		footnote: m.motivation_footnote()
	};
}
