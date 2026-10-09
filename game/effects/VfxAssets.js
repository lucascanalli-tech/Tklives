const MANIFEST = "vfx-manifest";
const ROLES = new Set([
  "attack", "hit", "critical", "death", "spawn", "respawn",
  "gift.common", "gift.rare", "gift.epic", "gift.legendary",
  "like", "follow", "share", "comment",
  "particle.spark", "particle.heart", "particle.glow", "particle.trail", "environment",
]);
const assetPath = (path, extension) => typeof path === "string" &&
  /^assets\/vfx\/[\w/-]+\.(png|webp|json)$/.test(path) && !path.split("/").includes("..") && extension.test(path);
export function validateVfxManifest(manifest) {
  const roles = new Set();
  return (Array.isArray(manifest?.assets) ? manifest.assets : []).slice(0, 64).filter(item => {
    if (!item || item.enabled === false || !ROLES.has(item.role) || roles.has(item.role)) return false;
    if (!assetPath(item.path, /\.(png|webp)$/)) return false;
    if (!["image", "spritesheet", "atlas"].includes(item.type)) return false;
    if (item.type === "atlas" && !assetPath(item.atlas, /\.json$/)) return false;
    if (item.type === "spritesheet" && ![item.frameWidth, item.frameHeight].every(n => Number.isInteger(n) && n > 0 && n <= 1024)) return false;
    roles.add(item.role); return true;
  }).map(item => ({ ...item, key: `vfx-external-${item.role}`,
    frameRate: Math.max(1, Math.min(60, Number(item.frameRate) || 24)),
    scale: Math.max(0.01, Math.min(8, Number(item.scale) || 1)) }));
}
export function preloadVfxAssets(scene) {
  scene.load.once(`filecomplete-json-${MANIFEST}`, () => {
    for (const asset of validateVfxManifest(scene.cache.json.get(MANIFEST))) {
      if (scene.textures.exists(asset.key)) continue;
      if (asset.type === "spritesheet") scene.load.spritesheet(asset.key, asset.path, {
        frameWidth: asset.frameWidth, frameHeight: asset.frameHeight });
      else if (asset.type === "atlas") scene.load.atlas(asset.key, asset.path, asset.atlas);
      else scene.load.image(asset.key, asset.path);
    }
  });
  scene.load.json(MANIFEST, "assets/vfx/manifest.json");
}
export function readyVfxAssets(scene) {
  const available = new Map();
  for (const asset of validateVfxManifest(scene.cache.json.get(MANIFEST))) {
    if (!scene.textures.exists(asset.key)) continue;
    if (asset.type !== "image") {
      const names = scene.textures.get(asset.key).getFrameNames().slice(0, 256);
      const requested = Array.isArray(asset.frames) ? asset.frames.filter(f => names.includes(String(f))).slice(0, 256) : names;
      if (!requested.length) continue;
      const animation = `${asset.key}-play`;
      if (!scene.anims.exists(animation)) scene.anims.create({ key: animation,
        frames: requested.map(frame => ({ key: asset.key, frame })), frameRate: asset.frameRate, repeat: 0 });
      available.set(asset.role, { ...asset, animation });
    } else available.set(asset.role, asset);
  }
  return available;
}
