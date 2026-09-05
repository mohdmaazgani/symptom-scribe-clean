import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_DIR = path.join(__dirname, "..", "supabase", "functions");

// Functions listed here are intentionally exempt from the shared rate limiter,
// e.g. public health-check endpoints with no meaningful abuse/cost surface.
// Add a function name here only with a clear reason — most new functions should
// import and call rateLimit() from _shared/rateLimit.ts.
const EXEMPT_FUNCTIONS = new Set([
  // "health-check",
]);

const IMPORT_PATTERN =
  /import\s*\{[^}]*\brateLimit\b[^}]*\}\s*from\s*["'][^"']*_shared\/rateLimit\.ts["']/;
const CALL_PATTERN = /\brateLimit\s*\(/;

function findFunctionDirs() {
  return fs
    .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort();
}

function checkFunction(name) {
  const indexPath = path.join(FUNCTIONS_DIR, name, "index.ts");

  if (!fs.existsSync(indexPath)) {
    return { name, ok: false, reason: `missing ${path.relative(process.cwd(), indexPath)}` };
  }

  const source = fs.readFileSync(indexPath, "utf8");
  const hasImport = IMPORT_PATTERN.test(source);
  const hasCall = CALL_PATTERN.test(source);

  if (hasImport && hasCall) {
    return { name, ok: true };
  }

  const missing = [];
  if (!hasImport) missing.push("import of rateLimit from _shared/rateLimit.ts");
  if (!hasCall) missing.push("a call to rateLimit(...)");

  return { name, ok: false, reason: `missing ${missing.join(" and ")}` };
}

function main() {
  const functionNames = findFunctionDirs();
  const results = functionNames.filter((name) => !EXEMPT_FUNCTIONS.has(name)).map(checkFunction);

  const failures = results.filter((result) => !result.ok);

  for (const result of results) {
    const status = result.ok ? "✅" : "❌";
    console.log(`${status} ${result.name}${result.ok ? "" : ` — ${result.reason}`}`);
  }

  for (const name of functionNames.filter((name) => EXEMPT_FUNCTIONS.has(name))) {
    console.log(`⏭️  ${name} — exempt`);
  }

  if (failures.length > 0) {
    console.error(
      `\n${failures.length} Edge Function(s) do not import/call the shared rate limiter.\n` +
        `Add "import { rateLimit } from '../_shared/rateLimit.ts';" and call it before processing ` +
        `requests, or add the function to EXEMPT_FUNCTIONS in scripts/check-edge-function-rate-limits.mjs ` +
        `with a reason if it intentionally doesn't need rate limiting.`
    );
    process.exit(1);
  }

  console.log(`\nAll ${results.length} Edge Function(s) use the shared rate limiter.`);
}

main();
