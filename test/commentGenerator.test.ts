import { describe, it, expect, mock } from "bun:test";
import { generateCoverageComment } from "../src/report/commentGenerator";
import type { JsonSummary } from "../src/types/JsonSummary";

describe("generateCoverageComment", () => {
  const mockJsonSummary: JsonSummary = {
    total: {
      lines: { total: 100, covered: 85, skipped: 15, pct: 85 },
      statements: { total: 100, covered: 85, skipped: 15, pct: 85 },
      functions: { total: 20, covered: 18, skipped: 2, pct: 90 },
      branches: { total: 40, covered: 32, skipped: 8, pct: 80 },
    },
    "src/example.ts": {
      lines: { total: 50, covered: 40, skipped: 10, pct: 80 },
      statements: { total: 50, covered: 40, skipped: 10, pct: 80 },
      functions: { total: 10, covered: 9, skipped: 1, pct: 90 },
      branches: { total: 20, covered: 16, skipped: 4, pct: 80 },
      uncoveredLines: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    },
    "src/utils.ts": {
      lines: { total: 30, covered: 30, skipped: 0, pct: 100 },
      statements: { total: 30, covered: 30, skipped: 0, pct: 100 },
      functions: { total: 5, covered: 5, skipped: 0, pct: 100 },
      branches: { total: 10, covered: 10, skipped: 0, pct: 100 },
      uncoveredLines: [],
    },
  };

  it("should generate basic coverage comment", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("Coverage Report");
    expect(result).toContain("Lines");
    expect(result).toContain("Statements");
    expect(result).toContain("Functions");
    expect(result).toContain("Branches");
  });

  it("should include correct coverage percentages", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("85%"); // Lines coverage
    expect(result).toContain("90%"); // Functions coverage
    expect(result).toContain("80%"); // Branches coverage
  });

  it("should include covered/total counts", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("85 / 100"); // Lines
    expect(result).toContain("18 / 20"); // Functions
    expect(result).toContain("32 / 40"); // Branches
  });

  it("should generate HTML table format", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("</table>");
  });

  it("should include comment marker", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("<!-- bun-coverage-report-marker");
  });

  it("should handle thresholds", () => {
    const thresholds = {
      lines: 90,
      functions: 85,
      branches: 75,
    };
    
    const result = generateCoverageComment(mockJsonSummary, { thresholds });
    
    expect(result).toContain("90%"); // threshold for lines
    expect(result).toContain("85%"); // threshold for functions
    expect(result).toContain("75%"); // threshold for branches
  });

  it("should show status icons for thresholds", () => {
    const thresholds = {
      lines: 90, // 85% coverage, below threshold
      functions: 85, // 90% coverage, above threshold
    };
    
    const result = generateCoverageComment(mockJsonSummary, { thresholds });
    
    // Should contain both green (pass) and red (fail) status indicators
    expect(result).toMatch(/🔴|❌|🟢|✅/);
  });

  it("should include file coverage section by default", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    expect(result).toContain("📁 File Coverage");
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>");
    expect(result).toContain("src/example.ts");
    expect(result).toContain("src/utils.ts");
    expect(result).toContain("Uncovered Lines");
  });

  it("should hide file coverage when showFileCoverage is false", () => {
    const result = generateCoverageComment(mockJsonSummary, { showFileCoverage: false });
    
    expect(result).not.toContain("📁 File Coverage");
    expect(result).not.toContain("<details>");
    expect(result).not.toContain("src/example.ts");
  });

  it("should limit files displayed with maxFiles option", () => {
    const result = generateCoverageComment(mockJsonSummary, { maxFiles: 1 });
    
    expect(result).toContain("📁 File Coverage (1 files)");
    // Should contain at least one file but not necessarily both
    const containsExample = result.includes("src/example.ts");
    const containsUtils = result.includes("src/utils.ts");
    expect(containsExample || containsUtils).toBe(true);
    expect(containsExample && containsUtils).toBe(false);
  });

  it("should format uncovered lines correctly", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    // Should contain uncovered lines for example.ts
    expect(result).toContain("5, 10, 15, 20, 25");
    // Should show dash for files with no uncovered lines
    expect(result).toMatch(/\|\s*-\s*\|/); // Match dash in table cell
  });

  it("should use emoji indicators for coverage percentages", () => {
    const result = generateCoverageComment(mockJsonSummary);
    
    // Should contain emoji indicators
    expect(result).toMatch(/🟢|🟡|🔴/);
  });

  it("should truncate long file paths", () => {
    const longPathSummary: JsonSummary = {
      total: mockJsonSummary.total,
      "src/very/deep/nested/directory/structure/with/a/really/long/file/path/example.ts": {
        lines: { total: 10, covered: 5, skipped: 5, pct: 50 },
        statements: { total: 10, covered: 5, skipped: 5, pct: 50 },
        functions: { total: 2, covered: 1, skipped: 1, pct: 50 },
        branches: { total: 4, covered: 2, skipped: 2, pct: 50 },
        uncoveredLines: [1, 2, 3, 4, 5],
      },
    };
    
    const result = generateCoverageComment(longPathSummary);
    
    // Should contain truncated path with ellipsis
    expect(result).toContain("...");
  });
});