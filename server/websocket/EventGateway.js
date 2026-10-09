import { normalizeEvent } from "../events/EventNormalizer.js";
import { ViewerRegistry } from "../viewers/ViewerRegistry.js";
import { RecentEvents, eventKey } from "../../game/events/RecentEvents.js";
export class EventGateway {
  constructor({ broadcast, registry = new ViewerRegistry() }) {
    this.broadcast = broadcast;
    this.registry = registry;
    this.recent = new RecentEvents();
    this.accepted = 0;
    this.rejected = 0;
  }
  publish(input) {
    const event = normalizeEvent(input);
    if (!event || !this.recent.accept(eventKey(event))) {
      this.rejected += 1;
      return false;
    }
    this.registry.register(event);
    this.accepted += 1;
    this.broadcast(event);
    return true;
  }
}
