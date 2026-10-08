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

    const playerCount = this.scoreSystem.getRanking().length;
    const panelHeight = PADDING * 2 + HEADER_HEIGHT + playerCount * ROW_HEIGHT;

    this.background = scene.add
      .rectangle(
        x,
        y,
        PANEL_WIDTH,
        panelHeight,
        0x0f172a,
        0.88
      )
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x38bdf8, 0.75)
      .setDepth(20);

    this.title = scene.add
      .text(x + PADDING, y + PADDING, 'RANKING', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setDepth(21);

    this.rows = Array.from({ length: playerCount }, (_, index) =>
      scene.add
        .text(
          x + PADDING,
          y + PADDING + HEADER_HEIGHT + index * ROW_HEIGHT,
          '',
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            color: '#e2e8f0'
          }
        )
        .setDepth(21)
    );

    this.unsubscribe = this.scoreSystem.subscribe((ranking) =>
      this.render(ranking)
    );
  }

  render(ranking) {
    this.rows.forEach((row, index) => {
      const entry = ranking[index];

      row.setText(
        entry ? `${index + 1}. ${entry.username} — ${entry.score} pts` : ''
      );
    });
  }
}
