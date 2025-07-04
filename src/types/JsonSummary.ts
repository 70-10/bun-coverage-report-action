export type ReportNumbers = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

export type CoverageReport = {
  lines: ReportNumbers;
  statements: ReportNumbers;
  functions: ReportNumbers;
  branches: ReportNumbers;
  uncoveredLines?: number[];
};

export type JsonSummary = {
  total: CoverageReport;
  [key: string]: CoverageReport;
};