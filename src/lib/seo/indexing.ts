export interface IndexingPolicy {
	origin: string | null;
	enabled: boolean;
	vercelEnvironment: string | undefined;
}

/** Shared by response protection and, in the next steps, discovery endpoints. */
export function deploymentMayIndex(policy: IndexingPolicy, requestOrigin: string): boolean {
	return (
		policy.enabled &&
		policy.origin !== null &&
		requestOrigin === policy.origin &&
		(policy.vercelEnvironment === undefined || policy.vercelEnvironment === 'production')
	);
}

const PUBLIC_PAGE_ROUTES = new Set([
	'/(marketing)',
	'/(marketing)/learn',
	'/(marketing)/learn/blog/[slug]',
	'/(marketing)/treatments/[slug]',
	'/(marketing)/privacy',
	'/(marketing)/terms',
	'/(marketing)/returns',
	'/(marketing)/legal-notice'
]);

interface PageIndexingContext {
	requestOrigin: string;
	routeId: string | null;
	previewEnabled: boolean;
	status: number;
	contentType: string | null;
}

export function pageMayIndex(policy: IndexingPolicy, page: PageIndexingContext): boolean {
	return (
		deploymentMayIndex(policy, page.requestOrigin) &&
		!page.previewEnabled &&
		page.status === 200 &&
		page.contentType?.split(';', 1)[0].trim().toLowerCase() === 'text/html' &&
		PUBLIC_PAGE_ROUTES.has(page.routeId ?? '')
	);
}
