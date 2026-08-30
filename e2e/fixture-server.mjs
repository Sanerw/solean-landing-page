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

function questionnaireUid(pathname, suffix = '') {
	for (const prefix of PREFIXES) {
		const match = pathname.match(new RegExp(`^${prefix}/questionnaires/([^/]+)${suffix}$`));
		if (match) return decodeURIComponent(match[1]);
	}

	return null;
}

function readBody(request) {
	return new Promise((resolve, reject) => {
		let raw = '';
		request.on('data', (chunk) => (raw += chunk));
		request.on('end', () => {
			try {
				resolve(raw ? JSON.parse(raw) : null);
			} catch (error) {
				reject(error);
			}
		});
		request.on('error', reject);
	});
}

/**
 * The harness asks for a failure by answering with a marker rather than by a side channel,
 * so no question exists only for testing and the request under test is a real one.
 */
function markerIn(data) {
	const text = JSON.stringify(data ?? {});

	if (text.includes('TRIGGER-400')) return 400;
	if (text.includes('TRIGGER-502')) return 502;

	return null;
}

let submissionCount = 0;

function send(response, status, body) {
	const payload = JSON.stringify(body);
	response.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'content-length': Buffer.byteLength(payload),
		// The app calls this from the browser on client-side navigation, not only during SSR.
		'access-control-allow-origin': '*',
		'access-control-allow-headers': 'content-type'
	});
	response.end(payload);
}

const server = createServer(async (request, response) => {
	const { pathname } = new URL(request.url ?? '/', `http://localhost:${PORT}`);
	const uid = questionnaireUid(pathname);
	console.log(`${request.method} ${pathname}`);

	// A cross-origin POST with a JSON body is preflighted.
	if (request.method === 'OPTIONS') {
		response.writeHead(204, {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET, POST, OPTIONS',
			'access-control-allow-headers': 'content-type'
		});
		response.end();
		return;
	}

	const submissionFor = questionnaireUid(pathname, '/submissions');

	if (request.method === 'POST' && submissionFor !== null) {
		if (submissionFor !== FIXTURE_UID) {
			send(response, 404, { error: 'No questionnaire found for the given ID' });
			return;
		}

		let body;
		try {
			body = await readBody(request);
		} catch {
			send(response, 400, { error: { data: ['Missing data for required field.'] } });
			return;
		}

		// The documented contract: one `data` key holding the SurveyJS answers.
		if (body === null || typeof body.data !== 'object' || body.data === null) {
			send(response, 400, { error: { data: ['Missing data for required field.'] } });
			return;
		}

		const marker = markerIn(body.data);
		if (marker === 400) {
			send(response, 400, { error: ['dob must be a valid date', 'Gender is required'] });
			return;
		}
		if (marker === 502) {
			send(response, 502, { error: 'submission validator unavailable' });
			return;
		}

		submissionCount += 1;
		send(response, 201, { uid: `anam-fixture-${submissionCount}` });
		return;
	}

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
