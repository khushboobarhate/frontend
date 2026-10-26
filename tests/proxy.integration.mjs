import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_FRONTEND_URL || "http://127.0.0.1:3001";
const fixture = process.env.TEST_FIXTURE_URL || "http://127.0.0.1:5101";
async function call(
  path,
  { cookie, method = "GET", body, origin, ...rest } = {},
) {
  return fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
    ...rest,
  });
}
// Fail before any mutation if the frontend is not using the disposable fixture.
const probe = await call("/api/backend/api/farmer/__fixture");
assert.equal(
  (await probe.json()).fixture,
  "setumoolya-local-ui-test",
  "Refusing to test a non-fixture backend",
);
async function login(role) {
  const response = await call(`/api/backend/api/${role}/login`, {
    method: "POST",
    body: { email: `${role}@example.com`, password: "Fixture-only@123" },
  });
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 3);
  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);
  }
  const data = await response.json();
  assert.equal(data.data.token, undefined);
  assert.equal(data.data.refreshToken, undefined);
  return cookies.map((x) => x.split(";")[0]).join("; ");
}
test("only run against explicit local fixture backend", async () => {
  const response = await fetch(fixture + "/__fixture/events");
  assert.equal(response.status, 200);
});
for (const role of ["admin", "farmer", "buyer"])
  test(`${role}: cookie sign-in and authenticated restoration`, async () => {
    const cookie = await login(role);
    const response = await call("/api/session", { cookie });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.user.role, role);
    if (role !== "admin")
      assert.equal(
        data.user.full_address,
        "Sample address for local testing only",
      );
  });
test("admin restoration uses dashboard, never a nonexistent profile", async () => {
  const events = await (await fetch(fixture + "/__fixture/events")).json();
  assert.ok(events.some((x) => x.path === "/api/admin/dashboard"));
  assert.ok(!events.some((x) => x.path === "/api/admin/profile"));
});
test("farmer and buyer registration forward multipart fields without OTP/password", async () => {
  for (const role of ["farmer", "buyer"]) {
    const body = new FormData();
    for (const [key, value] of Object.entries({
      full_name: "UI Test Applicant",
      email: `${role}@example.com`,
      mobile_number: "0000000000",
      state: "Maharashtra",
      city: "Nashik",
      full_address: "UI fixture address",
      ...(role === "farmer" ? { land_location: "UI fixture farm" } : {}),
    }))
      body.append(key, value);
    body.append(
      "photo",
      new Blob(["test-fixture"], { type: "image/png" }),
      "fixture.png",
    );
    const response = await call(`/api/backend/api/${role}/register`, {
      method: "POST",
      body,
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.status, "pending");
  }
  const events = await (await fetch(fixture + "/__fixture/events")).json();
  const event = events.findLast((x) => x.path === "/api/farmer/register");
  assert.match(event.raw, /name="land_location"/);
  assert.match(event.raw, /filename="fixture.png"/);
  assert.doesNotMatch(event.raw, /name="(?:password|otp)"/);
});
test("admin approval distinguishes mail failure from approval; resend can recover", async () => {
  const cookie = await login("admin");
  const response = await call(
    "/api/backend/api/admin/requests/request-farmer/approve",
    { cookie, method: "POST" },
  );
  const { data } = await response.json();
  assert.equal(data.status, "approved");
  assert.equal(data.email_sent, false);
  const retry = await call(
    "/api/backend/api/admin/requests/request-farmer/send-credentials",
    { cookie, method: "POST" },
  );
  assert.equal((await retry.json()).data.email_sent, true);
});
test("buyer interest and permitted contact use documented payloads", async () => {
  const cookie = await login("buyer");
  let response = await call(
    "/api/backend/api/buyer/crops/crop-wheat/interest",
    { cookie, method: "POST", body: { rating: 5, notes: "UI fixture note" } },
  );
  assert.equal(response.status, 200);
  response = await call("/api/backend/api/buyer/calls/initiate", {
    cookie,
    method: "POST",
    body: { farmer_id: "fixture-farmer", crop_id: "crop-wheat" },
  });
  assert.equal((await response.json()).data.call_status, "permitted");
});
test("password recovery and reset forward token_hash and new password", async () => {
  let response = await call("/api/backend/api/farmer/forgot-password", {
    method: "POST",
    body: { email: "farmer@example.com" },
  });
  assert.equal(response.status, 200);
  response = await call("/api/backend/api/farmer/reset-password", {
    method: "POST",
    body: { token_hash: "fixture-recovery", password: "Fixture-new@123" },
  });
  assert.equal(response.status, 200);
});
test("password change and logout clear browser cookies", async () => {
  const cookie = await login("farmer");
  let response = await call("/api/backend/api/farmer/change-password", {
    cookie,
    method: "POST",
    body: { current_password: "Fixture-only@123", password: "Fixture-new@123" },
  });
  assert.ok(response.headers.getSetCookie().every((x) => /Max-Age=0/.test(x)));
  response = await call("/api/session", { cookie, method: "DELETE" });
  assert.equal(response.headers.getSetCookie().length, 3);
});
test("same public origin is accepted even when Next normalizes localhost", async () => {
  const response = await call("/api/backend/api/farmer/forgot-password", {
    method: "POST",
    origin: base,
    body: { email: "farmer@example.com" },
  });
  assert.equal(response.status, 200);
});
test("cross-origin mutations are refused before forwarding", async () => {
  const response = await call("/api/backend/api/farmer/register", {
    method: "POST",
    origin: "https://untrusted.example",
    body: {},
  });
  assert.equal(response.status, 403);
  const logout = await call("/api/session", {
    method: "DELETE",
    origin: "https://untrusted.example",
  });
  assert.equal(logout.status, 403);
});
test("proxy rejects paths outside role APIs and expires invalid sessions", async () => {
  let response = await call("/api/backend/anything");
  assert.equal(response.status, 404);
  response = await call("/api/backend/api/farmer/crops", {
    cookie: "sm_role=farmer; sm_access=invalid",
  });
  assert.equal(response.status, 401);
  assert.ok(response.headers.getSetCookie().every((x) => /Max-Age=0/.test(x)));
  response = await call("/api/session", {
    cookie: "sm_role=farmer; sm_access=invalid",
  });
  assert.equal((await response.json()).user, null);
});
