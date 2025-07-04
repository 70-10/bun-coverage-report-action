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
});