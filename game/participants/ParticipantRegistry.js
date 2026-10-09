export class ParticipantRegistry {
  constructor(maxActivePlayers) {
    this.maxActivePlayers = maxActivePlayers;
    this.participants = new Map();
    this.activeUserIds = new Set();
    this.queue = [];
    this.queueHead = 0;
    this.queuedUserIds = new Set();
    this.listeners = new Set();
  }

  register(event) {
    const userId = String(event?.userId ?? '').trim();

    if (!userId) {
      return { participant: null, isNew: false };
    }

    let participant = this.participants.get(userId);
    const isNew = !participant;

    if (!participant) {
      participant = {
        userId,
        username: event.username,
        registeredAt: event.timestamp,
        lastSeenAt: event.timestamp,
        lastEventType: event.type,
        interactionCount: 0,
        status: 'registered'
      };

      this.participants.set(userId, participant);
    }

    participant.username = event.username || participant.username;
    participant.lastSeenAt = event.timestamp;
    participant.lastEventType = event.type;
    participant.interactionCount += 1;

    if (isNew) {
      this.notify();
    }

    return { participant, isNew };
  }

  get(userId) {
    return this.participants.get(String(userId));
  }

  requestActivation(userId) {
    const participant = this.get(userId);

    if (!participant) {
      return { status: 'missing', participant: null };
    }

    if (this.activeUserIds.has(participant.userId)) {
      return { status: 'active', participant };
    }

    if (this.queuedUserIds.has(participant.userId)) {
      return { status: 'queued', participant };
    }

    if (this.activeUserIds.size < this.maxActivePlayers) {
      this.activeUserIds.add(participant.userId);
      participant.status = 'active';
      this.notify();

      return { status: 'activated', participant };
    }

    this.enqueue(participant.userId);
    this.notify();

    return { status: 'queued', participant };
  }

  releaseActive(userId, { requeue = false } = {}) {
    const participant = this.get(userId);

    if (!participant || !this.activeUserIds.delete(participant.userId)) {
      return null;
    }

    participant.status = 'registered';

    const promoted = this.promoteNext();

    if (requeue) {
      this.enqueue(participant.userId);
    }

    this.notify();

    return promoted;
  }

  promoteNext() {
    while (this.queueHead < this.queue.length) {
      const userId = this.queue[this.queueHead++];
      this.queuedUserIds.delete(userId);

      const participant = this.get(userId);

      if (
        participant &&
        !this.activeUserIds.has(userId) &&
        this.activeUserIds.size < this.maxActivePlayers
      ) {
        this.activeUserIds.add(userId);
        participant.status = 'active';
        this.compactQueue();

        return participant;
      }
    }

    this.compactQueue();
    return null;
  }

  enqueue(userId) {
    const participant = this.get(userId);

    if (
      !participant ||
      this.activeUserIds.has(userId) ||
      this.queuedUserIds.has(userId)
    ) {
      return false;
    }

    this.queue.push(userId);
    this.queuedUserIds.add(userId);
    participant.status = 'queued';

    return true;
  }

  compactQueue() {
    if (this.queueHead > 1000 && this.queueHead * 2 > this.queue.length) {
      this.queue = this.queue.slice(this.queueHead);
      this.queueHead = 0;
    }
  }

  getStats() {
    return {
      registered: this.participants.size,
      active: this.activeUserIds.size,
      queued: this.queuedUserIds.size,
      maxActive: this.maxActivePlayers
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getStats());

    return () => this.listeners.delete(listener);
  }

  notify() {
    const stats = this.getStats();
    this.listeners.forEach((listener) => listener(stats));
  }
}
