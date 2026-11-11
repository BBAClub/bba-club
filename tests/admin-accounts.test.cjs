const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const TEST_PASSWORD = "test-only-password-phrase";
const root = path.resolve(__dirname, "..");
let jar, records, emails, sequence, mailError;
const clone = (value) => value && JSON.parse(JSON.stringify(value));
function put(doc) {
  const value = {
    _createdAt: new Date().toISOString(),
    ...clone(doc),
    _rev: String(++sequence),
  };
  records.set(value._id, value);
  return clone(value);
}
const conflict = () =>
  Object.assign(new Error("conflict"), { statusCode: 409 });
const database = {
  withConfig() {
    return this;
  },
  async getDocument(id) {
    return clone(records.get(id));
  },
  async createIfNotExists(doc) {
    return records.has(doc._id) ? clone(records.get(doc._id)) : put(doc);
  },
  async create(doc) {
    if (records.has(doc._id)) throw conflict();
    return put(doc);
  },
  async createOrReplace(doc) {
    return put(doc);
  },
  async fetch() {
    return [...records.values()]
      .filter((doc) => doc._type === "adminAccount")
      .map(clone);
  },
  patch(id) {
    let rev, updates;
    return {
      ifRevisionId(value) {
        rev = value;
        return this;
      },
      set(value) {
        updates = value;
        return this;
      },
      async commit() {
        const doc = records.get(id);
        if (!doc || doc._rev !== rev) throw conflict();
        return put({ ...doc, ...updates });
      },
    };
  },
};
const cache = new Map();
function load(relative) {
  let file = path.resolve(root, relative);
  if (!path.extname(file)) file += ".ts";
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const requireMock = (name) => {
    if (name === "server-only") return {};
    if (name === "next/headers")
      return {
        cookies: async () => ({
          get: (key) => (jar.has(key) ? { value: jar.get(key) } : undefined),
          set: (key, value) => (value ? jar.set(key, value) : jar.delete(key)),
        }),
      };
    if (name === "next/navigation")
      return {
        redirect(destination) {
          throw new Error(`REDIRECT:${destination}`);
        },
      };
    if (name === "next/server")
      return {
        NextResponse: { json: (body, options) => Response.json(body, options) },
      };
    if (name === "resend")
      return {
        Resend: class {
          emails = {
            send: async (mail) => {
              emails.push(mail);
              return { error: mailError };
            },
          };
        },
      };
    if (name === "@/sanity/lib/client") return { client: database };
    if (name.startsWith("@/")) return load(name.slice(2));
    if (name.startsWith("."))
      return load(path.relative(root, path.resolve(path.dirname(file), name)));
    return require(name);
  };
  new Function("require", "module", "exports", js)(
    requireMock,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
const accounts = load("lib/admin/accounts");
const security = load("lib/admin/security");
const auth = load("lib/admin/auth");
const destination = load("lib/admin/destination");
const latestCode = () => emails.at(-1).text.match(/code is: (\d{8})/)[1];
async function signIn(email = "member@vse.cz") {
  await accounts.requestCode(email, "Test Member");
  return accounts.verifyCode(latestCode(), TEST_PASSWORD);
}
beforeEach(() => {
  jar = new Map();
  records = new Map();
  emails = [];
  sequence = 0;
  mailError = null;
  process.env.ADMIN_ACCOUNTS_ENABLED = "true";
  process.env.ADMIN_SESSION_SECRET =
    "test-only-secret-which-is-at-least-32-characters";
  process.env.ADMIN_BOOTSTRAP_EMAIL = "owner@vse.cz";
  process.env.SANITY_API_WRITE_TOKEN = "mock";
  process.env.RESEND_API_KEY = "mock";
  process.env.RESEND_FROM_EMAIL = "mock@example.test";
  process.env.NEXT_PUBLIC_SITE_URL = "https://club.example";
});
test("only exact school domain, normalized email; no subdomain or suffix bypass", () => {
  assert.equal(security.schoolEmail(" MEMBER@VSE.CZ "), "member@vse.cz");
  for (const email of [
    "x@vse.cz.evil.test",
    "x@fakevse.cz",
    "x@students.vse.cz",
    "x@@vse.cz",
    "x@vse.cz\nBcc:foo",
    null,
  ])
    assert.equal(security.schoolEmail(email), null);
});
test("encrypted records are authenticated and bound to their document", () => {
  const token = security.seal("account-a", { email: "member@vse.cz" });
  assert.deepEqual(security.unseal("account-a", token), {
    email: "member@vse.cz",
  });
  assert.throws(() => security.unseal("account-b", token));
  const bytes = Buffer.from(token, "base64url");
  bytes[30] ^= 1;
  assert.throws(() =>
    security.unseal("account-a", bytes.toString("base64url")),
  );
});
test("new verified account is pending and cannot use any admin permission", async () => {
  const user = await signIn();
  assert.equal(user.status, "pending");
  assert.equal(user.role, "member");
  assert.equal(await auth.isAdminAuthenticated(), false);
  await assert.rejects(
    () => auth.requireAdminPermission("places"),
    /REDIRECT:\/admin\/account/,
  );
  for (const doc of records.values()) {
    assert.ok(doc._id.includes("."));
    assert.equal(JSON.stringify(doc).includes("member@vse.cz"), false);
  }
});
test("only configured verified owner bootstraps; arbitrary first registrant does not", async () => {
  const member = await signIn();
  assert.equal(member.role, "member");
  const owner = await signIn("owner@vse.cz");
  assert.equal(owner.status, "active");
  assert.equal(owner.role, "administrator");
  assert.equal(await auth.isAdminAuthenticated("places"), true);
});
test("code requires the same browser; replay is rejected", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  const code = latestCode(),
    original = jar;
  jar = new Map();
  await assert.rejects(
    () => accounts.verifyCode(code, TEST_PASSWORD),
    /browser/,
  );
  jar = original;
  await accounts.verifyCode(code, TEST_PASSWORD);
  await assert.rejects(
    () => accounts.verifyCode(code, TEST_PASSWORD),
    /browser/,
  );
});
test("five incorrect codes exhaust challenge, including subsequent correct code", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  const code = latestCode();
  const wrong = code === "00000000" ? "00000001" : "00000000";
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      () => accounts.verifyCode(wrong, TEST_PASSWORD),
      /Incorrect/,
    );
  await assert.rejects(
    () => accounts.verifyCode(code, TEST_PASSWORD),
    /expired or unavailable/,
  );
});
test("expired challenge cannot create an account", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  const code = latestCode();
  const doc = [...records.values()].find(
    (doc) => doc._type === "adminChallenge",
  );
  const challenge = security.unseal(doc._id, doc.payload);
  challenge.expiresAt = Date.now() - 1;
  put({ ...doc, payload: security.seal(doc._id, challenge) });
  await assert.rejects(
    () => accounts.verifyCode(code, TEST_PASSWORD),
    /expired/,
  );
  assert.equal((await accounts.listAccounts()).length, 0);
});
test("concurrent verification consumes the code once using revision locking", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  const code = latestCode();
  const results = await Promise.allSettled([
    accounts.verifyCode(code, TEST_PASSWORD),
    accounts.verifyCode(code, TEST_PASSWORD),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await accounts.listAccounts()).length, 1);
});
test("durable cooldown prevents repeat emails", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  await assert.rejects(
    () => accounts.requestCode("member@vse.cz", "Member"),
    (e) => e.status === 429,
  );
  assert.equal(emails.length, 1);
});
test("send failure never reports success or sets challenge cookie", async () => {
  mailError = { message: "provider failure" };
  await assert.rejects(
    () => accounts.requestCode("member@vse.cz", "Member"),
    (e) => e.status === 503,
  );
  assert.equal(jar.has("bba_admin_challenge"), false);
});
test("approval, permission isolation, account disable and re-enable invalidate old sessions", async () => {
  const member = await signIn();
  const memberJar = new Map(jar);
  const owner = await signIn("owner@vse.cz");
  let approved = await accounts.updateAccount(owner, {
    id: member.id,
    revision: member.sessionVersion,
    status: "active",
    role: "member",
    permissions: ["places"],
  });
  jar = memberJar;
  assert.equal(await accounts.currentAccount(), null);
  await accounts.issueSession(approved);
  assert.equal(await auth.isAdminAuthenticated("places"), true);
  assert.equal(await auth.isAdminAuthenticated("events"), false);
  await assert.rejects(
    () => auth.requireAdminPermission("users"),
    /access=denied/,
  );
  const oldSession = new Map(jar);
  const disabled = await accounts.updateAccount(owner, {
    id: member.id,
    revision: approved.sessionVersion,
    status: "disabled",
    role: "member",
    permissions: ["places"],
  });
  assert.equal(await accounts.currentAccount(), null);
  await accounts.updateAccount(owner, {
    id: member.id,
    revision: disabled.sessionVersion,
    status: "active",
    role: "member",
    permissions: ["places"],
  });
  jar = oldSession;
  assert.equal(await accounts.currentAccount(), null);
});
test("members cannot change account access or escalate themselves", async () => {
  const member = await signIn();
  await assert.rejects(
    () =>
      accounts.updateAccount(member, {
        id: member.id,
        revision: 1,
        status: "active",
        role: "administrator",
        permissions: [],
      }),
    (e) => e.status === 403,
  );
  const route = load("app/api/admin/users/route");
  const result = await route.PATCH(
    new Request("https://club.example/api/admin/users", {
      method: "PATCH",
      headers: {
        origin: "https://club.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ id: member.id, role: "administrator" }),
    }),
  );
  assert.equal(result.status, 403);
});
test("own access and primary administrator cannot be demoted", async () => {
  const owner = await signIn("owner@vse.cz");
  await assert.rejects(
    () =>
      accounts.updateAccount(owner, {
        id: owner.id,
        revision: 1,
        status: "disabled",
        role: "member",
        permissions: [],
      }),
    /own access/,
  );
});
test("request origin and destination reject cross-site or redirect injection", () => {
  assert.equal(
    security.trustedRequest(
      new Request("https://club.example/api", {
        headers: { origin: "https://evil.test" },
      }),
    ),
    false,
  );
  assert.equal(
    security.trustedRequest(new Request("https://club.example/api")),
    false,
  );
  assert.equal(
    security.trustedRequest(
      new Request("https://club.example/api", {
        headers: { origin: "https://club.example" },
      }),
    ),
    true,
  );
  for (const value of [
    "//evil.test",
    "/\\evil.test",
    "/admin/\nfoo",
    "https://evil.test",
  ])
    assert.equal(destination.safeDestination(value), "/admin");
  assert.equal(destination.safeDestination("/admin/places"), "/admin/places");
});
test("legacy cookie cannot authenticate when individual accounts are enabled", async () => {
  await auth.createAdminSession();
  assert.equal(await auth.isAdminAuthenticated(), false);
});
test("login and verify routes complete the email flow without production network", async () => {
  const login = load("app/api/admin/login/route"),
    verify = load("app/api/admin/verify/route");
  const req = (url, body) =>
    new Request(`https://club.example${url}`, {
      method: "POST",
      headers: {
        origin: "https://club.example",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (
      await login.POST(
        req("/api/admin/login", {
          action: "register",
          email: "owner@vse.cz",
          name: "Owner",
        }),
      )
    ).status,
    200,
  );
  const result = await verify.POST(
    req("/api/admin/verify", { code: latestCode(), password: TEST_PASSWORD }),
  );
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "active");
});

function latestReset() {
  const match = emails
    .at(-1)
    .text.match(/#(adminPasswordResets\.[a-f0-9]{64}):([a-f0-9]{64})/);
  assert.ok(match);
  return { id: match[1], token: match[2] };
}
test("password login requires the correct password and never exposes its hash", async () => {
  const owner = await signIn("owner@vse.cz");
  jar = new Map();
  await assert.rejects(
    () => accounts.passwordSignIn("owner@vse.cz", "incorrect-password"),
    (e) => e.status === 401,
  );
  const signedIn = await accounts.passwordSignIn(
    " OWNER@VSE.CZ ",
    TEST_PASSWORD,
  );
  assert.equal(signedIn.id, owner.id);
  assert.equal("passwordHash" in signedIn, false);
  assert.equal("passwordHash" in (await accounts.currentAccount()), false);
  assert.equal(
    JSON.stringify(await accounts.listAccounts()).includes("scrypt-v1"),
    false,
  );
  assert.equal(
    JSON.stringify(await accounts.listAccounts()).includes(TEST_PASSWORD),
    false,
  );
});
test("registration rejects weak passwords without consuming email verification", async () => {
  await accounts.requestCode("member@vse.cz", "Member");
  const code = latestCode();
  await assert.rejects(() => accounts.verifyCode(code, "short"), /12–128/);
  const member = await accounts.verifyCode(code, TEST_PASSWORD);
  assert.equal(member.status, "pending");
});
test("email registration cannot overwrite an existing password or bypass sign-in", async () => {
  const owner = await signIn("owner@vse.cz");
  // Allow another email request without waiting for a real rate-limit window.
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  jar = new Map();
  await accounts.requestCode(owner.email, "Another Name");
  await assert.rejects(
    () => accounts.verifyCode(latestCode(), "replacement-password"),
    /already has a password/,
  );
  assert.equal(await accounts.currentAccount(), null);
  await accounts.passwordSignIn(owner.email, TEST_PASSWORD);
});
test("password reset works once, preserves permissions, revokes old sessions and password", async () => {
  const owner = await signIn("owner@vse.cz");
  const oldJar = new Map(jar);
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(owner.email);
  const reset = latestReset();
  assert.ok(
    emails.at(-1).text.includes("https://club.example/admin/reset-password#"),
  );
  assert.equal((await accounts.currentAccount()).id, owner.id); // Requesting link changes no account state.
  await accounts.resetPassword(
    reset.id,
    reset.token,
    "new-test-password-phrase",
  );
  jar = oldJar;
  assert.equal(await accounts.currentAccount(), null);
  await assert.rejects(
    () => accounts.resetPassword(reset.id, reset.token, TEST_PASSWORD),
    /expired or has already/,
  );
  await assert.rejects(
    () => accounts.passwordSignIn(owner.email, TEST_PASSWORD),
    (e) => e.status === 401,
  );
  const updated = await accounts.passwordSignIn(
    owner.email,
    "new-test-password-phrase",
  );
  assert.equal(updated.role, "administrator");
  assert.equal(updated.status, "active");
});
test("invalid, expired and superseded password links are rejected", async () => {
  const member = await signIn();
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(member.email);
  const first = latestReset();
  await assert.rejects(
    () => accounts.resetPassword(first.id, "0".repeat(64), TEST_PASSWORD),
    /expired or has already/,
  );
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(member.email);
  const second = latestReset();
  await assert.rejects(
    () => accounts.resetPassword(first.id, first.token, TEST_PASSWORD),
    /expired or has already/,
  );
  const doc = records.get(second.id),
    reset = security.unseal(doc._id, doc.payload);
  reset.expiresAt = Date.now() - 1;
  put({ ...doc, payload: security.seal(doc._id, reset) });
  await assert.rejects(
    () => accounts.resetPassword(second.id, second.token, TEST_PASSWORD),
    /expired or has already/,
  );
});
test("recovery creates no account for an unknown email", async () => {
  await accounts.requestPasswordReset("unknown@vse.cz");
  assert.equal(emails.length, 0);
  assert.equal((await accounts.listAccounts()).length, 0);
});
test("reset cannot approve a pending account or restore a disabled account", async () => {
  const member = await signIn();
  const owner = await signIn("owner@vse.cz");
  await accounts.updateAccount(owner, {
    id: member.id,
    revision: member.sessionVersion,
    status: "disabled",
    role: "member",
    permissions: ["places"],
  });
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(member.email);
  const reset = latestReset();
  await accounts.resetPassword(
    reset.id,
    reset.token,
    "new-test-password-phrase",
  );
  const account = await accounts.passwordSignIn(
    member.email,
    "new-test-password-phrase",
  );
  assert.equal(account.status, "disabled");
  assert.deepEqual(account.permissions, ["places"]);
  assert.equal(await auth.isAdminAuthenticated("places"), false);
});
test("concurrent password reset consumes a link only once", async () => {
  const member = await signIn();
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(member.email);
  const reset = latestReset();
  const results = await Promise.allSettled([
    accounts.resetPassword(reset.id, reset.token, "new-test-password-one"),
    accounts.resetPassword(reset.id, reset.token, "new-test-password-two"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
});
test("reset supports a verified account created before passwords existed", async () => {
  const member = await signIn();
  const doc = records.get(member.id),
    stored = security.unseal(doc._id, doc.payload);
  delete stored.passwordHash;
  put({ ...doc, payload: security.seal(doc._id, stored) });
  for (const doc of records.values())
    if (doc._type === "adminRate") doc.resetAt = 0;
  await accounts.requestPasswordReset(member.email);
  const reset = latestReset();
  await accounts.resetPassword(reset.id, reset.token, TEST_PASSWORD);
  const account = await accounts.passwordSignIn(member.email, TEST_PASSWORD);
  assert.equal(account.id, member.id);
  assert.equal(account.status, "pending");
});

test("Tasks API denies unauthenticated and pending accounts", async () => {
  const route = load("app/api/admin/tasks/route");
  const request = () =>
    new Request("https://club.example/api/admin/tasks", {
      method: "POST",
      headers: {
        origin: "https://club.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "create", title: "Denied task" }),
    });
  assert.equal((await route.POST(request())).status, 403);
  await signIn();
  assert.equal((await route.POST(request())).status, 403);
  assert.ok(![...records.values()].some((doc) => doc._type === "adminTask"));
});

test("Tasks accepts an eligible assignee and rejects stale moves and invalid dates", async () => {
  const { saveTask } = load("lib/admin/tasks");
  const pending = await signIn();
  const owner = await signIn("owner@vse.cz");
  const { pragueDate } = load("lib/admin/task-types");
  const today = pragueDate();
  const old = new Date(today + "T00:00:00Z");
  old.setUTCDate(old.getUTCDate() - 14);
  const tooOld = old.toISOString().slice(0, 10);
  old.setUTCDate(old.getUTCDate() + 1);
  put({
    _id: "recent-event",
    _type: "event",
    date: old.toISOString().slice(0, 10),
  });
  put({ _id: "old-event", _type: "event", date: tooOld });
  put({ _id: "today-event", _type: "event", date: today });
  const fields = {
    action: "create",
    title: "Prepare launch",
    description: "",
    eventId: "recent-event",
    assigneeId: owner.id,
    dueDate: "2026-11-30",
    priority: "high",
    status: "todo",
  };
  await assert.rejects(
    () => saveTask({ ...fields, assigneeId: pending.id }),
    /active member/,
  );
  await assert.rejects(
    () => saveTask({ ...fields, dueDate: "2026-02-30" }),
    /valid due date/,
  );
  await assert.rejects(
    () => saveTask({ ...fields, eventId: "old-event" }),
    /less than 14 days/,
  );
  const { task } = await saveTask(fields);
  assert.equal(task.eventId, "recent-event");
  put({ ...records.get(task._id), _createdAt: "2025-01-01T12:00:00Z" });
  const historical = records.get(task._id);
  const { task: edited } = await saveTask({
    ...fields,
    action: "edit",
    id: task._id,
    revision: historical._rev,
    eventId: "old-event",
  });
  assert.equal(edited.eventId, "old-event");
  const move = {
    action: "move",
    id: task._id,
    revision: edited._rev,
    status: "review",
  };
  assert.equal((await saveTask(move)).task.status, "review");
  await assert.rejects(
    () => saveTask(move),
    (error) => error.status === 409,
  );
});
