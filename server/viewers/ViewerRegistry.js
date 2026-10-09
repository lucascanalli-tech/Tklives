export class ViewerRegistry {
  constructor() {
    this.viewers = new Map();
  }
  register(event) {
    let viewer = this.viewers.get(event.userId);
    const isNew = !viewer;
    if (!viewer) {
      viewer = {
        userId: event.userId,
        firstSeenAt: event.timestamp,
        interactions: 0,
      };
      this.viewers.set(event.userId, viewer);
    }
    viewer.username = event.username;
    viewer.lastSeenAt = event.timestamp;
    viewer.interactions += 1;
    return { viewer, isNew };
  }
  get size() {
    return this.viewers.size;
  }
}
