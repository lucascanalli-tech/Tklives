const SIMULATED_USERS = [
  { userId: 'sim-001', username: 'Lucas' },
  { userId: 'sim-002', username: 'Maria' },
  { userId: 'sim-003', username: 'Joao' },
  { userId: 'sim-004', username: 'Ana' },
  { userId: 'sim-005', username: 'Bia' },
  { userId: 'sim-006', username: 'Rafa' }
];

const SCRIPTED_EVENTS = [
  { delay: 400, type: 'JOIN', user: 0 },
  { delay: 1000, type: 'JOIN', user: 1 },
  {
    delay: 1600,
    type: 'COMMENT',
    user: 0,
    data: { message: 'Bora arena!' }
  },
  { delay: 2200, type: 'JOIN', user: 2 },
  { delay: 2800, type: 'LIKE', user: 1, data: { count: 12 } },
  { delay: 3400, type: 'JOIN', user: 3 },
  { delay: 4000, type: 'FOLLOW', user: 2 },
  { delay: 4600, type: 'JOIN', user: 4 },
  {
    delay: 5200,
    type: 'GIFT',
    user: 3,
    data: { giftName: 'Rose', quantity: 1 }
  },
  { delay: 5800, type: 'JOIN', user: 5 },
  { delay: 6400, type: 'SHARE', user: 4 },
  { delay: 7000, type: 'JOIN', user: 0 }
];

const RANDOM_EVENTS = ['COMMENT', 'LIKE', 'FOLLOW', 'GIFT', 'SHARE'];

export class EventSimulator {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.timeouts = [];
    this.interval = null;
    this.running = false;
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;

    SCRIPTED_EVENTS.forEach((item) => {
      const timeout = setTimeout(() => {
        this.emit(item.type, SIMULATED_USERS[item.user], item.data);
      }, item.delay);

      this.timeouts.push(timeout);
    });

    const intervalStart = setTimeout(() => {
      if (!this.running) {
        return;
      }

      this.interval = setInterval(() => this.emitRandomInteraction(), 1600);
    }, 7600);

    this.timeouts.push(intervalStart);
  }

  stop() {
    this.running = false;
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  emit(type, user, data = {}) {
    return this.eventBus.publish({
      type,
      userId: user.userId,
      username: user.username,
      timestamp: Date.now(),
      ...data
    });
  }

  emitRandomInteraction() {
    const user = SIMULATED_USERS[
      Math.floor(Math.random() * SIMULATED_USERS.length)
    ];
    const type = RANDOM_EVENTS[
      Math.floor(Math.random() * RANDOM_EVENTS.length)
    ];

    const data =
      type === 'COMMENT'
        ? { message: 'Live Arena!' }
        : type === 'LIKE'
          ? { count: Math.floor(Math.random() * 20) + 1 }
          : type === 'GIFT'
            ? { giftName: 'Rose', quantity: 1 }
            : {};

    this.emit(type, user, data);
  }
}
