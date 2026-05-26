import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const node = process.execPath;
const vitest = path.join(rootDir, "node_modules", "vitest", "vitest.mjs");
const tsc = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");
const vite = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");

const suites = {
  analytics: "src/app/lib/metrics-tests/analytics.test.ts",
  dashboard: "src/app/lib/metrics-tests/dashboard.test.ts",
  finance: "src/app/lib/metrics-tests/finance.test.ts",
  financialStructure: "src/app/lib/metrics-tests/financialStructure.test.ts",
  helpers: "src/app/lib/metrics-tests/helpers.test.ts",
  insights: "src/app/lib/metrics-tests/insights.test.ts",
  marketing: "src/app/lib/metrics-tests/marketing.test.ts",
  strategy: "src/app/lib/metrics-tests/strategy.test.ts",
  summary: "src/app/lib/metrics-tests/summary.test.ts",
  unitEconomics: "src/app/lib/metrics-tests/unitEconomics.test.ts",
};

function run(label, args) {
  console.log(`\n> ${label}`);
  const result = spawnSync(node, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runSuite(name) {
  run(`vitest ${name}`, [vitest, "run", suites[name]]);
}

function printHelp() {
  console.log(`
Usage:
  npm run test:runner -- all
  npm run test:runner -- coverage
  npm run test:runner -- check
  npm run test:runner -- <suite>

Suites:
  ${Object.keys(suites).join(", ")}

Notes:
  all      lance chaque suite en cascade, puis la coverage globale 100%
  coverage lance directement Vitest avec coverage
  check    lance typecheck, all, puis build
`);
}

const target = process.argv[2] ?? "all";

if (target === "help" || target === "--help" || target === "-h") {
  printHelp();
  process.exit(0);
}

if (target === "coverage") {
  run("vitest coverage", [vitest, "run", "--coverage"]);
  process.exit(0);
}

if (target === "typecheck") {
  run("typecheck", [tsc, "--noEmit"]);
  process.exit(0);
}

if (target === "build") {
  run("vite build", [vite, "build"]);
  process.exit(0);
}

if (target === "check") {
  run("typecheck", [tsc, "--noEmit"]);
}

if (target === "all" || target === "check") {
  for (const name of Object.keys(suites)) {
    runSuite(name);
  }

  run("vitest coverage", [vitest, "run", "--coverage"]);

  if (target === "check") {
    run("vite build", [vite, "build"]);
  }

  process.exit(0);
}

if (suites[target]) {
  runSuite(target);
  process.exit(0);
}

console.error(`Suite inconnue: ${target}`);
printHelp();
process.exit(1);
