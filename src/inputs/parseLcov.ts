import { readFileSync } from "fs";
import lcovParse from "lcov-parse";
import { JsonSummary, CoverageReport, ReportNumbers } from "../types/JsonSummary";

export async function parseLcov(lcovPath: string): Promise<JsonSummary> {
  try {
    const lcovData = readFileSync(lcovPath, "utf8");
    
    if (!lcovData.trim()) {
      return createEmptyJsonSummary();
    }

    const parsedData = await new Promise<any[]>((resolve, reject) => {
      lcovParse(lcovData, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data || []);
        }
      });
    });

    const jsonSummary: JsonSummary = {
      total: createEmptyReport(),
    };

    let totalLines = 0;
    let totalCoveredLines = 0;
    let totalFunctions = 0;
    let totalCoveredFunctions = 0;
    let totalBranches = 0;
    let totalCoveredBranches = 0;

    for (const record of parsedData) {
      const report = convertRecordToReport(record);
      jsonSummary[record.file] = report;

      // Accumulate totals
      totalLines += report.lines.total;
      totalCoveredLines += report.lines.covered;
      totalFunctions += report.functions.total;
      totalCoveredFunctions += report.functions.covered;
      totalBranches += report.branches.total;
      totalCoveredBranches += report.branches.covered;
    }

    // Calculate total coverage
    jsonSummary.total = {
      lines: createReportNumbers(totalLines, totalCoveredLines),
      statements: createReportNumbers(totalLines, totalCoveredLines), // LCOV doesn't distinguish lines from statements
      functions: createReportNumbers(totalFunctions, totalCoveredFunctions),
      branches: createReportNumbers(totalBranches, totalCoveredBranches),
    };

    return jsonSummary;
  } catch (error) {
    throw new Error(`Failed to parse LCOV file: ${error}`);
  }
}

function convertRecordToReport(record: any): CoverageReport {
  const linesTotal = record.lines?.found || 0;
  const linesCovered = record.lines?.hit || 0;
  const functionsTotal = record.functions?.found || 0;
  const functionsCovered = record.functions?.hit || 0;
  const branchesTotal = record.branches?.found || 0;
  const branchesCovered = record.branches?.hit || 0;

  // Extract uncovered lines
  const uncoveredLines = extractUncoveredLines(record);

  return {
    lines: createReportNumbers(linesTotal, linesCovered),
    statements: createReportNumbers(linesTotal, linesCovered), // LCOV doesn't distinguish lines from statements
    functions: createReportNumbers(functionsTotal, functionsCovered),
    branches: createReportNumbers(branchesTotal, branchesCovered),
    uncoveredLines,
  };
}

function extractUncoveredLines(record: any): number[] {
  const uncovered: number[] = [];
  
  if (record.lines?.details) {
    for (const detail of record.lines.details) {
      if (detail.hit === 0) {
        uncovered.push(detail.line);
      }
    }
  }
  
  return uncovered.sort((a, b) => a - b);
}

function createReportNumbers(total: number, covered: number): ReportNumbers {
  const pct = total === 0 ? 0 : (covered / total) * 100;
  return {
    total,
    covered,
    skipped: total - covered,
    pct: Math.round(pct * 100) / 100, // Round to 2 decimal places
  };
}

function createEmptyReport(): CoverageReport {
  const empty = createReportNumbers(0, 0);
  return {
    lines: empty,
    statements: empty,
    functions: empty,
    branches: empty,
  };
}

function createEmptyJsonSummary(): JsonSummary {
  return {
    total: createEmptyReport(),
  };
}