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
const FIXTURE_VARIANT_ID = process.env.FIXTURE_VARIANT_ID ?? '49703576666445';
const FIXTURE_PRESCRIPTION_VARIANT_ID = process.env.FIXTURE_PRESCRIPTION_VARIANT_ID ?? '48233241215309';
const FIXTURE_UID = process.env.FIXTURE_QUESTIONNAIRE_UID ?? 'fixture-questionnaire';
const FIXTURE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/questionnaire-model.json');

const PREFIXES = ['/api/v2/anamnesis', '/api/v3-1/anamnesis', '/v4/anamnesis'];

const RECOMMENDATION_PATH = /^\/api\/(?:v2|v3-1)\/anamnesis\/([^/]+)\/recommendation$/;

/**
 * The shop identifier RxScale records on a listing. The preview server points the app's store
 * domain at this fixture, and the mapper compares the two bare, so this is that host.
 */
const FIXTURE_SHOP = `localhost:${PORT}`;

/**
 * One treatment and one prescription-only listing, which is the split the live document has
 * and the only thing the screen groups on. Trimmed to the fields the app reads: the real
 * document carries the whole catalogue graph beside them.
 */
function recommendation() {
	const plan = (name, variantId, price, digital, preSelected, label) => ({
		product: { display_name: name, uid: `product-${variantId}` },
		shop_data: { title: name, featuredImage: null },
		skus: [
			{
				selectable: true,
				pre_selected: preSelected,
				shop_data: { displayName: label },
				sku: {
					display_name: label,
					digital,
					shop_skus: [
						{ price, shop: { identifier: FIXTURE_SHOP }, shop_variation_id: variantId }
					]
				}
			}
		]
	});

	return [
		plan('Fixture Treatment', FIXTURE_VARIANT_ID, 24900, false, true, '0.25 mg'),
		plan('Fixture Treatment', FIXTURE_PRESCRIPTION_VARIANT_ID, 4990, true, false, '0.25 mg Digital-Rezept')
	];
}

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
let cartCount = 0;

/**
 * Stands in for the Shopify Storefront API, so the handoff can be exercised without creating
 * a cart in the real shop. It asserts the promises this app makes about the cart it builds,
 * because a violation would otherwise only surface as an order nobody can review. The failure
 * it should return is asked for through the buyer's e-mail, the way the submission markers
 * work, because the store domain is server configuration a browser test cannot vary.
 */
const STOREFRONT = /^\/api\/[^/]+\/graphql\.json$/;
const ANAMNESIS_ATTRIBUTE = '_anamnesis_uid';

function userErrors(...messages) {
	const errors = messages.map((message) => ({ field: null, message }));

	return { data: { cartCreate: { cart: null, userErrors: errors } } };
}

/**
 * Shopify attributes a refusal to the input it rejected, and the app decides whether to
 * answer a refusal by reading that path. A stand-in that reported every complaint the same
 * way could not tell the two cases apart.
 */
function fieldError(field, message) {
	return { data: { cartCreate: { cart: null, userErrors: [{ field, message, code: 'INVALID' }] } } };
}

/**
 * Roughly the shop's own verdict, not a copy of it: the live store refuses `niepoprawny` and
 * `a@b` alike. What the harness needs is that some addresses draw the refusal and what its
 * shape is, because the address rule belongs to Shopify and is not ours to restate.
 */
const DELIVERABLE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** What each created cart was built with, so the checkout page can report it back. */
const carts = new Map();

function escape(value) {
	return value.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`);
}

/** The order-level attribute rule, checked where breaking it would otherwise go unnoticed. */
function cartComplaint(input) {
	const lines = input?.lines ?? [];
	if (lines.length !== 1 || lines[0].quantity !== 1 || !lines[0].merchandiseId) {
		return 'A cart needs exactly one merchandise line with quantity 1';
	}

	const attributes = input?.attributes ?? [];
	const anamnesis = attributes.filter((attribute) => attribute.key === ANAMNESIS_ATTRIBUTE);
	if (anamnesis.length !== 1 || !anamnesis[0].value) {
		return `A cart needs one non-empty ${ANAMNESIS_ATTRIBUTE} order attribute`;
	}

	// Decision 2: the order level alone, because the bundle's components are not ours to set.
	const onLine = lines.some((line) =>
		(line.attributes ?? []).some((attribute) => attribute.key === ANAMNESIS_ATTRIBUTE)
	);

	return onLine ? `${ANAMNESIS_ATTRIBUTE} belongs on the order, not on a line` : null;
}

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

	// The page a checkout link leads to. Real enough to navigate to and assert on. It reports
	// the prefill its own cart was created with, so a test can read that off the page it lands
	// on rather than off counters this server shares between parallel workers.
	if (request.method === 'GET' && pathname.startsWith('/checkout/')) {
		const cart = carts.get(pathname.slice('/checkout/'.length));
		const page = `<!doctype html><meta charset="utf-8"><title>Fixture checkout</title><h1>Fixture checkout</h1><p data-testid="prefill">${escape(cart?.email || 'none')}</p><p data-testid="variant">${escape(cart?.variantId || 'none')}</p>`;
		response.writeHead(200, {
			'content-type': 'text/html; charset=utf-8',
			'content-length': Buffer.byteLength(page)
		});
		response.end(page);
		return;
	}

	if (request.method === 'POST' && STOREFRONT.test(pathname)) {
		let body;
		try {
			body = await readBody(request);
		} catch {
			send(response, 400, { errors: [{ message: 'Malformed body' }] });
			return;
		}

		const input = body?.variables?.input ?? null;
		const complaint = cartComplaint(input);
		if (complaint) {
			send(response, 200, userErrors(complaint));
			return;
		}

		const email = input.buyerIdentity?.email ?? '';
		if (email.startsWith('refused@')) {
			send(response, 200, userErrors('The merchandise line is not available'));
			return;
		}
		if (email.startsWith('unreachable@')) {
			send(response, 502, { errors: [{ message: 'Upstream unavailable' }] });
			return;
		}

		// The model does not validate the e-mail question, so an address the shop will not take
		// is a walk anybody can mistype their way into.
		if (email && !DELIVERABLE_EMAIL.test(email)) {
			send(response, 200, fieldError(['input', 'buyerIdentity', 'email'], 'Email ist ungültig'));
			return;
		}

		cartCount += 1;
		const id = `fixture-${cartCount}`;
		// The variant too, not only the e-mail: which merchandise a cart was built from is the
		// one thing a redirect leaves no other trace of, and the fallback is only observable here.
		carts.set(id, { email, variantId: String(input.lines[0].merchandiseId).split('/').pop() });
		send(response, 200, {
			data: {
				cartCreate: {
					cart: { checkoutUrl: `http://localhost:${PORT}/checkout/${id}` },
					userErrors: []
				}
			}
		});
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

	// The recommendation, selected by the anamnesis the way the submission and cart failures
	// are selected by an answer: `empty` answers with none, which is the live service's own
	// way of saying nothing was matched, and `unreachable` does not answer at all.
	const recommendationFor = pathname.match(RECOMMENDATION_PATH);
	if (request.method === 'GET' && recommendationFor) {
		const anamnesis = decodeURIComponent(recommendationFor[1]);
		if (anamnesis.includes('unreachable')) {
			send(response, 502, { error: 'recommendation service unavailable' });
			return;
		}

		send(response, 200, anamnesis.includes('empty') ? [] : recommendation());
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
