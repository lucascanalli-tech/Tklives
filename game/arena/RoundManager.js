import { ROUND_DURATION_MS, ROUND_BREAK_MS } from "../config/GameConfig.js";
export class RoundManager {
  constructor({
    duration = ROUND_DURATION_MS,
    pause = ROUND_BREAK_MS,
    onStart = () => {},
    onEnd = () => {},
  } = {}) {
    this.duration = duration;
    this.pause = pause;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.number = 0;
    this.phase = "WAITING";
    this.remaining = duration;
  }
  update(delta, active) {
    if (this.phase === "WAITING") {
      if (active >= 2) this.start();
      return;
    }
    this.remaining = Math.max(0, this.remaining - Math.min(delta, 250));
    if (this.remaining > 0) return;
    if (this.phase === "ACTIVE") {
      this.phase = "BREAK";
      this.remaining = this.pause;
      this.onEnd();
    } else if (active >= 2) this.start();
    else {
      this.phase = "WAITING";
      this.remaining = this.duration;
    }
  }
  start() {
    this.number += 1;
    this.phase = "ACTIVE";
    this.remaining = this.duration;
    this.onStart();
  }
}
