import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvent } from "../server/events/EventNormalizer.js";
import { mapTikTokEvent } from "../server/tiktok/TikTokEventMapper.js";
import { ViewerRegistry } from "../server/viewers/ViewerRegistry.js";
import { EventGateway } from "../server/websocket/EventGateway.js";
import { EventBus } from "../game/events/EventBus.js";
import { RecentEvents } from "../game/events/RecentEvents.js";
import { GiftManager } from "../game/gifts/GiftManager.js";
const event = (type = "COMMENT", data = { message: "oi" }, extra = {}) => ({
  type,
  userId: "123",
  username: "@Maria",
  data,
  ...extra,
});

test("normalizer validates identity/text, finite counts and strips untrusted fields", () => {
  assert.equal(normalizeEvent(event("BOGUS")), null);
  assert.equal(normalizeEvent(event("COMMENT", { message: " " })), null);
  assert.equal(normalizeEvent(event("JOIN", {}, { userId: "" })), null);
  const value = normalizeEvent(
    event("COMMENT", { message: "x".repeat(1000), secret: "never" }),
  );
  assert.equal(value.data.message.length, 200);
  assert.deepEqual(Object.keys(value.data), ["message"]);
  assert.equal(
    normalizeEvent(event("LIKE", { count: Infinity })).data.count,
    1,
  );
  assert.equal(
    normalizeEvent(event("GIFT", { giftName: "Unknown" })).data.diamondCount,
    null,
  );
});
test("TikTok mapper preserves current 2.5 fields and does not use username as userId", () => {
  const user = { userId: 1234567890123456789n, uniqueId: "Maria" };
  const gift = mapTikTokEvent("GIFT", {
    user,
    giftId: 5655,
    repeatCount: 3,
    repeatEnd: true,
    groupId: "combo-1",
    common: { msgId: 7n },
    giftDetails: { giftType: 1, giftName: "Rose", diamondCount: 1 },
  });
  assert.equal(gift.userId, "1234567890123456789");
  assert.equal(gift.eventId, "7");
  assert.equal(gift.username, "@Maria");
  assert.deepEqual(gift.data, {
    giftId: "5655",
    giftName: "Rose",
    quantity: 3,
    repeatCount: 3,
    repeatEnd: true,
    giftType: 1,
    groupId: "combo-1",
    diamondCount: 1,
  });
  assert.equal(
    mapTikTokEvent("COMMENT", { user: { uniqueId: "Maria" }, comment: "oi" }),
    null,
  );
});
test("gateway first interaction registers one viewer; usernames are visual only", () => {
  const output = [];
  const gateway = new EventGateway({ broadcast: (e) => output.push(e) });
  for (const type of ["COMMENT", "LIKE", "FOLLOW", "SHARE", "GIFT"])
    assert.equal(
      gateway.publish(event(type, { message: "oi", giftName: "Rose" })),
      true,
    );
  gateway.publish(
    event("COMMENT", { message: "novo" }, { username: "@new-name" }),
  );
  gateway.publish(
    event(
      "COMMENT",
      { message: "same name" },
      { userId: "456", username: "@new-name" },
    ),
  );
  assert.equal(gateway.registry.size, 2);
  assert.equal(gateway.registry.viewers.get("123").username, "@new-name");
  assert.equal(output.length, 7);
  assert.ok(output.every((e) => e.data));
});
test("each valid first event registers a viewer without requiring JOIN", () => {
  for (const type of ["COMMENT", "LIKE", "FOLLOW", "SHARE", "GIFT"]) {
    const registry = new ViewerRegistry();
    const value = normalizeEvent(
      event(type, { message: "oi", giftName: "Rose" }),
    );
    assert.equal(registry.register(value).isNew, true);
    assert.equal(registry.register(value).isNew, false);
    assert.equal(registry.size, 1);
  }
});
test("replay IDs deduplicate but equal legitimate comments are retained", () => {
  const output = [];
  const gateway = new EventGateway({ broadcast: (e) => output.push(e) });
  assert.equal(
    gateway.publish(event("COMMENT", { message: "oi" }, { eventId: "same" })),
    true,
  );
  assert.equal(
    gateway.publish(event("COMMENT", { message: "oi" }, { eventId: "same" })),
    false,
  );
  assert.equal(
    gateway.publish(
      event("COMMENT", { message: "oi" }, { eventId: "different" }),
    ),
    true,
  );
  assert.equal(output.length, 2);
});
test("replay storage is bounded and expires entries", () => {
  let now = 0;
  const recent = new RecentEvents({ capacity: 2, ttl: 5, now: () => now });
  assert.ok(recent.accept("a"));
  assert.ok(recent.accept("b"));
  assert.equal(recent.accept("a"), false);
  recent.accept("c");
  assert.equal(recent.entries.size, 2);
  assert.ok(recent.accept("a"));
  now = 6;
  assert.ok(recent.accept("a"));
});
test("EventBus aggregates hundreds of likes, retains gifts and removes subscriptions", async () => {
  const bus = new EventBus();
  const seen = [];
  const unsub = bus.subscribe((e) => seen.push(e));
  for (let i = 0; i < 200; i++) bus.publish(event("LIKE", { count: 1 }));
  bus.publish(
    event("GIFT", { giftName: "Rose", quantity: 1 }, { eventId: "gift-a" }),
  );
  bus.publish(
    event("GIFT", { giftName: "Rose", quantity: 1 }, { eventId: "gift-b" }),
  );
  assert.equal(seen.length, 2);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(seen.filter((e) => e.type === "LIKE").length, 1);
  assert.equal(seen.find((e) => e.type === "LIKE").data.count, 200);
  unsub();
  bus.publish(event());
  assert.equal(seen.length, 3);
  bus.destroy();
  assert.equal(bus.pendingLikes.size, 0);
});
test("streak progress and final with same msgId are retained; total applies exactly once", () => {
  const bus = new EventBus();
  const applied = [];
  const manager = new GiftManager(bus, (e, c) => applied.push({ e, c }));
  const output = [];
  const gateway = new EventGateway({
    broadcast: (e) => {
      output.push(e);
      bus.publish(e);
    },
  });
  const data = {
    giftId: "5655",
    giftName: "Rose",
    giftType: 1,
    groupId: "streak-1",
  };
  gateway.publish(
    event(
      "GIFT",
      { ...data, repeatCount: 1, repeatEnd: false },
      { eventId: "same-message" },
    ),
  );
  gateway.publish(
    event(
      "GIFT",
      { ...data, repeatCount: 3, repeatEnd: false },
      { eventId: "same-message" },
    ),
  );
  assert.equal(applied.length, 0);
  gateway.publish(
    event(
      "GIFT",
      { ...data, repeatCount: 3, repeatEnd: true },
      { eventId: "same-message" },
    ),
  );
  gateway.publish(
    event(
      "GIFT",
      { ...data, repeatCount: 3, repeatEnd: true },
      { eventId: "another-final-id" },
    ),
  );
  assert.equal(output.length, 4);
  assert.equal(applied.length, 1);
  assert.equal(applied[0].e.data.quantity, 3);
  gateway.publish(
    event(
      "GIFT",
      { ...data, groupId: "streak-2", repeatCount: 1, repeatEnd: true },
      { eventId: "next-combo" },
    ),
  );
  assert.equal(applied.length, 2);
  manager.destroy();
  bus.destroy();
});
test("unknown gifts and separate non-streak gifts sharing groupId remain valid", () => {
  const bus = new EventBus();
  let applied = 0;
  const manager = new GiftManager(bus, () => applied++);
  bus.publish(
    event(
      "GIFT",
      { giftId: "?", giftName: "Unknown", groupId: "0" },
      { eventId: "1" },
    ),
  );
  bus.publish(
    event(
      "GIFT",
      { giftId: "?", giftName: "Unknown", groupId: "0" },
      { eventId: "2" },
    ),
  );
  assert.equal(applied, 2);
  manager.destroy();
  bus.destroy();
});
