export const MAX_ACTIVE_PLAYERS = 100;
export const RANKING_VISIBLE_LIMIT = 10;
export const COMBAT_CELL_SIZE = 180;
export const LIKE_AGGREGATION_WINDOW_MS = 250;
export const LOAD_TEST_ROTATION_MS = 5000;

export function getLoadTestUserCount() {
  if (typeof window === 'undefined') {
    return 0;
  }

  const value = Number.parseInt(
    new URLSearchParams(window.location.search).get('load') ?? '0',
    10
  );

  return Number.isFinite(value) && value > 0 ? value : 0;
}
