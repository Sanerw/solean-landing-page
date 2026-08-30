/** Copy for the two mid-questionnaire screens. Illustrative prototype content only. */

export const PROJECTION_INTERSTITIAL = {
	eyebrow: 'Your projection',
	headline: 'You could reach',
	tabsLabel: 'Projection horizon',
	seriesLabel: 'With Solean',
	comparisonLabel: 'Lifestyle alone',
	chartTitle: 'Your projected weight with Solean',
	tableCaption: 'Modelled weight at each milestone',
	footnote:
		'Based on outcomes data from patients using GLP-1 treatments with ongoing clinical support. Illustrative only; individual results vary.',
	callouts: {
		3: {
			title: 'At 3 months',
			body: 'Early changes show up first in appetite and habits, before the scale catches up.'
		},
		6: {
			title: 'At 6 months',
			body: 'Enough time to lose weight steadily, build healthier habits, and see meaningful, lasting change.'
		},
		12: {
			title: 'At 12 months',
			body: 'A full year of clinical support, where the change you have made has time to settle into how you live.'
		}
	},
	missingWeight: {
		title: 'We need your weight to show this',
		body: 'Your projection is built from the weight you enter at the first question. Go back and add it to see it here.',
		action: 'Back to question 1'
	}
} as const;

export const MOTIVATION_INTERSTITIAL = {
	eyebrow: "You're almost there",
	headline: 'Halfway done. This is where life starts to change.',
	body: [
		'Medical weight loss changes more than the number on the scale.',
		'It shapes how you feel, how you move and how you show up around others.'
	],
	storyLabel: 'Member story',
	stats: [
		{
			figure: '-15%',
			label: 'average body weight lost over 68 weeks',
			source: 'Semaglutide, STEP 1 trial, NEJM 2021'
		},
		{
			figure: '-21%',
			label: 'average body weight lost over 72 weeks',
			source: 'Tirzepatide, SURMOUNT-1 trial, NEJM 2022'
		}
	],
	footnote:
		'Individual results vary. Sources: Wilding et al., NEJM 2021; Jastreboff et al., NEJM 2022.'
} as const;
