// Isolated UI-test backend. It never uses production credentials, persists data,
// sends mail, or connects to Supabase. Explicitly start it for local testing only.
import http from "node:http";
import { pathToFileURL } from "node:url";
export function createFixtureServer() {
  const now = "2026-10-26T05:00:00.000Z";
  const profiles = Object.fromEntries(
    ["admin", "farmer", "buyer"].map((role) => [
      role,
      {
        id: `fixture-${role}`,
        full_name:
          role === "admin"
            ? "Aarav Admin"
            : role === "farmer"
              ? "Meera Patil"
              : "Rohan Shah",
        email: `${role}@example.com`,
        role,
        is_approved: true,
        mobile_number: "0000000000",
        city: "Nashik",
        state: "Maharashtra",
        full_address: "Sample address for local testing only",
        land_location: "Sample farm for local testing only",
        preferred_language: "en",
        is_call_available: true,
        must_change_password: false,
        created_at: now,
      },
    ]),
  );
  let requests = [
    {
      ...profiles.farmer,
      id: "request-farmer",
      full_name: "Kavita Deshmukh",
      email: "farmer-applicant@example.com",
      status: "pending",
      credentials_email_status: "pending",
    },
    {
      ...profiles.buyer,
      id: "request-buyer",
      full_name: "Arjun Trading",
      email: "buyer-applicant@example.com",
      status: "pending",
      credentials_email_status: "pending",
    },
  ];
  let crops = [
    {
      id: "crop-wheat",
      farmer_id: profiles.farmer.id,
      crop_name: "Golden wheat",
      crop_type: "organic",
      quantity: 250,
      quantity_unit: "kg",
      price: 32,
      description: "Local UI fixture crop. This is not a real sale listing.",
      photos: [],
      status: "available",
      created_at: now,
      farmer: profiles.farmer,
      average_rating: 4,
      total_ratings: 1,
    },
    {
      id: "crop-basil",
      farmer_id: profiles.farmer.id,
      crop_name: "Fresh basil leaves",
      crop_type: "inorganic",
      quantity: 45,
      quantity_unit: "kg",
      price: 120,
      photos: [],
      status: "available",
      created_at: now,
      farmer: profiles.farmer,
    },
  ];
  let interests = [
    {
      id: "interest-one",
      interest_id: "interest-one",
      crop_id: "crop-wheat",
      crop_name: "Golden wheat",
      rating: 4,
      notes: "Interested in discussing the next harvest.",
      created_at: now,
      buyer: profiles.buyer,
      farmer: profiles.farmer,
      crop: crops[0],
    },
  ];
  const events = [];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://fixture.local");
    const path = url.pathname;
    const parts = path.split("/").filter(Boolean);
    const role = parts[1];
    const send = (data, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {}
    events.push({
      path,
      method: req.method,
      body,
      raw,
      authorization: req.headers.authorization,
    });
    if (path === "/__fixture/events") return send(events);
    if (path === "/__fixture/reset") {
      events.length = 0;
      return send({ success: true });
    }
    if (!profiles[role])
      return send(
        { success: false, message: "Fixture endpoint not found" },
        404,
      );
    if (parts[2] === "__fixture")
      return send({ fixture: "setumoolya-local-ui-test" });
    if (parts[2] === "login") {
      if (body.password !== "Fixture-only@123")
        return send(
          { success: false, message: "Invalid login credentials." },
          401,
        );
      const user = { ...profiles[role] };
      if (body.email === "temporary@example.com")
        user.must_change_password = true;
      return send({
        success: true,
        data: {
          token: `fixture-access-${role}`,
          refreshToken: "fixture-refresh-secret",
          expiresIn: 3600,
          must_change_password: user.must_change_password,
          ...(role === "admin" ? { admin: user } : { user }),
        },
      });
    }
    if (parts[2] === "register")
      return send(
        {
          success: true,
          data: {
            request_id: `registered-${role}`,
            email: `${role}@example.com`,
            full_name: "UI Test Applicant",
            status: "pending",
          },
        },
        201,
      );
    if (["forgot-password", "reset-password"].includes(parts[2]))
      return send({
        success: true,
        message:
          parts[2] === "forgot-password"
            ? "If an approved account matches this email, a password reset link will be emailed to it."
            : "Password updated.",
      });
    if (req.headers.authorization !== `Bearer fixture-access-${role}`)
      return send({ success: false, message: "Your session has ended." }, 401);
    if (parts[2] === "profile") {
      if (req.method === "PATCH" || req.method === "PUT") {
        if (body?.preferred_language) profiles[role].preferred_language = body.preferred_language;
        return send({ success: true, message: "Profile updated.", data: profiles[role] });
      }
      return send({ success: true, data: profiles[role] });
    }
    if (parts[2] === "change-password")
      return send({ success: true, message: "Password changed." });
    if (parts[2] === "availability") {
      profiles[role].is_call_available = body.is_call_available;
      return send({
        success: true,
        data: { is_call_available: body.is_call_available },
      });
    }
    if (role === "admin" && ["dashboard", "requests"].includes(parts[2])) {
      const item = requests.find((x) => x.id === parts[3]);
      if (parts[4]) {
        if (!item) return send({ success: false, message: "Not found" }, 404);
        if (parts[4] === "reject") {
          item.status = "rejected";
          item.rejection_reason = body.reason;
          return send({ success: true, data: item });
        }
        item.status = "approved";
        item.credentials_email_status =
          parts[4] === "approve" ? "failed" : "sent";
        return send({
          success: true,
          data: {
            request_id: item.id,
            role: item.role,
            full_name: item.full_name,
            status: item.status,
            login_id: item.email,
            user_id: `approved-${item.id}`,
            email_sent: parts[4] !== "approve",
            credentials_email_status: item.credentials_email_status,
            can_resend_credentials: true,
          },
        });
      }
      if (item) {
        if (req.method === "PATCH") item.email = body.email;
        return send({ success: true, data: item });
      }
      const list = requests.filter(
        (x) =>
          (!url.searchParams.get("role") ||
            x.role === url.searchParams.get("role")) &&
          (!url.searchParams.get("status") ||
            url.searchParams.get("status") === "all" ||
            x.status === url.searchParams.get("status")),
      );
      return send({
        success: true,
        data: {
          requests: list,
          pagination: { total: list.length, page: 1, totalPages: 1, limit: 12 },
        },
      });
    }
    if (parts[2] === "users") {
      const users = [profiles[url.searchParams.get("role") || "farmer"]];
      return send({
        success: true,
        data: { users, total: 1, page: 1, totalPages: 1 },
      });
    }
    if (parts[2] === "call-logs")
      return send({
        success: true,
        data: [
          {
            id: "fixture-call",
            caller_id: "fixture-buyer",
            receiver_id: "fixture-farmer",
            caller_role: "buyer",
            receiver_role: "farmer",
            status: "permitted",
            created_at: now,
          },
        ],
      });
    if (parts[2] === "calls")
      return send({
        success: true,
        data: {
          receiver_name:
            role === "buyer"
              ? profiles.farmer.full_name
              : profiles.buyer.full_name,
          receiver_phone: "0000000000",
          call_status: "permitted",
          receiver_role: role === "buyer" ? "farmer" : "buyer",
        },
      });
    if (parts[2] === "interests")
      return send({ success: true, data: interests });
    if (parts[2] === "crops") {
      const crop = crops.find((x) => x.id === parts[3]);
      if (parts[4] === "interest") {
        interests[0] = {
          ...interests[0],
          rating: body.rating,
          notes: body.notes,
        };
        return send({
          success: true,
          message: "Your interest has been shared.",
          data: { interest: interests[0] },
        });
      }
      if (req.method === "DELETE") {
        crops = crops.filter((x) => x.id !== parts[3]);
        return send({ success: true });
      }
      if (req.method === "POST")
        return send({ success: true, data: { id: "fixture-new-crop" } }, 201);
      if (parts[3])
        return crop
          ? send({ success: true, data: crop })
          : send({ success: false, message: "Crop not found." }, 404);
      return send({
        success: true,
        data: crops.filter(
          (x) =>
            (!url.searchParams.get("search") ||
              x.crop_name
                .toLowerCase()
                .includes(url.searchParams.get("search").toLowerCase())) &&
            (!url.searchParams.get("crop_type") ||
              x.crop_type === url.searchParams.get("crop_type")),
        ),
      });
    }
    send({ success: false, message: "Fixture endpoint not found." }, 404);
  });
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = createFixtureServer();
  server.listen(5101, "127.0.0.1", () =>
    console.log(
      "Local fixture backend on http://127.0.0.1:5101 — no live accounts or email",
    ),
  );
}
