import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { guardPublicRead } from "@/lib/security/guards";

const RESULTS_PATH = join(process.cwd(), "reports", "c01_results.json");

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "benchmark", 20);
  if (blocked) return blocked;

  if (!existsSync(RESULTS_PATH)) {
    return NextResponse.json(
      {
        success: false,
        error: "No C01 results file. Run node scripts/benchmark/run-c01-benchmark.mjs.",
      },
      { status: 404 }
    );
  }

  const results = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
  return NextResponse.json({
    success: true,
    benchmarkSuite: "C01 — 100 real inferences per run",
    note: "Values come from reports/c01_results.json, produced by the local benchmark script. They describe the machine that ran it, not this server.",
    results,
  });
}

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "benchmark-post", 5);
  if (blocked) return blocked;
  return NextResponse.json(
    {
      success: false,
      error:
        "Synthetic micro-benchmarks are not served by the API. Execute node scripts/benchmark/run-c01-benchmark.mjs and read the real result file.",
    },
    { status: 501 }
  );
}
