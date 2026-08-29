const articleDateFormatter = new Intl.DateTimeFormat('en-GB', {
	dateStyle: 'medium',
	timeZone: 'UTC'
});

export function formatArticleDate(value: string): string {
	return articleDateFormatter.format(new Date(`${value}T00:00:00Z`));
}
