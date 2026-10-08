const PANEL_WIDTH = 230;
const PADDING = 14;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 27;

export class RankingView {
  constructor(scene, scoreSystem, { x, y }) {
    this.scene = scene;
    this.scoreSystem = scoreSystem;
    this.x = x;
    this.y = y;
    this.rows = [];

    this.background = scene.add.graphics().setDepth(20);

    this.title = scene.add
      .text(x + PADDING, y + PADDING, 'RANKING', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setDepth(21);

    this.unsubscribe = this.scoreSystem.subscribe((ranking) =>
      this.render(ranking)
    );
  }

  ensureRows(count) {
    while (this.rows.length < count) {
      const index = this.rows.length;
      const row = this.scene.add
        .text(
          this.x + PADDING,
          this.y + PADDING + HEADER_HEIGHT + index * ROW_HEIGHT,
          '',
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            color: '#e2e8f0'
          }
        )
        .setDepth(21);

      this.rows.push(row);
    }
  }

  render(ranking) {
    this.ensureRows(ranking.length);

    const panelHeight =
      PADDING * 2 + HEADER_HEIGHT + Math.max(ranking.length, 1) * ROW_HEIGHT;

    this.background.clear();
    this.background.fillStyle(0x0f172a, 0.88);
    this.background.fillRoundedRect(
      this.x,
      this.y,
      PANEL_WIDTH,
      panelHeight,
      10
    );
    this.background.lineStyle(2, 0x38bdf8, 0.75);
    this.background.strokeRoundedRect(
      this.x,
      this.y,
      PANEL_WIDTH,
      panelHeight,
      10
    );

    this.rows.forEach((row, index) => {
      const entry = ranking[index];
      row.setText(
        entry ? `${index + 1}. ${entry.username} — ${entry.score} pts` : ''
      );
    });
  }
}
