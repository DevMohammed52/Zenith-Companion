import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const examplePath = path.join(root, "wrangler.toml.example");
const outputPath = path.join(root, "wrangler.toml");

const required = {
  D1_DATABASE_ID: process.env.D1_DATABASE_ID,
  KV_NAMESPACE_ID: process.env.KV_NAMESPACE_ID,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("");
  console.error("Example:");
  console.error("$env:D1_DATABASE_ID='...'; $env:KV_NAMESPACE_ID='...'; npm run prepare:config");
  process.exit(1);
}

const allowedOrigins = process.env.ALLOWED_ORIGINS || "https://your-vercel-domain.vercel.app,http://localhost:3000";

let config = fs.readFileSync(examplePath, "utf8");
config = config
  .replace("replace-with-cloudflare-d1-database-id", required.D1_DATABASE_ID)
  .replace("replace-with-cloudflare-kv-namespace-id", required.KV_NAMESPACE_ID)
  .replace("https://your-vercel-domain.vercel.app,http://localhost:3000", allowedOrigins);

fs.writeFileSync(outputPath, config);

console.log(`Wrote ${outputPath}`);
console.log("This file is gitignored. Do not paste secrets into it.");
