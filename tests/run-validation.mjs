import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const file of readdirSync(new URL("./", import.meta.url)).filter((name) => /^validate-.*\.ts$/.test(name)).sort()) {
  console.log(`\nRunning ${file}`);
  const result = spawnSync(process.execPath, ["--import", "tsx", `tests/${file}`], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "postgresql://validation:validation@127.0.0.1:1/validation?connect_timeout=1" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
