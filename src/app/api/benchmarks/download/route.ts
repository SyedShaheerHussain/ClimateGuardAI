import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { guardPublicRead } from "@/lib/security/guards";

const REPORTS_DIR = join(process.cwd(), "reports");

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "benchmark-download", 20);
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const report = searchParams.get("report");

  const allowedReports = ["C01_REPORT.md", "C07_REPORT.md", "C15_REPORT.md", "C15_FINANCIAL_IMPACT_REPORT.md"];
  if (!report || !allowedReports.includes(report)) {
    return NextResponse.json(
      { success: false, error: "Invalid report name. Use C01_REPORT.md, C07_REPORT.md, or C15_REPORT.md." },
      { status: 400 }
    );
  }

  const reportPath = join(REPORTS_DIR, report);
  if (!existsSync(reportPath)) {
    return NextResponse.json(
      { success: false, error: `Report ${report} not found. Run the benchmark first.` },
      { status: 404 }
    );
  }

  const content = readFileSync(reportPath, "utf-8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}"`,
      "Cache-Control": "no-store",
    },
  });
}
