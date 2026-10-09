export function getServerConfig(env = process.env, argv = process.argv) {
  const port = Number(env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT deve estar entre 1 e 65535.");
  const username = String(env.TIKTOK_USERNAME ?? "")
    .trim()
    .replace(/^@+/, "");
  if (username && !/^[\w.]{1,40}$/.test(username))
    throw new Error("TIKTOK_USERNAME deve conter apenas o @username, sem URL.");
  return {
    port,
    username,
    websocketTest: argv.includes("--ws-test"),
    host: env.HOST || "127.0.0.1",
  };
}
