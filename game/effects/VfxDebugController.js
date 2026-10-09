import { Player } from "../player/Player.js";
import { createVisualObject, VisualRandom } from "../config/VfxConfig.js";
import { EventSimulator } from "../events/EventSimulator.js";

export class VfxDebugController {
  constructor(scene) {
    this.scene = scene; this.elapsed = 0; this.next = 0; this.sequence = []; this.restoreAt = 0;
    const a = scene.arenaBounds, fx = scene.visualEffects;
    this.actors = [0, 1].map(i => createVisualObject(() => new Player(scene, {
      userId: `vfx-preview-${i}`, username: i ? "VFX TARGET" : "VFX DEMO",
      x: a.centerX + (i ? 60 : -60), y: a.centerY + 42,
      color: i ? 0xf472b6 : 0x38bdf8, bounds: a,
    }), fx.random));
    this.panel = document.createElement("details"); this.panel.id = "vfx-debug"; this.panel.open = true;
    const title = document.createElement("summary"); title.textContent = "Laboratório VFX"; this.panel.append(title);
    const description = document.createElement("p"); description.textContent = "Prévia visual · não aplica dano ou bônus"; this.panel.append(description);
    const controls = document.createElement("div"); controls.className = "vfx-buttons";
    for (const name of EventSimulator.visualScenarios) {
      const button = document.createElement("button"); button.textContent = name;
      button.addEventListener("click", () => this.run(name)); controls.append(button);
    }
    const all = document.createElement("button"); all.textContent = "Demonstrar todos";
    all.addEventListener("click", () => { this.sequence = [...EventSimulator.visualScenarios]; this.next = this.elapsed; });
    controls.append(all); this.panel.append(controls);
    const label = document.createElement("label"); label.textContent = "Qualidade ";
    const select = document.createElement("select"); select.setAttribute("aria-label", "Qualidade VFX");
    for (const quality of ["LOW", "MEDIUM", "HIGH"]) {
      const option = document.createElement("option"); option.value = quality; option.textContent = quality; select.append(option);
    }
    select.value = fx.options.quality; select.addEventListener("change", () => {
      const url = new URL(location.href); url.searchParams.set("vfxQuality", select.value); location.href = url.href;
    }); label.append(select); this.panel.append(label);
    const shake = document.createElement("label"), checkbox = document.createElement("input"); checkbox.type = "checkbox";
    checkbox.checked = fx.options.shake; checkbox.addEventListener("change", () => { fx.options.shake = checkbox.checked; scene.cameras.main.setScroll(0, 0); });
    shake.append(checkbox, " Shake em LEGENDARY"); this.panel.append(shake);
    this.status = document.createElement("p"); this.panel.append(this.status); document.body.append(this.panel);
  }
  run(name) {
    const fx = this.scene.visualEffects;
    this.actors[1].avatar.setVisible(true); this.actors[1].nameText.setVisible(true);
    this.restoreAt = 0;
    const random = fx.random; fx.random = new VisualRandom(0x123456 + EventSimulator.visualScenarios.indexOf(name));
    try { EventSimulator.playVisualScenario(name, fx, this.actors); } finally { fx.random = random; }
    if (name === "Death") {
      this.actors[1].avatar.setVisible(false); this.actors[1].nameText.setVisible(false);
      this.restoreAt = this.elapsed + 650;
    }
    this.last = name;
  }
  update(delta) {
    this.elapsed += delta;
    if (this.restoreAt && this.elapsed >= this.restoreAt) {
      this.actors[1].avatar.setVisible(true); this.actors[1].nameText.setVisible(true); this.restoreAt = 0;
    }
    if (this.sequence.length && this.elapsed >= this.next) { this.run(this.sequence.shift()); this.next = this.elapsed + 1100; }
    if (this.elapsed % 300 < delta) {
      const m = this.scene.visualEffects.metrics();
      this.status.textContent = `${this.last || "Selecione um efeito"} · ${m.quality}\nPartículas ${m.particles.active}/${m.particles.capacity} · VFX ${m.effects}/${m.limit}\nFila ${m.presentations.pending}/${m.presentations.capacity}`;
    }
    for (const actor of this.actors) actor.update(this.elapsed);
  }
  destroy() { this.sequence.length = 0; this.panel.remove(); for (const actor of this.actors) actor.destroy(); }
}
