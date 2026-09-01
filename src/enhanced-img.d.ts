// Ambient declarations for the imagetools query strings this project imports.
// A wildcard module matches on an exact suffix, so each distinct query needs its own
// entry: changing a quality number here without updating the matching import (or the
// reverse) fails `pnpm check` while the build stays green, because Vite does not typecheck.

declare module '*?enhanced&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=100vw&quality=75' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=40px&w=40;80;120&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=100vw&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=100vw&w=400;540;768;1080;1366;1536&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=100vw&w=400;540;768;1080;1315&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}

declare module '*?enhanced&imgSizes=100vw&w=120;240;540;768;1080;1366&quality=90' {
	import type { Picture } from '@sveltejs/enhanced-img';

	const value: Picture;
	export default value;
}
