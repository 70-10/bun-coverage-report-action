import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { run } from "../src/index";

describe("main index", () => {
  beforeEach(() => {
    // Mock @actions/core
    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        const inputs: Record<string, string> = {
          "lcov-path": "test/fixtures/sample.lcov",
          "min-coverage": "80",
          "github-token": "",
        };
        return inputs[name] || "";
      },
      info: () => {},
      warning: () => {},
      error: () => {},
      setFailed: () => {},
    }));
  });

  afterEach(() => {
    // Clean up mocks
    mock.restore();
  });

  it("should be importable", () => {
    expect(typeof run).toBe("function");
  });

  it("should handle missing LCOV file gracefully", async () => {
    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        if (name === "lcov-path") return "nonexistent.lcov";
        return "";
      },
      info: () => {},
      warning: () => {},
      error: () => {},
      setFailed: (message: string) => {
        expect(message).toContain("LCOV file not found");
      },
    }));

    await run();
  });

  it("should execute without throwing when all inputs are valid", async () => {
    // Create a simple LCOV file for testing
    const testLcovContent = `TN:
SF:test/sample.js
FNF:1
FNH:1
DA:1,1
DA:2,1
LF:2
LH:2
end_of_record
`;
    
    await Bun.write("test/fixtures/sample.lcov", testLcovContent);

    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        if (name === "lcov-path") return "test/fixtures/sample.lcov";
        if (name === "min-coverage") return "0"; // Set low threshold to avoid failures
        return "";
      },
      info: () => {},
      warning: () => {},
      error: () => {},
      setFailed: () => {},
    }));

    // Should complete successfully
    await run();
  });

  it("should show warning when coverage thresholds are not met", async () => {
    // Create LCOV file with low coverage
    const lowCoverageLcovContent = `TN:
SF:test/sample.js
FNF:1
FNH:0
DA:1,0
DA:2,0
DA:3,0
DA:4,0
LF:4
LH:1
end_of_record
`;
    
    await Bun.write("test/fixtures/low-coverage.lcov", lowCoverageLcovContent);

    const warnings: string[] = [];
    
    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        if (name === "lcov-path") return "test/fixtures/low-coverage.lcov";
        if (name === "min-coverage") return "90"; // High threshold to trigger failure
        return "";
      },
      info: () => {},
      warning: (message: string) => {
        warnings.push(message);
      },
      error: () => {},
      setFailed: () => {},
    }));

    await run();

    // Check that warning messages were logged
    expect(warnings.some(w => w.includes("⚠️ Threshold failures:"))).toBe(true);
    expect(warnings.some(w => w.includes("Lines coverage"))).toBe(true);
  });

  it("should fail action when coverage thresholds are not met", async () => {
    // Create LCOV file with low coverage
    const lowCoverageLcovContent = `TN:
SF:test/sample.js
FNF:1
FNH:0
DA:1,0
DA:2,0
DA:3,0
DA:4,0
LF:4
LH:1
end_of_record
`;
    
    await Bun.write("test/fixtures/low-coverage.lcov", lowCoverageLcovContent);

    let failureMessage = "";
    
    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        if (name === "lcov-path") return "test/fixtures/low-coverage.lcov";
        if (name === "min-coverage") return "90"; // High threshold to trigger failure
        return "";
      },
      info: () => {},
      warning: () => {},
      error: () => {},
      setFailed: (message: string) => {
        failureMessage = message;
      },
    }));

    await run();

    // Check that setFailed was called with appropriate message
    expect(failureMessage).toContain("❌ Coverage thresholds not met:");
    expect(failureMessage).toContain("Lines coverage");
  });

  it("should handle GitHub API errors gracefully", async () => {
    // Create a valid LCOV file
    const testLcovContent = `TN:
SF:test/sample.js
FNF:1
FNH:1
DA:1,1
DA:2,1
LF:2
LH:2
end_of_record
`;
    
    await Bun.write("test/fixtures/sample.lcov", testLcovContent);

    const warnings: string[] = [];

    // Mock GitHub modules to simulate API error
    mock.module("@actions/github", () => ({
      getOctokit: () => {
        throw new Error("GitHub API Error");
      },
      context: {
        eventName: "pull_request",
        payload: {
          pull_request: {
            number: 123
          }
        }
      }
    }));
    
    mock.module("@actions/core", () => ({
      getInput: (name: string) => {
        if (name === "lcov-path") return "test/fixtures/sample.lcov";
        if (name === "min-coverage") return "0";
        if (name === "github-token") return "fake-token";
        return "";
      },
      info: () => {},
      warning: (message: string) => {
        warnings.push(message);
      },
      error: () => {},
      setFailed: () => {},
    }));

    await run();

    // Check that GitHub API error was handled gracefully
    expect(warnings.some(w => w.includes("❌ Failed to post comment:"))).toBe(true);
  });
});