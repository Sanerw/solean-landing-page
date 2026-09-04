import { picture, croppedPicture, type SanityPicture } from '$lib/sanity/image';
import { plain } from '$lib/sanity/plain';
import type { ArticleListItem, SanityImage } from '$lib/sanity/queries';

/** One article as the Journal draws it, which is less than the article page needs. */
export interface JournalArticle {
	id: string;
	slug: string;
	title: string;
	category: string;
	summary: string;
	readTimeMinutes?: number;
	hero?: SanityPicture;
	reviewer?: { name: string; portrait?: SanityPicture };
}

/**
 * The featured card runs the width of the panel; the reviewer sits in a small round frame. Both
 * ladders are per frame rather than a shared default, for the reason recorded in
 * `marketing/from-sanity.ts`: the browser suite decodes each image and fails one drawn below the
 * density it carries.
 */
const WIDTHS = {
	featured: [540, 768, 1080, 1366, 1920],
	avatar: [40, 80, 120]
} as const;

function pictureOf(image: SanityImage | undefined, widths: readonly number[]) {
	return image?.asset ? picture(image, widths) : undefined;
}

/**
 * `slug` and `category` go through `plain` because preview embeds invisible source markers in
 * every string, and these two are read as logic rather than printed: one builds an href, the
 * other will key the category chips. The prose is left as it arrives so click-to-edit keeps
 * working on it.
 */
/**
 * The newest article is the featured card and the rest fill the grid below it. This split is
 * what decides whether the "Articles & resources" band is drawn at all: with one article the
 * rest is empty, and a band whose grid has nothing in it and whose chips filter one item is
 * decoration that lies about how much there is to read.
 *
 * The query already orders by `reviewedAt` descending, so "newest" is "first" and no date is
 * compared here. Re-sorting would put a second opinion about ordering in the client.
 */
export function splitJournal(articles: readonly JournalArticle[]): {
	featured?: JournalArticle;
	rest: JournalArticle[];
} {
	return { featured: articles[0], rest: articles.slice(1) };
}

/** The chips, in the order the articles introduce them, with no empty chip and no duplicate. */
export function categoriesOf(articles: readonly JournalArticle[]): string[] {
	return [...new Set(articles.map((article) => article.category).filter(Boolean))];
}

/** `null` is the "all guides" chip, which is why it is not spelled as a category string. */
export function inCategory(
	articles: readonly JournalArticle[],
	category: string | null
): JournalArticle[] {
	return category === null ? [...articles] : articles.filter((a) => a.category === category);
}

export function journalArticlesFrom(articles: readonly ArticleListItem[]): JournalArticle[] {
	return articles.map((article) => ({
		id: article._id,
		slug: plain(article.slug.current),
		title: article.title,
		category: plain(article.category),
		summary: article.summary,
		readTimeMinutes: article.readTimeMinutes,
		hero: pictureOf(article.hero, WIDTHS.featured),
		reviewer: article.reviewer && {
			name: article.reviewer.name,
			portrait: article.reviewer.portrait?.asset
				? croppedPicture(article.reviewer.portrait, WIDTHS.avatar, 1)
				: undefined
		}
	}));
}
