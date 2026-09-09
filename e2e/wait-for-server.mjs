/**
 * Waits for a URL to answer, then exits.
 *
 * The SEO suite runs the same build behind two servers, one with indexing disabled and one with
 * it enabled, because the launch switch is read at runtime from `$env/dynamic` and the build is
 * identical either way. Two `vite build` runs writing the same output directory at once is a
 * race, so the second server waits for the first, which is the one that builds.
 */
const [url, timeoutSeconds = '300'] = process.argv.slice(2);
const deadline = Date.now() + Number(timeoutSeconds) * 1000;

while (Date.now() < deadline) {
	try {
		await fetch(url);
		process.exit(0);
	} catch {
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}

console.error(`Timed out waiting for ${url}`);
process.exit(1);
