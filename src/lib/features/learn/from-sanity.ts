import { croppedPicture, picture } from '$lib/sanity/image';
import type { ArticleDetail } from '$lib/sanity/queries';
import { toBlocks } from './blocks';
import { AVATAR_WIDTHS, PANEL_WIDTHS, tagsOf } from './journal';
import type { Article } from './types';

/**
 * One Sanity article, in the shape the page renders.
 *
 * The mapping happens once, at the load boundary, so no component has to know Sanity is behind
 * it. Until feature 26c this file also resolved the comparison against the treatment catalogue
 * and derived the contents list from whichever named sections an article filled; both went with
 * the fixed sections. The body is the article now, and `blocks.ts` owns turning it into
 * something drawable.
 */
export function toArticle(article: ArticleDetail): Article {
	return {
		slug: article.slug.current,
		category: article.category,
		title: article.title,
		summary: article.summary,
		tags: tagsOf(article),
		// The same ladder the Journal's featured card carries, because it is the same frame: a
		// photograph running the width of a bleed panel with the copy over it. One fixed URL was
		// enough while the hero was a 805px box beside the text.
		hero: article.hero?.asset ? picture(article.hero, PANEL_WIDTHS) : undefined,
		review: {
			reviewer: {
				name: article.reviewer?.name ?? '',
				role: article.reviewer?.role ?? '',
				portrait: article.reviewer?.portrait?.asset
					? croppedPicture(article.reviewer.portrait, AVATAR_WIDTHS, 1)
					: undefined
			},
			nextReviewAt: article.nextReviewAt ?? '',
			readTimeMinutes: article.readTimeMinutes ?? 0
		},
		body: toBlocks(article.body)
	};
}
