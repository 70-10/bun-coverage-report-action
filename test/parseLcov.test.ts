import { describe, it, expect } from "bun:test";
import { parseLcov } from "../src/inputs/parseLcov";
import { join } from "path";

describe("parseLcov", () => {
  const sampleLcovPath = join(__dirname, "fixtures", "lcov.info");
  
  it("should parse LCOV file and return JsonSummary format", async () => {
    const result = await parseLcov(sampleLcovPath);
    
    expect(result).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.total.lines).toBeDefined();
    expect(result.total.statements).toBeDefined();
    expect(result.total.functions).toBeDefined();
    expect(result.total.branches).toBeDefined();
  });

  it("should correctly calculate total coverage from LCOV", async () => {
    const result = await parseLcov(sampleLcovPath);
    
    // Total lines: 10 + 5 = 15, covered: 8 + 5 = 13
    expect(result.total.lines.total).toBe(15);
    expect(result.total.lines.covered).toBe(13);
    expect(result.total.lines.pct).toBeCloseTo(86.67, 2);
    
    // Total functions: 2 + 1 = 3, covered: 1 + 1 = 2
    expect(result.total.functions.total).toBe(3);
    expect(result.total.functions.covered).toBe(2);
    expect(result.total.functions.pct).toBeCloseTo(66.67, 2);
    
    // Total branches: 4 + 2 = 6, covered: 3 + 2 = 5
    expect(result.total.branches.total).toBe(6);
    expect(result.total.branches.covered).toBe(5);
    expect(result.total.branches.pct).toBeCloseTo(83.33, 2);
  });

  it("should include individual file coverage", async () => {
    const result = await parseLcov(sampleLcovPath);
    
    expect(result["src/example.ts"]).toBeDefined();
    expect(result["src/utils.ts"]).toBeDefined();
    
    // Check first file
    const exampleFile = result["src/example.ts"];
    expect(exampleFile.lines.total).toBe(10);
    expect(exampleFile.lines.covered).toBe(8);
    expect(exampleFile.functions.total).toBe(2);
    expect(exampleFile.functions.covered).toBe(1);
    
    // Check second file
    const utilsFile = result["src/utils.ts"];
    expect(utilsFile.lines.total).toBe(5);
    expect(utilsFile.lines.covered).toBe(5);
    expect(utilsFile.functions.total).toBe(1);
    expect(utilsFile.functions.covered).toBe(1);
  });

  it("should handle non-existent LCOV file", async () => {
    const nonExistentPath = join(__dirname, "fixtures", "nonexistent.info");
    
    await expect(parseLcov(nonExistentPath)).rejects.toThrow();
  });

  it("should handle empty LCOV file", async () => {
    const emptyLcovPath = join(__dirname, "fixtures", "empty.info");
    
    // Create empty file for test
    await Bun.write(emptyLcovPath, "");
    
    const result = await parseLcov(emptyLcovPath);
    
    expect(result.total.lines.total).toBe(0);
    expect(result.total.lines.covered).toBe(0);
    expect(result.total.lines.pct).toBe(0);
  });

  it("should parse DA lines correctly for accurate coverage calculation", async () => {
    const daLcovPath = join(__dirname, "fixtures", "lcov-with-da.info");
    const result = await parseLcov(daLcovPath);
    
    // Based on DA lines:
    // src/example.ts: 10 total lines, 8 covered (lines 1,2,3,4,7,8,9,10), 2 uncovered (lines 5,6)
    // src/utils.ts: 5 total lines, 5 covered (lines 1,2,3,4,5)
    // Total: 15 lines, 13 covered = 86.67%
    
    expect(result.total.lines.total).toBe(15);
    expect(result.total.lines.covered).toBe(13);
    expect(result.total.lines.pct).toBeCloseTo(86.67, 2);
    
    // Check individual files
    const exampleFile = result["src/example.ts"];
    expect(exampleFile.lines.total).toBe(10);
    expect(exampleFile.lines.covered).toBe(8);
    expect(exampleFile.lines.pct).toBeCloseTo(80.0, 2);
    expect(exampleFile.uncoveredLines).toEqual([5, 6]);
    
    const utilsFile = result["src/utils.ts"];
    expect(utilsFile.lines.total).toBe(5);
    expect(utilsFile.lines.covered).toBe(5);
    expect(utilsFile.lines.pct).toBeCloseTo(100.0, 2);
    expect(utilsFile.uncoveredLines).toEqual([]);
  });

  it("should handle LCOV file with realistic coverage data similar to bun output", async () => {
    // Create a test file that simulates the current project's coverage structure
    const realisticLcovPath = join(__dirname, "fixtures", "realistic-lcov.info");
    const realisticContent = `TN:
SF:src/index.ts
FNF:4
FNH:4
DA:1,5
DA:2,5
DA:3,3
DA:4,3
DA:5,2
DA:6,2
DA:7,1
DA:8,1
DA:9,1
LF:9
LH:9
end_of_record`;
    
    await Bun.write(realisticLcovPath, realisticContent);
    
    const result = await parseLcov(realisticLcovPath);
    
    // All 9 DA lines have hit count > 0, so coverage should be 100%
    expect(result.total.lines.total).toBe(9);
    expect(result.total.lines.covered).toBe(9);
    expect(result.total.lines.pct).toBe(100);
    
    const indexFile = result["src/index.ts"];
    expect(indexFile.lines.total).toBe(9);
    expect(indexFile.lines.covered).toBe(9);
    expect(indexFile.lines.pct).toBe(100);
    expect(indexFile.uncoveredLines).toEqual([]);
  });
});