import type { JsonSummary } from "../types/JsonSummary";

export type ThresholdConfig = {
  lines?: number;
  statements?: number;
  functions?: number;
  branches?: number;
};

export type ThresholdResult = {
  passed: boolean;
  failures: string[];
  summary: string;
};

export function checkCoverageThresholds(
  jsonSummary: JsonSummary,
  thresholds?: ThresholdConfig
): ThresholdResult {
  const failures: string[] = [];
  
  if (!thresholds) {
    return {
      passed: true,
      failures: [],
      summary: "No thresholds defined - all checks passed"
    };
  }

  const { total } = jsonSummary;
  const thresholdEntries = Object.entries(thresholds);
  
  if (thresholdEntries.length === 0) {
    return {
      passed: true,
      failures: [],
      summary: "No thresholds defined - all checks passed"
    };
  }

  // Check each threshold
  for (const [metric, threshold] of thresholdEntries) {
    const coverage = total[metric as keyof typeof total];
    if (coverage && coverage.pct < threshold) {
      const metricName = metric.charAt(0).toUpperCase() + metric.slice(1);
      failures.push(`${metricName} coverage ${coverage.pct}% is below threshold ${threshold}%`);
    }
  }

  const totalThresholds = thresholdEntries.length;
  const failedThresholds = failures.length;
  const passedThresholds = totalThresholds - failedThresholds;

  const summary = failedThresholds > 0 
    ? `${failedThresholds} of ${totalThresholds} thresholds failed`
    : `All ${totalThresholds} thresholds passed`;

  return {
    passed: failures.length === 0,
    failures,
    summary
  };
}