const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function fixture() {
  const modules = new Map();
  const messages = [];
  let failSend = false;
  const record = {
    _id: "registration",
    _rev: "1",
    status: "confirmed",
    paymentStatus: "paid",
    ticketCode: "TEST-TICKET",
    firstName: "Test",
    email: "guest@example.test",
  };
  const event = { title: "Test event", date: "2026-11-14", time: "19:00" };
  const store = {
    async fetch() {
      return [{ ...record, event }];
    },
    async getDocument() {
      return { ...record };
    },
    patch() {
      let revision, update;
      return {
        ifRevisionId(value) {
          revision = value;
          return this;
        },
        set(value) {
          update = value;
          return this;
        },
        async commit() {
          if (revision && revision !== record._rev)
            throw Object.assign(new Error("Conflict"), { statusCode: 409 });
          Object.assign(record, update, {
            _rev: String(Number(record._rev) + 1),
          });
        },
      };
    },
  };
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const loadedModule = { exports: {} };
    const filename = path.join(__dirname, "..", "lib", "email", name + ".ts");
    const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    new Function("require", "module", "exports", js)(
      (dependency) => {
        if (dependency === "node:timers/promises") return require(dependency);
        if (dependency === "server-only") return {};
        if (dependency === "./ticketDeliveryStore")
          return { ticketDeliveryStore: () => store };
        if (dependency === "qrcode")
          return { toBuffer: async () => Buffer.from("fake-qr") };
        if (dependency.startsWith("@/lib/events/"))
          return {
            createCancellationToken: () => "cancel-token",
            createPayOnSiteToken: () => "pay-token",
          };
        if (dependency === "resend")
          return {
            Resend: class {
              emails = {
                send: async (message, options) => {
                  messages.push({ ...message, ...options });
                  return failSend
                    ? { error: { name: "test-error" } }
                    : { data: { id: "email-id" } };
                },
              };
            },
          };
        return load(dependency.replace(/^\.\//, ""));
      },
      loadedModule,
      loadedModule.exports,
    );
    modules.set(name, loadedModule.exports);
    return loadedModule.exports;
  }
  const send = (extra = {}) =>
    load("sendEventRegistrationEmail").sendEventRegistrationEmail({
      registrationId: record._id,
      ticketCode: record.ticketCode,
      status: "confirmed",
      firstName: record.firstName,
      email: record.email,
      eventTitle: event.title,
      date: event.date,
      time: event.time,
      ...extra,
    });
  return {
    load,
    record,
    event,
    messages,
    send,
    fail: (value) => {
      failSend = value;
    },
  };
}

test("Prague event time respects DST and rejects invalid local times", () => {
  const { eventStart } = fixture().load("eventTicketTiming");
  assert.equal(
    eventStart("2026-07-10", "19:00"),
    Date.parse("2026-07-10T17:00Z"),
  );
  assert.equal(
    eventStart("2026-11-10", "9:00"),
    Date.parse("2026-11-10T08:00Z"),
  );
  assert.equal(eventStart("2026-03-29", "02:30"), null);
  assert.equal(eventStart("2026-02-30", "12:00"), null);
});

test("early confirmation has no QR; scheduler sends one ticket at the 24-hour boundary", async (t) => {
  process.env.RESEND_API_KEY = "test-only";
  process.env.RESEND_FROM_EMAIL = "test@example.test";
  t.mock.method(Date, "now", () => Date.parse("2026-11-10T16:00Z"));
  const { load, record, messages, send } = fixture();
  assert.equal(
    (await send({ paidAmount: 200, paidCurrency: "CZK" })).sent,
    true,
  );
  assert.match(messages[0].subject, /Payment confirmed/);
  assert.match(messages[0].text, /200 Kč/);
  assert.match(messages[0].text, /separate email/);
  assert.equal(messages[0].attachments, undefined);
  assert.equal(record.ticketEmailQueuedFor, record.ticketCode);

  const { sendDueEventTickets } = load("sendDueEventTickets");
  const due = Date.parse("2026-11-13T18:00Z");
  assert.equal((await sendDueEventTickets(due - 1)).sent, 0);
  assert.equal((await sendDueEventTickets(due)).sent, 1);
  assert.match(messages[1].subject, /Your QR ticket/);
  assert.equal(messages[1].attachments.length, 1);
  assert.notEqual(messages[1].idempotencyKey, messages[0].idempotencyKey);
  assert.equal((await sendDueEventTickets(due + 600_000)).sent, 0);
});

test("late registrations get a combined email; cancelled and refunded queues are skipped", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2026-11-14T16:00Z"));
  const { load, record, messages, send } = fixture();
  assert.equal((await send()).sent, true);
  assert.equal(messages[0].attachments.length, 1);
  assert.equal(record.ticketEmailSentFor, record.ticketCode);
  record.ticketEmailSentFor = undefined;
  record.ticketEmailQueuedFor = record.ticketCode;
  const { sendDueEventTickets } = load("sendDueEventTickets");
  record.status = "cancelled";
  assert.equal((await sendDueEventTickets()).due, 0);
  record.status = "confirmed";
  record.paymentStatus = "refunded";
  assert.equal((await sendDueEventTickets()).due, 0);
  assert.equal(messages.length, 1);
});

test("failed ticket delivery stays queued and retries with the same idempotency key", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2026-11-13T19:00Z"));
  const { load, record, messages, fail } = fixture();
  record.ticketEmailQueuedFor = record.ticketCode;
  const { sendDueEventTickets } = load("sendDueEventTickets");
  fail(true);
  assert.equal((await sendDueEventTickets()).failed, 1);
  assert.equal(record.ticketEmailSentFor, undefined);
  assert.equal((await sendDueEventTickets(Date.now() + 60_000)).due, 0);
  fail(false);
  assert.equal((await sendDueEventTickets(Date.now() + 300_000)).sent, 1);
  assert.equal(messages[0].idempotencyKey, messages[1].idempotencyKey);
});

test("early ticket stays queued when email configuration is missing", async (t) => {
  t.mock.method(Date, "now", () => Date.parse("2026-11-10T16:00Z"));
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  t.after(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  const { record, messages, send } = fixture();
  const result = await send();
  assert.equal(result.sent, false);
  assert.equal(result.reason, "not-configured");
  assert.equal(record.ticketEmailQueuedFor, record.ticketCode);
  assert.equal(messages.length, 0);
});
