import { describe, it, expect } from "bun:test";
import { postOrUpdateComment } from "../src/report/prCommentHandler";

describe("postOrUpdateComment", () => {
  it("should exist and be callable", () => {
    expect(typeof postOrUpdateComment).toBe("function");
  });

  it("should handle missing PR number gracefully", async () => {
    const mockOctokit = {
      rest: { issues: {} },
      paginate: { iterator: () => [] },
    };

    // Should not throw when PR number is undefined
    await expect(
      postOrUpdateComment({
        octokit: mockOctokit,
        prNumber: undefined,
        body: "Test body",
      })
    ).resolves.toBeUndefined();
  });
});