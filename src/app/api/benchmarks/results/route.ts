import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { guardPublicRead } from "@/lib/security/guards";

const REPORTS_DIR = join(process.cwd(), "reports");

function readJsonReport(filename: string) {
  const path = join(REPORTS_DIR, filename);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "benchmark-results", 30);
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const benchmark = searchParams.get("benchmark") || "c07";

  if (benchmark === "c01") {
    const data = readJsonReport("c01_results.json");
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "C01 benchmark results not found. Run npm run benchmark:c01 first.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, benchmark: "c01", data });
  }

  if (benchmark === "c07") {
    const data = readJsonReport("c07_results.json");
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "C07 evaluation results not found. Run npm run benchmark:c07 first.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, benchmark: "c07", data });
  }

  if (benchmark === "c15") {
    const data = readJsonReport("c15_results.json");
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "C15 boardroom impact results not found. Run npm run benchmark:c15 first.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, benchmark: "c15", data });
  }

  // Combined summary
  const c01 = readJsonReport("c01_results.json");
  const c07 = readJsonReport("c07_results.json");
  const c15 = readJsonReport("c15_results.json");

  return NextResponse.json({
    success: true,
    benchmark: "all",
    c01Available: !!c01,
    c07Available: !!c07,
    c15Available: !!c15,
    c01: c01
      ? {
          status: c01.status,
          runId: c01.runId,
          timestamp: c01.timestamp,
          totalLatencyMs: c01.performance?.totalLatencyMs,
          peakMemoryMb: c01.performance?.peakMemoryMb,
          device: c01.device?.cpuModel,
        }
      : null,
    c07: c07
      ? {
          status: c07.status,
          evaluationDate: c07.evaluationDate,
          primaryF1: c07.models?.primary?.f1Score,
          baselineF1: c07.models?.baselineLogistic?.f1Score,
          heuristicF1: c07.models?.baselineHeuristic?.f1Score,
          improvementVsLogistic:
            c07.comparison?.primaryVsLogistic?.relativeImprovementPct,
          improvementVsHeuristic:
            c07.comparison?.primaryVsHeuristic?.relativeImprovementPct,
        }
      : null,
    c15: c15
      ? {
          portfolioValue: c15.portfolio?.formattedTotalValue,
          protectedValue: c15.boardroomIndicators?.formattedProtectedValue,
          netFinancialImpact: c15.boardroomIndicators?.formattedNetImpact,
          roiPct: c15.boardroomIndicators?.roiPct,
          benefitCostRatio: c15.boardroomIndicators?.benefitCostRatio,
        }
      : null,
  });
}
