const assert = require("node:assert/strict");
const { test } = require("node:test");
const { capacityTransaction, capacityConflict, paidRegistrationStatus } = require("../lib/events/capacity.ts");

test("a second allocation from the same event revision cannot write a registration", async () => {
  let revision = "initial";
  const registrations = [];
  const client = {
    transaction() {
      let expectedRevision;
      let document;
      return {
        patch(_id, configure) {
          configure({
            ifRevisionId(value) {
              expectedRevision = value;
              return this;
            },
            set() {
              return this;
            },
          });
          return this;
        },
        create(value) {
          document = value;
          return this;
        },
        async commit() {
          if (revision !== expectedRevision)
            throw Object.assign(new Error("Revision conflict"), { statusCode: 409 });
          revision = "updated";
          registrations.push(document);
        },
      };
    },
  };

  const first = capacityTransaction(client, "event", revision).create("first");
  const second = capacityTransaction(client, "event", revision).create("second");
  await first.commit();
  await assert.rejects(second.commit(), capacityConflict);
  assert.deepEqual(registrations, ["first"]);
});

test("a paid reservation keeps its seat only while the hold is active", () => {
  const now = "2026-11-14T17:00:00.000Z";
  const full = { capacity: 20, occupied: 20 };
  const pending = { status: "pending-payment", paymentStatus: "pending" };

  assert.equal(paidRegistrationStatus({
    ...pending, reservationExpiresAt: "2026-11-14T17:00:01.000Z",
  }, full, now), "confirmed");
  assert.equal(paidRegistrationStatus({
    ...pending, reservationExpiresAt: now,
  }, full, now), "waitlist");
  assert.equal(paidRegistrationStatus(pending, { capacity: 20, occupied: 19 }, now), "confirmed");
  assert.equal(paidRegistrationStatus({ status: "cancelled" }, full, now), "waitlist");
  assert.equal(paidRegistrationStatus({ status: "checked-in" }, full, now), "checked-in");
});
