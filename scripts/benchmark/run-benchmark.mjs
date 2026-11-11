#!/usr/bin/env node
/**
 * ClimateGuard AI — Unified Benchmark Runner
 * Delegates to:
 * - C01 Low-Compute Edge Inference Benchmark (run-c01-benchmark.mjs)
 * - C07 Heuristic Baseline Showdown Benchmark (run-c07-benchmark.py)
 * - C15 Net Financial Impact Boardroom Calculation (run-c15-benchmark.mjs)
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const runAll = args.includes("--all");
const runC07 = args.includes("--c07") || runAll;
const runC15 = args.includes("--c15") || runAll;

function runScript(command, scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [scriptPath, ...args], { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

async function main() {
  const c01Script = path.join(__dirname, "run-c01-benchmark.mjs");
  const c07Script = path.join(__dirname, "run-c07-benchmark.py");
  const c15Script = path.join(__dirname, "run-c15-benchmark.mjs");

  console.log("Starting ClimateGuard AI Benchmark Suite...\n");
  try {
    await runScript("node", c01Script, args.filter(a => a !== "--all" && a !== "--c07" && a !== "--c15"));
    if (runC07) {
      console.log("\n" + "-".repeat(70) + "\n");
      await runScript("python", c07Script);
    }
    if (runC15) {
      console.log("\n" + "-".repeat(70) + "\n");
      await runScript("node", c15Script);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
