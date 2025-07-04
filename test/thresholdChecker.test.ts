import { describe, it, expect } from "bun:test";
import { checkCoverageThresholds } from "../src/coverage/thresholdChecker";
import type { JsonSummary } from "../src/types/JsonSummary";

describe("checkCoverageThresholds", () => {
  const mockJsonSummary: JsonSummary = {
    total: {
      lines: { total: 100, covered: 85, skipped: 15, pct: 85 },
      statements: { total: 100, covered: 85, skipped: 15, pct: 85 },
      functions: { total: 20, covered: 18, skipped: 2, pct: 90 },
      branches: { total: 40, covered: 32, skipped: 8, pct: 80 },
    },
  };

  it("should pass when all thresholds are met", () => {
    const thresholds = {
      lines: 80,
      statements: 80,
      functions: 85,
      branches: 75,
    };

    const result = checkCoverageThresholds(mockJsonSummary, thresholds);

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should fail when some thresholds are not met", () => {
    const thresholds = {
      lines: 90, // 85% < 90% - should fail
      functions: 95, // 90% < 95% - should fail
      branches: 75, // 80% >= 75% - should pass
    };

    const result = checkCoverageThresholds(mockJsonSummary, thresholds);

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(2);
    expect(result.failures).toContain("Lines coverage 85% is below threshold 90%");
    expect(result.failures).toContain("Functions coverage 90% is below threshold 95%");
  });

  it("should pass when no thresholds are defined", () => {
    const result = checkCoverageThresholds(mockJsonSummary, {});

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should handle undefined thresholds", () => {
    const result = checkCoverageThresholds(mockJsonSummary);

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should return detailed failure information", () => {
    const thresholds = {
      lines: 90,
      branches: 85,
    };

    const result = checkCoverageThresholds(mockJsonSummary, thresholds);

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("Lines coverage 85% is below threshold 90%");
    expect(result.failures).toContain("Branches coverage 80% is below threshold 85%");
    expect(result.summary).toContain("2 of 2 thresholds failed");
  });

  it("should provide summary of results", () => {
    const thresholds = {
      lines: 80,  // pass
      functions: 95,  // fail
      branches: 75,  // pass
    };

    const result = checkCoverageThresholds(mockJsonSummary, thresholds);

    expect(result.passed).toBe(false);
    expect(result.summary).toContain("1 of 3 thresholds failed");
  });
});