import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Stands in for the RxScale anamnesis API so the app can be developed and the browser
 * harness can run without touching the live questionnaire. Every prefix the real host is
 * known to answer on is served, plus the documented v4 one, so pointing the app at any of
 * them works.
 */

const PORT = Number(process.env.FIXTURE_PORT ?? 4319);
const FIXTURE_UID = process.env.FIXTURE_QUESTIONNAIRE_UID ?? 'fixture-questionnaire';
const FIXTURE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/questionnaire-model.json');

const PREFIXES = ['/api/v2/anamnesis', '/api/v3-1/anamnesis', '/v4/anamnesis'];

function questionnaireUid(pathname) {
	for (const prefix of PREFIXES) {
		const match = pathname.match(new RegExp(`^${prefix}/questionnaires/([^/]+)$`));
		if (match) return decodeURIComponent(match[1]);
	}

	return null;
}

function send(response, status, body) {
	const payload = JSON.stringify(body);
	response.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'content-length': Buffer.byteLength(payload),
		// The app fetches this from the browser on client-side navigation, not only during SSR.
		'access-control-allow-origin': '*'
	});
	response.end(payload);
}

const server = createServer(async (request, response) => {
	const { pathname } = new URL(request.url ?? '/', `http://localhost:${PORT}`);
	const uid = questionnaireUid(pathname);
	console.log(`${request.method} ${pathname}`);

	if (request.method !== 'GET' || uid === null) {
		send(response, 404, { error: 'Not found' });
		return;
	}

	if (uid !== FIXTURE_UID) {
		send(response, 404, { error: 'No questionnaire found for the given ID' });
		return;
	}

	send(response, 200, JSON.parse(await readFile(FIXTURE_PATH, 'utf8')));
});

server.listen(PORT, () => {
	console.log(`Questionnaire fixture on http://localhost:${PORT}, uid ${FIXTURE_UID}`);
});
