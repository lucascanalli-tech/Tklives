export const MAX_ACTIVE_PLAYERS = 100;
export const RANKING_VISIBLE_LIMIT = 10;
export const COMBAT_CELL_SIZE = 180;
export const LIKE_AGGREGATION_WINDOW_MS = 250;
export const LOAD_TEST_ROTATION_MS = 5000;
export const ROUND_DURATION_MS = 120000;
export const ROUND_BREAK_MS = 8000;
export const MAX_VISUAL_EFFECTS = 100;
export function getLoadTestUserCount() {
  if (typeof window === "undefined") return 0;
  const number = Number.parseInt(
    new URLSearchParams(window.location.search).get("load") ?? "0",
    10,
  );
  return Number.isFinite(number) && number > 0 ? Math.min(10000, number) : 0;
}
export function getGameOptions(search = "", server = {}) {
  const query = new URLSearchParams(search);
  const layout = query.get("layout") === "portrait" ? "portrait" : "landscape";
  const load = Math.min(
    10000,
    Math.max(0, Number.parseInt(query.get("load"), 10) || 0),
  );
  const mode =
    load || query.get("mode") === "simulator"
      ? "SIMULATOR"
      : query.get("mode") === "live" || query.get("simulator") === "off"
        ? "LIVE"
        : server.mode === "LIVE"
          ? "LIVE"
          : "SIMULATOR";
  const requested = Number.parseInt(query.get("maxActive"), 10);
  const maxActive = Number.isFinite(requested)
    ? Math.max(1, Math.min(MAX_ACTIVE_PLAYERS, requested))
    : layout === "portrait" || mode === "LIVE"
      ? 40
      : MAX_ACTIVE_PLAYERS;
  return {
    layout,
    mode,
    load,
    maxActive,
    bots: mode === "LIVE" && query.get("bots") !== "off",
    server,
  };
}
