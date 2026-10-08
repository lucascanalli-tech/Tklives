const PANEL_WIDTH = 330;
const PANEL_HEIGHT = 238;
const PADDING = 14;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 25;
const MAX_ROWS = 7;

function describeEvent(event) {
  switch (event.type) {
    case 'JOIN':
      return `${event.username} entrou`;
    case 'COMMENT':
      return `${event.username}: ${event.message ?? ''}`;
    case 'LIKE':
      return `${event.username} +${event.count ?? 1} likes`;
    case 'FOLLOW':
      return `${event.username} seguiu`;
    case 'GIFT':
      return `${event.username} enviou ${event.giftName ?? 'gift'} x${event.quantity ?? 1}`;
    case 'SHARE':
      return `${event.username} compartilhou`;
    default:
      return `${event.type} • ${event.username}`;
  }
}

export class EventLogView {
  constructor(scene, eventBus, { x, y }) {
    this.events = [];

    this.background = scene.add
      .rectangle(x, y, PANEL_WIDTH, PANEL_HEIGHT, 0x0f172a, 0.88)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xa78bfa, 0.8)
      .setDepth(20);

    this.title = scene.add
      .text(x + PADDING, y + PADDING, 'EVENTOS • SIMULADOR', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setDepth(21);

    this.rows = Array.from({ length: MAX_ROWS }, (_, index) =>
      scene.add
        .text(
          x + PADDING,
          y + PADDING + HEADER_HEIGHT + index * ROW_HEIGHT,
          '',
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: '#e2e8f0'
          }
        )
        .setDepth(21)
    );

    this.unsubscribe = eventBus.subscribe((event) => this.addEvent(event));
  }

  addEvent(event) {
    this.events.unshift(`[${event.type}] ${describeEvent(event)}`);
    this.events = this.events.slice(0, MAX_ROWS);

    this.rows.forEach((row, index) => {
      row.setText(this.events[index] ?? '');
    });
  }
}
