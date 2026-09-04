import { m } from '$lib/paraglide/messages';
import { GALLSTONES, MEDICATIONS_WITH_DOSE, type PastMedication, type QuestionId } from '../answers/types';
import { defineQuestion, type AnyQuestion, type ChoiceOption } from './kinds';
import {
	reportsSideEffects,
	takesOtherMedication,
	takesTrackedMedication
} from './conditions';

/**
 * RxScale spells yes and no two ways, capitalised on most questions and lowercase on a few,
 * and their validators compare the value literally. Keeping both pairs means the mapper stays
 * an identity here rather than having to remember which question wants which casing.
 *
 * The wording is shared because theirs is: every one of these reads "Ja" and "Nein".
 */
const YES_NO_CAPITALISED: readonly ChoiceOption[] = [
	{ value: 'Yes', label: m.qn_opt_yes },
	{ value: 'No', label: m.qn_opt_no }
];

const YES_NO_LOWERCASE: readonly ChoiceOption[] = [
	{ value: 'yes', label: m.qn_opt_yes },
	{ value: 'no', label: m.qn_opt_no }
];

/**
 * Four dose scales, one per medication family, and the values are not interchangeable.
 *
 * RxScale asks these as four separate questions and each spells its values differently:
 * Wegovy and Ozempic store "0,25 mg" with a comma, Mounjaro stores "2.5 mg" with a period,
 * and Saxenda stores a bare "0,6" with no unit at all. Ours is one question whose options
 * depend on the medication, so the value a visitor produces is already the string the
 * matching RxScale question expects and 24b's mapper only has to choose the question.
 *
 * The labels are normalised to carry "mg" because RxScale's own are inconsistent about it:
 * theirs read "0,25" on one question and "2,5 mg" on another, which would look like a
 * mistake once they share one screen.
 */
const DOSES_WEGOVY: readonly ChoiceOption[] = [
	{ value: '0,25 mg', label: m.qn_dose_0_25 },
	{ value: '0,5 mg', label: m.qn_dose_0_5 },
	{ value: '1 mg', label: m.qn_dose_1 },
	{ value: '1,7 mg', label: m.qn_dose_1_7 },
	{ value: '2,4 mg', label: m.qn_dose_2_4 }
];

const DOSES_OZEMPIC: readonly ChoiceOption[] = [
	{ value: '0,25 mg', label: m.qn_dose_0_25 },
	{ value: '0,5 mg', label: m.qn_dose_0_5 },
	{ value: '1 mg', label: m.qn_dose_1 },
	{ value: '1,7 mg', label: m.qn_dose_1_7 },
	{ value: '2,0 mg', label: m.qn_dose_2 }
];

const DOSES_LIRAGLUTIDE: readonly ChoiceOption[] = [
	{ value: '0,6', label: m.qn_dose_0_6 },
	{ value: '1,2', label: m.qn_dose_1_2 },
	{ value: '1,8', label: m.qn_dose_1_8 },
	{ value: '2,4', label: m.qn_dose_2_4 },
	{ value: '3,0', label: m.qn_dose_3 }
];

const DOSES_MOUNJARO: readonly ChoiceOption[] = [
	{ value: '2.5 mg', label: m.qn_dose_2_5 },
	{ value: '5.0 mg', label: m.qn_dose_5 },
	{ value: '7.5 mg', label: m.qn_dose_7_5 },
	{ value: '10.0 mg', label: m.qn_dose_10 },
	{ value: '12.5 mg', label: m.qn_dose_12_5 },
	{ value: '15.0 mg', label: m.qn_dose_15 }
];

/** Empty for a medication RxScale asks no dose for, which is what hides the question. */
export function dosesFor(medication: PastMedication | null): readonly ChoiceOption[] {
	switch (medication) {
		case 'wegovy':
			return DOSES_WEGOVY;
		case 'ozempic':
			return DOSES_OZEMPIC;
		case 'saxenda':
		case 'nevolat (liraglutid)':
			return DOSES_LIRAGLUTIDE;
		case 'mounjaro':
			return DOSES_MOUNJARO;
		default:
			return [];
	}
}

/**
 * Every question the questionnaire asks, as data.
 *
 * The wording is Solean's from feature 24, but it is not invented: the German is transcribed
 * from RxScale's live model, which is clinical phrasing their doctors already work with, and
 * the English follows the Pencil export where the export asks the same question. Two places
 * depart from that and say so at the question.
 *
 * Ordered as the visitor walks them. `screens.ts` owns the grouping and `conditions.ts` owns
 * which of them are asked at all, so nothing here branches.
 */
export const QUESTIONS: readonly AnyQuestion[] = [
	// about-you
	defineQuestion({
		id: 'gender',
		kind: 'single',
		label: m.qn_gender_label,
		options: [
			{ value: 'female', label: m.qn_gender_female },
			{ value: 'male', label: m.qn_gender_male }
		]
	}),
	defineQuestion({
		id: 'dateOfBirth',
		kind: 'date',
		label: m.qn_date_of_birth_label
	}),
	defineQuestion({
		id: 'heightCm',
		kind: 'number',
		label: m.qn_height_label,
		range: { min: 120, max: 250 }
	}),
	defineQuestion({
		id: 'weightKg',
		kind: 'number',
		label: m.qn_weight_label,
		range: { min: 40, max: 300 }
	}),

	// weight-related-conditions
	defineQuestion({
		id: 'weightRelatedConditions',
		kind: 'multi',
		label: m.qn_weight_related_label,
		options: [
			{ value: 'High cholesterol or high triglycerides', label: m.qn_wrc_cholesterol },
			{
				value:
					'Heart disease or peripheral vascular disease, including angina, previous heart attacks, previous stroke',
				label: m.qn_wrc_heart
			},
			{ value: 'Knee or hip osteoarthritis', label: m.qn_wrc_osteoarthritis },
			{ value: 'Pain in back related to weight', label: m.qn_wrc_back_pain },
			{ value: 'Polycystic ovary syndrome (PCOS)', label: m.qn_wrc_pcos },
			{ value: 'Fatty liver', label: m.qn_wrc_fatty_liver },
			{ value: 'High blood pressure', label: m.qn_wrc_blood_pressure },
			{ value: 'Type 2 Diabetes', label: m.qn_wrc_type2 },
			{ value: 'Pre-diabetes', label: m.qn_wrc_prediabetes }
		],
		hasNone: true,
		hasOther: true,
		otherField: 'weightRelatedConditionsOther'
	}),

	// your-details
	defineQuestion({
		id: 'firstName',
		kind: 'text',
		label: m.qn_first_name_label
	}),
	defineQuestion({
		id: 'lastName',
		kind: 'text',
		label: m.qn_last_name_label
	}),
	// Required here although RxScale's `EMail` is not. Asking for more than they do can never
	// cause a 400, and the abandoned-questionnaire reminder has nothing to send to without it.
	defineQuestion({
		id: 'email',
		kind: 'text',
		label: m.qn_email_label,
		description: m.qn_email_description
	}),
	// The export marks it optional, and nothing sends it: RxScale has no phone question and
	// the cart does not carry one.
	defineQuestion({
		id: 'phone',
		kind: 'text',
		label: m.qn_phone_label,
		description: m.qn_phone_description,
		optional: true
	}),

	// medication-history
	// One question where RxScale asks two. `never` answers their
	// `TakingWeightlossMedication` with no; every other value answers it with yes and names
	// the medication in `WeightlossMedication`. Their own label for the second question,
	// "Orilstat", is a typo, so ours spells the medicine correctly while the value stays
	// theirs.
	defineQuestion({
		id: 'pastMedication',
		kind: 'single',
		label: m.qn_past_medication_label,
		description: m.qn_past_medication_description,
		options: [
			{ value: 'never', label: m.qn_med_never },
			{ value: 'wegovy', label: m.qn_med_wegovy },
			{ value: 'mounjaro', label: m.qn_med_mounjaro },
			{ value: 'saxenda', label: m.qn_med_saxenda },
			{ value: 'nevolat (liraglutid)', label: m.qn_med_nevolat },
			{ value: 'ozempic', label: m.qn_med_ozempic },
			{ value: 'Orlistat', label: m.qn_med_orlistat },
			{ value: 'rybelsus', label: m.qn_med_rybelsus },
			{ value: 'victoza', label: m.qn_med_victoza },
			{ value: 'xenical', label: m.qn_med_xenical },
			{ value: 'byetta', label: m.qn_med_byetta },
			{ value: 'bydureon', label: m.qn_med_bydureon },
			{ value: 'trulicity', label: m.qn_med_trulicity },
			{ value: 'tanzeum', label: m.qn_med_tanzeum }
		],
		hasOther: true,
		otherField: 'pastMedicationOther'
	}),
	defineQuestion({
		id: 'pastMedicationDose',
		kind: 'single',
		label: m.qn_dose_label,
		options: (answers) => dosesFor(answers.pastMedication),
		visibleIf: takesTrackedMedication
	}),
	defineQuestion({
		id: 'pastMedicationDuration',
		kind: 'number',
		label: m.qn_duration_label,
		description: m.qn_duration_description,
		visibleIf: takesTrackedMedication
	}),
	defineQuestion({
		id: 'pastMedicationLastDose',
		kind: 'text',
		label: m.qn_last_dose_label,
		description: m.qn_last_dose_description,
		visibleIf: takesTrackedMedication
	}),

	// side-effects
	defineQuestion({
		id: 'hasSideEffects',
		kind: 'single',
		label: m.qn_side_effects_label,
		options: YES_NO_CAPITALISED
	}),
	defineQuestion({
		id: 'sideEffectsDescription',
		kind: 'comment',
		label: m.qn_side_effects_description_label,
		visibleIf: reportsSideEffects
	}),

	// pregnancy
	// The export's multi-select is kept because it fans out losslessly onto RxScale's two
	// yes/no questions. The values are ours: they have no question of this shape to match.
	defineQuestion({
		id: 'pregnancyStatus',
		kind: 'multi',
		label: m.qn_pregnancy_label,
		options: [
			{ value: 'pregnant', label: m.qn_preg_pregnant },
			{ value: 'breastfeeding', label: m.qn_preg_breastfeeding },
			{ value: 'planning', label: m.qn_preg_planning }
		],
		hasNone: true
	}),

	// medical-conditions
	// "porphoria" is RxScale's own misspelling of porphyria. The value keeps their spelling
	// because their validator compares it literally; the label does not.
	defineQuestion({
		id: 'diseases',
		kind: 'multi',
		label: m.qn_diseases_label,
		options: [
			{ value: 'Thyroid cancer', label: m.qn_dis_thyroid_cancer },
			{ value: 'Pancreatitis', label: m.qn_dis_pancreatitis },
			{ value: 'Gallstones, gallbladder disease', label: m.qn_dis_gallstones },
			{ value: 'Liver disease', label: m.qn_dis_liver },
			{ value: 'Kidney disease', label: m.qn_dis_kidney },
			{ value: 'Diabetic retinopathy', label: m.qn_dis_retinopathy },
			{ value: 'Tachycardia or cardiac conduction disorders', label: m.qn_dis_tachycardia },
			{ value: 'Psychological or psychiatric problems', label: m.qn_dis_psychiatric },
			{ value: 'insulin or sulphonylureas', label: m.qn_dis_insulin },
			{ value: 'Heart failure', label: m.qn_dis_heart_failure },
			{ value: 'Weight loss surgery', label: m.qn_dis_weight_surgery },
			{ value: 'Type 1 diabetes', label: m.qn_dis_type1 },
			{ value: 'Endocrinological and/or thyroid disorders', label: m.qn_dis_endocrine },
			{ value: 'porphoria', label: m.qn_dis_porphyria },
			{ value: 'Inflammatory stomach or intestinal diseases', label: m.qn_dis_ibd },
			{ value: 'Severe gastrointestinal disorders', label: m.qn_dis_gi }
		],
		hasNone: true,
		hasOther: true,
		otherField: 'diseasesOther'
	}),

	// gallbladder
	defineQuestion({
		id: 'gallbladderRemoved',
		kind: 'single',
		label: m.qn_gallbladder_label,
		options: YES_NO_CAPITALISED
	}),

	// health-history
	defineQuestion({
		id: 'familyDiseases',
		kind: 'multi',
		label: m.qn_family_diseases_label,
		options: [
			{ value: 'Medullary thyroid cancer', label: m.qn_fam_medullary },
			{ value: 'Multiple Endocrine Neoplasia', label: m.qn_fam_men }
		],
		hasNone: true
	}),
	defineQuestion({
		id: 'mentalHealth',
		kind: 'single',
		label: m.qn_mental_health_label,
		options: YES_NO_CAPITALISED
	}),

	// eating-disorders
	defineQuestion({
		id: 'eatingDisorder',
		kind: 'single',
		label: m.qn_eating_disorder_label,
		description: m.qn_eating_disorder_description,
		options: YES_NO_CAPITALISED
	}),

	// RxScale stores these statements with the German sentence as the value itself, so that is
	// what ours store too. The value is a key their validator compares, not text on a screen.
	defineQuestion({
		id: 'eatingDisorderStatements',
		kind: 'multi',
		label: m.qn_eating_statements_label,
		options: [
			{
				value: 'Ich habe absichtlich erbrochen, weil ich mich unangenehm voll gefühlt habe.',
				label: m.qn_eat_vomit
			},
			{
				value: 'Ich bin besorgt, die Kontrolle über mein Essverhalten zu verlieren.',
				label: m.qn_eat_control
			},
			{
				value: 'Ich habe in den letzten drei Monaten mehr als 6 kg abgenommen.',
				label: m.qn_eat_lost_6kg
			},
			{
				value: 'Ich halte mich für dick, obwohl andere sagen, dass ich zu dünn bin.',
				label: m.qn_eat_body_image
			},
			{ value: 'Mein Leben wird vom Thema Essen dominiert.', label: m.qn_eat_dominated }
		],
		hasNone: true
	}),

	// allergies
	defineQuestion({
		id: 'allergies',
		kind: 'multi',
		label: m.qn_allergies_label,
		options: [
			{ value: 'Liraglutide', label: m.qn_alg_liraglutide },
			{ value: 'Semaglutide', label: m.qn_alg_semaglutide },
			{ value: 'Tirzepatid', label: m.qn_alg_tirzepatide },
			{ value: 'Benzylalkohol', label: m.qn_alg_benzyl },
			{ value: 'Disodium phosphate dihydrate', label: m.qn_alg_disodium },
			{ value: 'Propylene glycol', label: m.qn_alg_propylene },
			{ value: 'phenol', label: m.qn_alg_phenol },
			{ value: 'Hydrochloric Acid/Sodium Hydroxide', label: m.qn_alg_hcl }
		],
		hasNone: true,
		hasOther: true,
		otherField: 'allergiesOther'
	}),
	defineQuestion({
		id: 'otherMedication',
		kind: 'single',
		label: m.qn_other_medication_label,
		description: m.qn_other_medication_description,
		options: YES_NO_LOWERCASE
	}),
	defineQuestion({
		id: 'otherMedicationDescription',
		kind: 'comment',
		label: m.qn_other_medication_details_label,
		description: m.qn_other_medication_details_description,
		visibleIf: takesOtherMedication
	}),

	// disclaimers
	// RxScale keeps the nine statements in one newline-separated string, and so do we: the
	// screen splits them in 24d. Their own title reads "Bitte lese", which is a typo for
	// "Bitte lies"; the wording is ours now, so it is corrected here.
	defineQuestion({
		id: 'disclaimer',
		kind: 'consent',
		label: m.qn_disclaimer_label,
		description: m.qn_disclaimer_points,
		confirmLabel: m.qn_disclaimer_confirm
	}),
	// RxScale titles this "Für das Produkt Mounjaro:", a fragment that only works directly
	// above their own layout. Ours is a heading that stands on its own.
	defineQuestion({
		id: 'contraceptionDisclaimer',
		kind: 'consent',
		label: m.qn_contraception_label,
		description: m.qn_contraception_description,
		confirmLabel: m.qn_contraception_confirm
	})
];

/** Read a question by id, or throw: an id that is not in the list is a programming error. */
export function questionById(id: QuestionId): AnyQuestion {
	const question = QUESTIONS.find((candidate) => candidate.id === id);
	if (!question) throw new Error(`No question defined for "${id}"`);

	return question;
}
