import { oneLine } from "common-tags";
import type { JsonSummary, CoverageReport, ReportNumbers } from "../types/JsonSummary";

const COMMENT_MARKER = "<!-- bun-coverage-report-marker -->";

interface CommentOptions {
  thresholds?: {
    lines?: number;
    statements?: number;
    functions?: number;
    branches?: number;
  };
  showFileCoverage?: boolean;
  maxFiles?: number;
}

export function generateCoverageComment(
  jsonSummary: JsonSummary,
  options: CommentOptions = {}
): string {
  const { thresholds = {}, showFileCoverage = true, maxFiles = 20 } = options;
  
  const tableHtml = generateSummaryTableHtml(jsonSummary.total, thresholds);
  const fileCoverageHtml = showFileCoverage 
    ? generateFileCoverageSection(jsonSummary, maxFiles) 
    : '';
  
  return `## Coverage Report

${tableHtml}

${fileCoverageHtml}

${COMMENT_MARKER}`;
}

function generateSummaryTableHtml(
  coverageReport: CoverageReport,
  thresholds: CommentOptions["thresholds"] = {}
): string {
  return oneLine`
    <table>
      <thead>
        <tr>
          <th align="center">Status</th>
          <th align="left">Category</th>
          <th align="right">Percentage</th>
          <th align="right">Covered / Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${generateTableRow({
            reportNumbers: coverageReport.lines,
            category: "Lines",
            threshold: thresholds.lines,
          })}
        </tr>
        <tr>
          ${generateTableRow({
            reportNumbers: coverageReport.statements,
            category: "Statements",
            threshold: thresholds.statements,
          })}
        </tr>
        <tr>
          ${generateTableRow({
            reportNumbers: coverageReport.functions,
            category: "Functions",
            threshold: thresholds.functions,
          })}
        </tr>
        <tr>
          ${generateTableRow({
            reportNumbers: coverageReport.branches,
            category: "Branches",
            threshold: thresholds.branches,
          })}
        </tr>
      </tbody>
    </table>
  `;
}

function generateTableRow({
  reportNumbers,
  category,
  threshold,
}: {
  reportNumbers: ReportNumbers;
  category: string;
  threshold?: number;
}): string {
  let status = "🔵"; // blue by default
  let percent = `${reportNumbers.pct}%`;

  if (threshold !== undefined) {
    percent = `${percent} (🎯 ${threshold}%)`;
    status = reportNumbers.pct >= threshold ? "🟢" : "🔴";
  }

  return `
    <td align="center">${status}</td>
    <td align="left">${category}</td>
    <td align="right">${percent}</td>
    <td align="right">${reportNumbers.covered} / ${reportNumbers.total}</td>
  `;
}

function generateFileCoverageSection(jsonSummary: JsonSummary, maxFiles: number): string {
  const fileEntries = Object.entries(jsonSummary)
    .filter(([key]) => key !== 'total')
    .slice(0, maxFiles);
    
  if (fileEntries.length === 0) {
    return '';
  }
  
  const fileRows = fileEntries
    .map(([filePath, coverage]) => generateFileCoverageRow(filePath, coverage))
    .join('\n');
    
  return `
<details>
<summary>📁 File Coverage (${fileEntries.length} files)</summary>

| File | Lines | Statements | Functions | Branches | Uncovered Lines |
|------|-------|------------|-----------|----------|----------------|
${fileRows}

</details>`;
}

function generateFileCoverageRow(filePath: string, coverage: CoverageReport): string {
  const formatPercentage = (report: ReportNumbers): string => {
    const emoji = report.pct >= 80 ? '🟢' : report.pct >= 60 ? '🟡' : '🔴';
    return `${emoji} ${report.pct}%`;
  };
  
  const formatUncoveredLines = (uncoveredLines?: number[]): string => {
    if (!uncoveredLines || uncoveredLines.length === 0) {
      return '-';
    }
    
    // Group consecutive numbers into ranges
    const ranges: string[] = [];
    let start = uncoveredLines[0];
    let end = uncoveredLines[0];
    
    for (let i = 1; i < uncoveredLines.length; i++) {
      if (uncoveredLines[i] === end + 1) {
        end = uncoveredLines[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = uncoveredLines[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    
    // Limit display length
    const rangeStr = ranges.join(', ');
    return rangeStr.length > 30 ? `${rangeStr.slice(0, 27)}...` : rangeStr;
  };
  
  const displayPath = filePath.length > 40 
    ? `...${filePath.slice(-37)}` 
    : filePath;
    
  return `| \`${displayPath}\` | ${formatPercentage(coverage.lines)} | ${formatPercentage(coverage.statements)} | ${formatPercentage(coverage.functions)} | ${formatPercentage(coverage.branches)} | ${formatUncoveredLines(coverage.uncoveredLines)} |`;
}