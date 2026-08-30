import { getContext, setContext } from "svelte";

const TABS_ID_KEY = Symbol("tabs-id");

export function setTabsIdContext(uid: string): void {
	setContext(TABS_ID_KEY, uid);
}

export function getTabsIdContext(): string | null {
	return getContext<string | undefined>(TABS_ID_KEY) ?? null;
}

/**
 * The ids for one tab and its panel, derived from the root's id and the item value so
 * neither side has to restate the other's. bits-ui emits `role="tab"` and `role="tabpanel"`
 * but no `aria-controls` or `aria-labelledby`, leaving the two related only by a
 * `data-value` that assistive technology never reads. Returns null when a trigger or panel
 * is used outside a root, where inventing an id would point at nothing.
 */
export function tabsIds(
	uid: string | null,
	value: string | undefined
): { trigger: string; panel: string } | null {
	if (uid === null || value === undefined) return null;

	const slug = value.replace(/[^a-zA-Z0-9_-]/g, "-");
	return { trigger: `${uid}-trigger-${slug}`, panel: `${uid}-panel-${slug}` };
}
