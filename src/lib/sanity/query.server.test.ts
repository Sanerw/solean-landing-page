import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetch = vi.fn();

vi.mock('$lib/sanity/client.server', () => ({ serverClient: { fetch } }));

const { loadPublishedQuery } = await import('./query.server');

describe('loadPublishedQuery', () => {
	beforeEach(() => {
		fetch.mockReset();
		fetch.mockResolvedValue({ title: 'Mounjaro' });
	});

	it('returns the shape the vendor loader returns, because every caller reads `.data`', async () => {
		// Nine load functions and `LiveQuery.svelte` read `.data` off this. The result is not
		// unwrapped here for that reason: the two paths, previewing and not, have to agree.
		await expect(loadPublishedQuery('*[_id == $id][0]', { id: 'treatment-mounjaro-de' })).resolves
			.toEqual({ data: { title: 'Mounjaro' } });
	});

	it('reads published content with the source markers off', async () => {
		await loadPublishedQuery('*[_type == "article"]');

		// `serverClient` carries `stega: true` for preview's sake. Leaving it on here would put
		// invisible codepoints into strings this app uses as logic, which is the bug
		// `$lib/sanity/plain` exists to undo.
		expect(fetch).toHaveBeenCalledWith('*[_type == "article"]', {}, {
			perspective: 'published',
			stega: false
		});
	});
});
