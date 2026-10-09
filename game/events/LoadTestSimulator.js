const JOIN_BATCH_SIZE = 25;
const JOIN_BATCH_INTERVAL = 100;
const INTERACTION_INTERVAL = 90;

const RANDOM_EVENTS = ['COMMENT', 'LIKE', 'FOLLOW', 'GIFT', 'SHARE'];

function makeUser(index) {
  const number = String(index + 1).padStart(4, '0');

  return {
    userId: `load-${number}`,
    username: `Load${number}`
  };
}

export class LoadTestSimulator {
  constructor(eventBus, { userCount }) {
    this.eventBus = eventBus;
    this.userCount = userCount;
    this.users = Array.from({ length: userCount }, (_, index) => makeUser(index));
    this.joinIndex = 0;
    this.joinInterval = null;
    this.interactionInterval = null;
    this.timeouts = [];
    this.running = false;
  }

  start() {
    if (this.running || this.users.length === 0) {
      return;
    }

    this.running = true;
    this.emitJoinBatch();

    this.joinInterval = setInterval(() => {
      this.emitJoinBatch();

      if (this.joinIndex >= this.users.length) {
        clearInterval(this.joinInterval);
        this.joinInterval = null;
        this.startInteractions();
      }
    }, JOIN_BATCH_INTERVAL);
  }

  emitJoinBatch() {
    const end = Math.min(
      this.joinIndex + JOIN_BATCH_SIZE,
      this.users.length
    );

    while (this.joinIndex < end) {
      this.emit('JOIN', this.users[this.joinIndex]);
      this.joinIndex += 1;
    }
  }

  startInteractions() {
    this.emitCoverageInteractions();

    this.interactionInterval = setInterval(
      () => this.emitRandomInteraction(),
      INTERACTION_INTERVAL
    );
  }

  emitCoverageInteractions() {
    const types = ['COMMENT', 'LIKE', 'FOLLOW', 'GIFT', 'SHARE'];

    types.forEach((type, index) => {
      const user = this.users[index % this.users.length];
      const timeout = setTimeout(
        () => this.emitInteraction(type, user),
        150 + index * 120
      );

      this.timeouts.push(timeout);
    });
  }

  emitRandomInteraction() {
    const user = this.users[
      Math.floor(Math.random() * this.users.length)
    ];
    const type = RANDOM_EVENTS[
      Math.floor(Math.random() * RANDOM_EVENTS.length)
    ];

    if (type === 'LIKE') {
      for (let index = 0; index < 4; index += 1) {
        this.emit('LIKE', user, {
          count: Math.floor(Math.random() * 3) + 1
        });
      }

      return;
    }

    this.emitInteraction(type, user);
  }

  emitInteraction(type, user) {
    const data =
      type === 'COMMENT'
        ? { message: 'Teste de carga Live Arena' }
        : type === 'LIKE'
          ? { count: 3 }
          : type === 'GIFT'
            ? { giftName: 'Rose', quantity: 1 }
            : {};

    this.emit(type, user, data);
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

  stop() {
    this.running = false;

    if (this.joinInterval) {
      clearInterval(this.joinInterval);
      this.joinInterval = null;
    }

    if (this.interactionInterval) {
      clearInterval(this.interactionInterval);
      this.interactionInterval = null;
    }

    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];
  }
}
