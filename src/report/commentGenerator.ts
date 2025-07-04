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
}

export function generateCoverageComment(
  jsonSummary: JsonSummary,
  options: CommentOptions = {}
): string {
  const { thresholds = {} } = options;
  
  const tableHtml = generateSummaryTableHtml(jsonSummary.total, thresholds);
  
  return `## Coverage Report

${tableHtml}

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