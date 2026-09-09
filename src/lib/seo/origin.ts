const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Invalid SEO configuration must not prevent somebody completing the questionnaire. */
export function parseSiteOrigin(value: string | undefined, allowLoopback = false): string | null {
	const input = value?.trim();
	if (!input || !/^https?:\/\/[^/?#]+\/?$/i.test(input) || /[\s\\@]/.test(input)) return null;

	try {
		const url = new URL(input);
		const localHttp = allowLoopback && url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);
		if (url.protocol !== 'https:' && !localHttp) return null;
		if (url.username || url.password || url.pathname !== '/') return null;

		return url.origin;
	} catch {
		return null;
	}
}
