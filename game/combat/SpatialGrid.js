export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  rebuild(players) {
    this.cells.clear();

    for (const player of players) {
      const key = this.getKey(player.avatar.x, player.avatar.y);

      if (!this.cells.has(key)) {
        this.cells.set(key, []);
      }

      this.cells.get(key).push(player);
    }
  }

  getNearby(player) {
    const cellX = Math.floor(player.avatar.x / this.cellSize);
    const cellY = Math.floor(player.avatar.y / this.cellSize);
    const candidates = [];

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const key = `${cellX + offsetX}:${cellY + offsetY}`;
        const cell = this.cells.get(key);

        if (cell) {
          candidates.push(...cell);
        }
      }
    }

    return candidates;
  }

  getKey(x, y) {
    return `${Math.floor(x / this.cellSize)}:${Math.floor(y / this.cellSize)}`;
  }

  clear() {
    this.cells.clear();
  }
}
