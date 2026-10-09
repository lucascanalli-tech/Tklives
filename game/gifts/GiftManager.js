import { RecentEvents } from "../events/RecentEvents.js";
import { getGiftEffect } from "./GiftConfig.js";
export class GiftManager {
  constructor(eventBus, onGift) {
    this.recent = new RecentEvents();
    this.onGift = onGift;
    this.processed = 0;
    this.unsubscribe = eventBus.on("GIFT", (event) => this.handle(event));
  }
  handle(event) {
    const data = event.data;
    // Connector 2.5: streak progress is cumulative; apply only its terminal total.
    if (data.giftType === 1 && !data.repeatEnd) return false;
    const id =
      data.giftType === 1 && data.groupId && data.groupId !== "0"
        ? `${event.userId}:${data.giftId}:${data.groupId}`
        : event.eventId
          ? `event:${event.eventId}`
          : "";
    if (!this.recent.accept(id)) return false;
    this.processed += 1;
    this.onGift(event, getGiftEffect(data));
    return true;
  }
  destroy() {
    this.unsubscribe();
    this.recent.clear();
  }
}
