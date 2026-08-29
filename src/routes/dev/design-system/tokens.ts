export interface ColorToken {
	name: string;
	/** The value recorded in blueprint/reference/design-system.md, shown so a swatch
	 * that renders differently from its documented value is visible as a defect. */
	value: string;
	role: string;
}

export interface TokenGroup {
	title: string;
	note?: string;
	tokens: ColorToken[];
}

export const COLOR_TOKEN_GROUPS: TokenGroup[] = [
	{
		title: 'Base',
		tokens: [
			{ name: '--background', value: '#FBFAF7', role: 'Page ground, warm off-white' },
			{ name: '--foreground', value: '#173824', role: 'Nearly all text; dark surfaces' },
			{ name: '--card', value: '#FFFFFF', role: 'Cards, panels, navigation' },
			{ name: '--card-foreground', value: '#173824', role: 'Text on cards' },
			{ name: '--popover', value: '#FFFFFF', role: 'Dropdown and modal surfaces' },
			{ name: '--popover-foreground', value: '#173824', role: 'Text in popovers' },
			{ name: '--primary', value: '#E2B64F', role: 'Every main CTA, timer, highlight' },
			{ name: '--primary-foreground', value: '#172019', role: 'Label on gold buttons' },
			{ name: '--primary-hover', value: '#D9971C', role: 'Hover and active on primary' },
			{ name: '--secondary', value: '#F7F8F5', role: 'Back and cancel, completed steps' },
			{ name: '--secondary-foreground', value: '#173824', role: 'Text on secondary' },
			{ name: '--muted', value: '#F4F3EC', role: 'Warm inset panels' },
			{ name: '--muted-foreground', value: '#405756', role: 'Body copy, descriptions. 7.41:1' },
			{ name: '--accent', value: '#EEF3EC', role: 'Green-tinted badges and banners' },
			{ name: '--accent-foreground', value: '#173824', role: 'Text on accent' },
			{ name: '--border', value: '#E5E7E2', role: 'Default 1px hairline' },
			{ name: '--input', value: '#8C8D89', role: 'Field boundary, 3:1 non-text. Corrected, F-02' },
			{ name: '--ring', value: '#173824', role: 'Focus ring, deep green not gold' }
		]
	},
	{
		title: 'Destructive, provisional',
		note: 'The design reference contains no red across its 21 artboards. This family is approved as a temporary technical token for the prototype only and needs final brand review. The fill token is for fills and borders; the text token is for validation copy on light surfaces, where the fill tone measures 4.47:1 and fails AA.',
		tokens: [
			{ name: '--destructive', value: '#C34E45', role: 'Fills and borders' },
			{ name: '--destructive-foreground', value: '#FFFFFF', role: 'Text on those fills, 4.66:1' },
			{ name: '--destructive-hover', value: '#B23F37', role: 'Hover on destructive' },
			{ name: '--destructive-active', value: '#A4322C', role: 'Pressed' },
			{ name: '--destructive-text', value: '#BC483F', role: 'Validation copy on light surfaces' }
		]
	},
	{
		title: 'Semantic extensions',
		tokens: [
			{ name: '--highlight', value: '#F7EBCB', role: 'Chips, article category' },
			{ name: '--highlight-foreground', value: '#906100', role: 'Text on highlight; eyebrows, discount values. 4.54:1 on highlight. Corrected, F-01 and F-03' },
			{ name: '--surface-warm', value: '#F3ECDD', role: 'Chart gridlines, article hero' },
			{ name: '--surface-subtle', value: '#FFFDF8', role: 'Order summary, treatment panels' },
			{ name: '--surface-tint', value: '#DDE4DD', role: 'FAQ items, dividers, card borders' },
			{ name: '--text-tertiary', value: '#57655C', role: 'Tertiary text, 5.88:1. Corrected, F-01' },
			{ name: '--text-faint', value: '#647168', role: 'Disclaimers, clinical notes. 4.90:1. Corrected, F-01' },
			{ name: '--inverse-hover', value: '#0F301D', role: 'Hover on the inverse CTA' },
			{ name: '--inverse-active', value: '#082A17', role: 'Pressed on the inverse CTA' },
			{ name: '--rating', value: '#00B67A', role: 'Rating and star colour only' }
		]
	}
];
