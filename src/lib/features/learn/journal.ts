import { picture, croppedPicture, type SanityPicture } from '$lib/sanity/image';
import { plain } from '$lib/sanity/plain';
import type { ArticleListItem, SanityImage } from '$lib/sanity/queries';

/** A neighbour as the article page links to it: what a link needs to say, and nothing else. */
export interface ArticleLink {
	title: string;
	slug: string;
}

/** One article as the Journal draws it, which is less than the article page needs. */
export interface JournalArticle {
	id: string;
	slug: string;
	title: string;
	category: string;
	tags: readonly string[];
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

/**
 * Exported because the article's own hero is the same frame at a different size: a photograph
 * running the width of a bleed panel with the copy over it. Two ladders for one frame would be
 * two things to keep in step, and the density test measures both pages.
 */
export const PANEL_WIDTHS = WIDTHS.featured;
export const AVATAR_WIDTHS = WIDTHS.avatar;

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

/**
 * The chips an article shows, which is not the same question as which category it filters
 * under. An article with no tags falls back to its category rather than showing nothing: every
 * article has one, the artboard draws at least one chip, and an empty row reads as a defect.
 *
 * The blank test runs on the stripped string while the chip keeps the original, because preview
 * fills every string with invisible markers: a tag of nothing but markers is empty to a reader
 * and not to `trim()`, and stripping the value we render would cost it click-to-edit.
 */
export function tagsOf(article: { tags?: readonly string[]; category: string }): string[] {
	const tags = (article.tags ?? []).filter((tag) => plain(tag).trim() !== '');

	return tags.length > 0 ? tags : [article.category];
}

/**
 * The articles either side of one, in the Journal's own order. Taken from the same list the
 * Journal renders rather than from a field an editor fills: nothing to keep in step, and a
 * neighbour cannot point at an article that was unpublished.
 *
 * Direction follows the list the reader just came from, not the calendar: the Journal is newest
 * first, so "next" is the next one down that page and therefore the older article. The newest
 * has nothing before it and the oldest nothing after. An unknown slug has neither, which is
 * what previewing an unpublished draft looks like.
 */
export function neighboursOf(
	articles: readonly JournalArticle[],
	slug: string
): { previous?: JournalArticle; next?: JournalArticle } {
	const at = articles.findIndex((article) => article.slug === slug);

	if (at === -1) return {};

	return { previous: articles[at - 1], next: articles[at + 1] };
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
		tags: tagsOf({ tags: article.tags, category: plain(article.category) }),
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
