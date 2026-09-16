import assert from "node:assert/strict";
import { before, test } from "node:test";

const baseURL = process.env.TEST_API_URL ?? "http://localhost:8790";
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) {
  throw new Error("Use an isolated local API for integration tests");
}
const origin = "http://localhost:8088";
const email = `reports-${crypto.randomUUID()}@example.com`;
const password = "Local-test-password-123!";
let cookie;
let locationId;
let otherLocationId;
let createdIds;

const request = (path, { body, session = false, ...options } = {}) =>
  fetch(`${baseURL}${path}`, {
    ...options,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(session ? { Cookie: cookie } : {}),
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
const readJSON = async (path) => {
  const response = await request(path);
  return response.json();
};
const responseStatus = async (path, options) => {
  const response = await request(path, options);
  return response.status;
};
const readCookie = (response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

before(async () => {
  const locations = await readJSON("/api/locations");
  [locationId, otherLocationId] = locations.locations.map(
    (location) => location.id
  );
  if (!locationId || !otherLocationId) {
    throw new Error("Seed at least two locations before testing");
  }
});

test("guests can read reports but cannot create them", async () => {
  const list = await request(`/api/reports?locationId=${locationId}`);
  assert.equal(list.status, 200);
  const denied = await request("/api/reports", {
    method: "POST",
    body: { locationId, crowdLevel: "busy" },
  });
  assert.equal(denied.status, 401);
});

test("registration establishes a session for web and native cookie requests", async () => {
  const response = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Report Tester", email, password },
  });
  assert.equal(response.status, 200, await response.clone().text());
  cookie = readCookie(response);
  assert.ok(cookie);
  const session = await request("/api/auth/get-session", { session: true });
  const sessionData = await session.json();
  assert.equal(sessionData.user.name, "Report Tester");
  const nativeSession = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: { Cookie: cookie, "expo-origin": "studystatus://" },
  });
  const nativeSessionData = await nativeSession.json();
  assert.equal(nativeSessionData.user.name, "Report Tester");
});

test("signed-in users create reports attributed to their session", async () => {
  const responses = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      request("/api/reports", {
        method: "POST",
        session: true,
        body: {
          locationId,
          crowdLevel: "moderate",
          comment: `Integration report ${index}`,
          createdBy: "forged-user",
        },
      })
    )
  );
  const bodies = await Promise.all(
    responses.map(async (response) => {
      assert.equal(response.status, 201, await response.clone().text());
      return response.json();
    })
  );
  assert.ok(bodies.every((body) => body.report.authorName === "Report Tester"));
  createdIds = bodies.map((body) => body.report.id).toSorted((a, b) => b - a);
  const other = await request("/api/reports", {
    method: "POST",
    session: true,
    body: { locationId: otherLocationId, crowdLevel: "empty" },
  });
  assert.equal(other.status, 201);
});

test("location pagination has no overlap when new reports arrive", async () => {
  const first = await readJSON(`/api/reports?locationId=${locationId}`);
  assert.deepEqual(
    first.reports.map((report) => report.id),
    createdIds.slice(0, 10)
  );
  assert.ok(first.reports.every((report) => report.locationId === locationId));
  const newer = await request("/api/reports", {
    method: "POST",
    session: true,
    body: { locationId, crowdLevel: "busy" },
  });
  assert.equal(newer.status, 201);
  const second = await readJSON(
    `/api/reports?locationId=${locationId}&before=${first.nextCursor}`
  );
  assert.deepEqual(
    second.reports.slice(0, 2).map((report) => report.id),
    createdIds.slice(10)
  );
  assert.ok(second.reports.every((report) => report.id < first.nextCursor));
  const detail = await request(`/api/reports/${createdIds[0]}`);
  assert.equal(detail.status, 200);
  const detailData = await detail.json();
  assert.equal(detailData.report.authorName, "Report Tester");
});

test("invalid reports and missing records return proper errors", async () => {
  for (const body of [
    { locationId, crowdLevel: "invalid" },
    { locationId, crowdLevel: "empty", comment: "x".repeat(1001) },
  ]) {
    // Each assertion checks its own request result.
    // eslint-disable-next-line no-await-in-loop
    const response = await request("/api/reports", {
      method: "POST",
      session: true,
      body,
    });
    assert.equal(response.status, 400);
  }
  assert.equal(
    await responseStatus("/api/reports", {
      method: "POST",
      session: true,
      body: { locationId: 999_999_999, crowdLevel: "empty" },
    }),
    404
  );
  assert.equal(await responseStatus("/api/reports/999999999"), 404);
  assert.equal(await responseStatus("/api/reports?before=-1"), 400);
});

test("credentialed CORS allows configured origins and rejects untrusted writes", async () => {
  const preflight = await request("/api/reports", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    preflight.headers.get("access-control-allow-credentials"),
    "true"
  );
  const denied = await request("/api/reports", {
    method: "POST",
    session: true,
    headers: { Origin: "https://untrusted.example" },
    body: { locationId, crowdLevel: "empty" },
  });
  assert.equal(denied.status, 403);
});

test("sign-out revokes report creation; signing in restores it", async () => {
  assert.equal(
    await responseStatus("/api/auth/sign-out", {
      method: "POST",
      session: true,
      body: {},
    }),
    200
  );
  assert.equal(
    await responseStatus("/api/reports", {
      method: "POST",
      session: true,
      body: { locationId, crowdLevel: "empty" },
    }),
    401
  );
  const login = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(login.status, 200);
  cookie = readCookie(login);
  const nativeCreate = await fetch(`${baseURL}/api/reports`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, crowdLevel: "empty" }),
  });
  assert.equal(nativeCreate.status, 201);
});
