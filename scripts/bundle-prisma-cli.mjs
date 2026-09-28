import { cpSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const destRoot = "/opt/prisma-cli/node_modules";
mkdirSync(destRoot, { recursive: true });

const seen = new Set();

function walk(name) {
  if (seen.has(name)) return;
  seen.add(name);

  const src = path.join("node_modules", name);
  const pkg = JSON.parse(readFileSync(path.join(src, "package.json"), "utf8"));
  const target = path.join(destRoot, name);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(src, target, { recursive: true, dereference: true });

  for (const dep of Object.keys(pkg.dependencies ?? {})) walk(dep);
}

walk("prisma");
