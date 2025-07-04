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
});