import { readFileSync } from "fs";
import lcovParse from "lcov-parse";
import { JsonSummary, CoverageReport, ReportNumbers } from "../types/JsonSummary";

export async function parseLcov(lcovPath: string): Promise<JsonSummary> {
  try {
    const lcovData = readFileSync(lcovPath, "utf8");
    
    if (!lcovData.trim()) {
      return createEmptyJsonSummary();
    }

    // Try new DA line parsing method first
    return await parseLcovWithDALines(lcovData);
  } catch (error) {
    throw new Error(`Failed to parse LCOV file: ${error}`);
  }
}

async function parseLcovWithDALines(lcovData: string): Promise<JsonSummary> {
  // Parse DA lines directly for accurate coverage calculation
  const daLinesByFile = parseDALines(lcovData);
  
  // Also use lcov-parse for function and branch data
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
    const filePath = record.file;
    const daLines = daLinesByFile[filePath] || [];
    
    // Use DA line data if available, otherwise fallback to lcov-parse data
    const useDALines = daLines.length > 0;
    const daCoverage = useDALines ? calculateCoverageFromDA(daLines) : {
      total: record.lines?.found || 0,
      covered: record.lines?.hit || 0,
      uncovered: extractUncoveredLines(record)
    };
    
    // Use lcov-parse for functions/branches
    const functionsTotal = record.functions?.found || 0;
    const functionsCovered = record.functions?.hit || 0;
    const branchesTotal = record.branches?.found || 0;
    const branchesCovered = record.branches?.hit || 0;

    const report: CoverageReport = {
      lines: createReportNumbers(daCoverage.total, daCoverage.covered),
      statements: createReportNumbers(daCoverage.total, daCoverage.covered), // LCOV doesn't distinguish lines from statements
      functions: createReportNumbers(functionsTotal, functionsCovered),
      branches: createReportNumbers(branchesTotal, branchesCovered),
      uncoveredLines: daCoverage.uncovered,
    };

    jsonSummary[filePath] = report;

    // Accumulate totals
    totalLines += daCoverage.total;
    totalCoveredLines += daCoverage.covered;
    totalFunctions += functionsTotal;
    totalCoveredFunctions += functionsCovered;
    totalBranches += branchesTotal;
    totalCoveredBranches += branchesCovered;
  }

  // Calculate total coverage
  jsonSummary.total = {
    lines: createReportNumbers(totalLines, totalCoveredLines),
    statements: createReportNumbers(totalLines, totalCoveredLines), // LCOV doesn't distinguish lines from statements
    functions: createReportNumbers(totalFunctions, totalCoveredFunctions),
    branches: createReportNumbers(totalBranches, totalCoveredBranches),
  };

  return jsonSummary;
}


interface DALineData {
  lineNumber: number;
  hitCount: number;
}

function parseDALines(lcovContent: string): { [filePath: string]: DALineData[] } {
  const lines = lcovContent.split('\n');
  const result: { [filePath: string]: DALineData[] } = {};
  let currentFile = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('SF:')) {
      currentFile = trimmed.substring(3);
      result[currentFile] = [];
    } else if (trimmed.startsWith('DA:') && currentFile) {
      const match = trimmed.match(/^DA:(\d+),(\d+)$/);
      if (match) {
        const lineNumber = parseInt(match[1], 10);
        const hitCount = parseInt(match[2], 10);
        result[currentFile].push({ lineNumber, hitCount });
      }
    }
  }

  return result;
}

function calculateCoverageFromDA(daData: DALineData[]): { total: number; covered: number; uncovered: number[] } {
  const total = daData.length;
  const covered = daData.filter(line => line.hitCount > 0).length;
  const uncovered = daData
    .filter(line => line.hitCount === 0)
    .map(line => line.lineNumber)
    .sort((a, b) => a - b);

  return { total, covered, uncovered };
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