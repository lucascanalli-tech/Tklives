export function getLayout(width, height, portrait) {
  const margin = portrait ? 32 : 40;
  const arena = portrait
    ? { x: margin, y: 355, width: width - margin * 2, height: height - 510 }
    : { x: margin, y: 140, width: width - 350, height: height - 218 };
  arena.left = arena.x;
  arena.top = arena.y;
  arena.right = arena.x + arena.width;
  arena.bottom = arena.y + arena.height;
  return {
    left: margin,
    right: width - margin,
    headerY: portrait ? 82 : 36,
    arena,
    ranking: portrait
      ? {
          x: margin,
          y: 185,
          width: width - margin * 2,
          limit: 5,
          compact: true,
        }
      : { x: width - 278, y: 140, width: 238, limit: 10, compact: false },
    stats: { x: margin, y: height - (portrait ? 104 : 44) },
    portrait,
  };
}
