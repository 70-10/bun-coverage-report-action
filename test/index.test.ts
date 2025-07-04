import { describe, it, expect } from "bun:test";
import { run } from "../src/index";

describe("main index", () => {
  it("should exist and be callable", () => {
    expect(typeof run).toBe("function");
  });

  it("should be an async function", () => {
    const result = run();
    expect(result).toBeInstanceOf(Promise);
    // Clean up the promise to avoid unhandled rejection
    result.catch(() => {});
  });
});