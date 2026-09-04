import { describe, expect, it } from 'vitest';
import { categoriesOf, inCategory, splitJournal, type JournalArticle } from './journal';

function article(slug: string, category = 'Treatment comparison'): JournalArticle {
	return { id: slug, slug, title: slug, category, summary: '' };
}

describe('splitJournal', () => {
	it('gives the whole page nothing to draw when nothing is published', () => {
		expect(splitJournal([])).toEqual({ featured: undefined, rest: [] });
	});

	// The state the site is actually in: one article, so the band below the featured card has
	// nothing to show and must not be rendered.
	it('leaves no rest for a single article', () => {
		const only = article('mounjaro-vs-wegovy');

		expect(splitJournal([only])).toEqual({ featured: only, rest: [] });
	});

	it('features the first and keeps the order of the rest', () => {
		const [a, b, c] = [article('a'), article('b'), article('c')];

		expect(splitJournal([a, b, c])).toEqual({ featured: a, rest: [b, c] });
	});
});

describe('categoriesOf', () => {
	it('lists each category once, in the order the articles introduce it', () => {
		const articles = [article('a', 'Nutrition'), article('b', 'Treatments'), article('c', 'Nutrition')];

		expect(categoriesOf(articles)).toEqual(['Nutrition', 'Treatments']);
	});

	it('drops an article that carries no category rather than offering an empty chip', () => {
		expect(categoriesOf([article('a', ''), article('b', 'Nutrition')])).toEqual(['Nutrition']);
	});
});

describe('inCategory', () => {
	const articles = [article('a', 'Nutrition'), article('b', 'Treatments')];

	it('keeps everything for the all-guides chip', () => {
		expect(inCategory(articles, null)).toEqual(articles);
	});

	it('keeps only the chosen category', () => {
		expect(inCategory(articles, 'Treatments')).toEqual([articles[1]]);
	});

	it('answers an unknown category with nothing rather than with everything', () => {
		expect(inCategory(articles, 'Healthy habits')).toEqual([]);
	});
});
