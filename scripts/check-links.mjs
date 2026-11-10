// Every simulation link in the programme / posters / database must point to a real sim id.
// Run: node scripts/check-links.mjs   (reads source text, no bundler needed)
import { readFileSync, readdirSync } from "node:fs";
const reg = readFileSync(new URL("../src/sims/registry.js", import.meta.url), "utf8");
const ids = new Set([...reg.matchAll(/^\s+id: "([a-z0-9_]+)",/gm)].map((m) => m[1]).filter((i) => i !== "all"));
const files = ["../src/data/conference.js", "../src/components/CryoDatabasePanel.jsx"];
let bad = 0, total = 0;
for (const f of files) {
  const t = readFileSync(new URL(f, import.meta.url), "utf8");
  for (const m of t.matchAll(/\b(?:sim|simId): "([a-z0-9_]+)"/g)) {
    total++;
    if (!ids.has(m[1])) { bad++; console.log(`BROKEN ${f}: ${m[1]}`); }
  }
}
for (const m of reg.matchAll(/related: \[([^\]]*)\]/g))
  for (const r of m[1].matchAll(/"([a-z0-9_]+)"/g)) { total++; if (!ids.has(r[1])) { bad++; console.log(`BROKEN related: ${r[1]}`); } }
const conf = readFileSync(new URL("../src/data/conference.js", import.meta.url), "utf8");
const linked = new Set([...conf.matchAll(/\bsim: "([a-z0-9_]+)"/g)].map((m) => m[1]));
console.log(`${ids.size} sims, ${total} links checked, ${bad} broken`);
console.log(`sims with a talk/poster: ${linked.size}; without: ${[...ids].filter((i) => !linked.has(i)).join(", ")}`);
process.exit(bad ? 1 : 0);
