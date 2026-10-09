import test from "node:test";
import assert from "node:assert/strict";
import { ParticipantRegistry } from "../game/participants/ParticipantRegistry.js";
import { ScoreSystem } from "../game/score/ScoreSystem.js";
import { RoundManager } from "../game/arena/RoundManager.js";
import { getGameOptions } from "../game/config/GameConfig.js";
import { SpatialGrid } from "../game/combat/SpatialGrid.js";
test("1000 identities have an independent active limit and FIFO rotation preserves scores", () => {
  const registry = new ParticipantRegistry(40);
  const score = new ScoreSystem();
  for (let i = 0; i < 1000; i++) {
    const { participant } = registry.register({
      userId: String(i),
      username: "@same",
      type: "COMMENT",
      timestamp: 1,
    });
    score.addParticipant(participant);
    registry.requestActivation(participant.userId);
  }
  assert.deepEqual(registry.getStats(), {
    registered: 1000,
    active: 40,
    queued: 960,
    maxActive: 40,
    bots: 0,
  });
  score.registerKill({ userId: "0", isAlive: () => true }, { userId: "1" });
  assert.equal(registry.releaseActive("0", { requeue: true }).userId, "40");
  assert.equal(score.getScore("0"), 1);
  assert.equal(score.getRanking(10).length, 10);
  for (let i = 1; i < 1500; i++)
    registry.releaseActive(registry.activeUserIds.values().next().value, {
      requeue: true,
    });
  assert.equal(registry.getStats().active, 40);
  assert.equal(registry.getStats().queued, 960);
  assert.ok(registry.queue.length < 3000);
});
test("repeated userId updates a name, separate IDs sharing name remain distinct; bots excluded", () => {
  const registry = new ParticipantRegistry(40);
  const score = new ScoreSystem();
  const a = registry.register({ userId: "a", username: "@old" }).participant;
  score.addParticipant(a);
  const second = registry.register({ userId: "a", username: "@new" });
  score.addParticipant(second.participant);
  assert.equal(second.isNew, false);
  assert.equal(score.getRanking()[0].username, "@new");
  score.addParticipant({ userId: "b", username: "@new" });
  score.addParticipant({ userId: "bot:0", username: "@BOT", isBot: true });
  assert.equal(score.getRanking().length, 2);
});
test("rounds wait, run, pause and start again without input", () => {
  let starts = 0,
    ends = 0;
  const rounds = new RoundManager({
    duration: 500,
    pause: 250,
    onStart: () => starts++,
    onEnd: () => ends++,
  });
  rounds.update(200, 1);
  assert.equal(rounds.phase, "WAITING");
  rounds.update(10, 2);
  assert.equal(starts, 1);
  rounds.update(250, 2);
  rounds.update(250, 2);
  assert.equal(rounds.phase, "BREAK");
  assert.equal(ends, 1);
  rounds.update(250, 2);
  assert.equal(rounds.phase, "ACTIVE");
  assert.equal(starts, 2);
  assert.equal(rounds.number, 2);
});
test("layout/mode options isolate simulator from LIVE and cap rendered users", () => {
  assert.equal(getGameOptions("?layout=portrait&mode=live").maxActive, 40);
  assert.equal(
    getGameOptions("?load=1000", { mode: "LIVE" }).mode,
    "SIMULATOR",
  );
  assert.equal(
    getGameOptions("?mode=simulator", { mode: "LIVE" }).mode,
    "SIMULATOR",
  );
  assert.equal(getGameOptions("?maxActive=1000").maxActive, 100);
  assert.equal(getGameOptions("", { mode: "LIVE" }).mode, "LIVE");
});
test("spatial grid returns only adjacent cells", () => {
  const grid = new SpatialGrid(180);
  const player = (x, y) => ({ avatar: { x, y } });
  const a = player(0, 0),
    b = player(150, 0),
    far = player(900, 900);
  grid.rebuild([a, b, far]);
  assert.deepEqual(grid.getNearby(a), [a, b]);
});
