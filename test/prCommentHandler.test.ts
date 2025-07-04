import { describe, it, expect, mock, beforeEach } from "bun:test";
import { postOrUpdateComment } from "../src/report/prCommentHandler";

// Mock @actions/core
const mockCore = {
  info: mock(() => {}),
  error: mock(() => {}),
  warning: mock(() => {}),
};

// Mock @actions/github
const mockGithub = {
  context: {
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
};

// Mock modules
mock.module("@actions/core", () => mockCore);
mock.module("@actions/github", () => mockGithub);

describe("postOrUpdateComment", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockCore.info.mockClear();
    mockCore.error.mockClear();
    mockCore.warning.mockClear();
  });

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

    expect(mockCore.info).toHaveBeenCalledWith(
      "No pull request number found. Skipping comment creation."
    );
  });

  it("should create new comment when no existing comment found", async () => {
    const mockCreateComment = mock(() => Promise.resolve({ data: { id: 123 } }));
    const mockOctokit = {
      rest: {
        issues: {
          createComment: mockCreateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          yield { data: [] }; // No existing comments
        }),
      },
    };

    await postOrUpdateComment({
      octokit: mockOctokit,
      prNumber: 1,
      body: "Test coverage comment",
    });

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 1,
      body: "Test coverage comment\n\n<!-- bun-coverage-report-marker -->",
    });

    expect(mockCore.info).toHaveBeenCalledWith("Created new coverage comment");
  });

  it("should update existing comment when marker found", async () => {
    const existingComment = {
      id: 456,
      body: "Old comment\n\n<!-- bun-coverage-report-marker -->",
    };

    const mockUpdateComment = mock(() => Promise.resolve({ data: existingComment }));
    const mockOctokit = {
      rest: {
        issues: {
          updateComment: mockUpdateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          yield { data: [existingComment] }; // Existing comment found
        }),
      },
    };

    await postOrUpdateComment({
      octokit: mockOctokit,
      prNumber: 1,
      body: "Updated coverage comment",
    });

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      comment_id: 456,
      body: "Updated coverage comment\n\n<!-- bun-coverage-report-marker -->",
    });

    expect(mockCore.info).toHaveBeenCalledWith("Updated existing comment with ID: 456");
  });

  it("should handle create comment API error", async () => {
    const mockCreateComment = mock(() => Promise.reject(new Error("API Error")));
    const mockOctokit = {
      rest: {
        issues: {
          createComment: mockCreateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          yield { data: [] }; // No existing comments
        }),
      },
    };

    await expect(
      postOrUpdateComment({
        octokit: mockOctokit,
        prNumber: 1,
        body: "Test body",
      })
    ).rejects.toThrow("API Error");

    expect(mockCore.error).toHaveBeenCalledWith("Failed to post or update comment: Error: API Error");
  });

  it("should handle update comment API error", async () => {
    const existingComment = {
      id: 456,
      body: "Old comment\n\n<!-- bun-coverage-report-marker -->",
    };

    const mockUpdateComment = mock(() => Promise.reject(new Error("Update API Error")));
    const mockOctokit = {
      rest: {
        issues: {
          updateComment: mockUpdateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          yield { data: [existingComment] };
        }),
      },
    };

    await expect(
      postOrUpdateComment({
        octokit: mockOctokit,
        prNumber: 1,
        body: "Updated body",
      })
    ).rejects.toThrow("Update API Error");

    expect(mockCore.error).toHaveBeenCalledWith("Failed to post or update comment: Error: Update API Error");
  });

  it("should handle findCommentByMarker API error gracefully", async () => {
    const mockCreateComment = mock(() => Promise.resolve({ data: { id: 789 } }));
    const mockOctokit = {
      rest: {
        issues: {
          createComment: mockCreateComment,
        },
      },
      paginate: {
        iterator: mock(() => {
          throw new Error("Paginate Error");
        }),
      },
    };

    await postOrUpdateComment({
      octokit: mockOctokit,
      prNumber: 1,
      body: "Test body",
    });

    // Should still create a new comment even if search fails
    expect(mockCreateComment).toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalledWith("Failed to search for existing comments: Error: Paginate Error");
    expect(mockCore.info).toHaveBeenCalledWith("Created new coverage comment");
  });

  it("should find comment with marker in multiple pages", async () => {
    const targetComment = {
      id: 999,
      body: "Target comment\n\n<!-- bun-coverage-report-marker -->",
    };

    const mockUpdateComment = mock(() => Promise.resolve({ data: targetComment }));
    const mockOctokit = {
      rest: {
        issues: {
          updateComment: mockUpdateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          // First page - no marker
          yield { data: [{ id: 1, body: "Regular comment 1" }] };
          // Second page - has marker
          yield { data: [{ id: 2, body: "Regular comment 2" }, targetComment] };
        }),
      },
    };

    await postOrUpdateComment({
      octokit: mockOctokit,
      prNumber: 1,
      body: "Test body",
    });

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      comment_id: 999,
      body: "Test body\n\n<!-- bun-coverage-report-marker -->",
    });
  });

  it("should handle comment without body property", async () => {
    const mockCreateComment = mock(() => Promise.resolve({ data: { id: 101 } }));
    const mockOctokit = {
      rest: {
        issues: {
          createComment: mockCreateComment,
        },
      },
      paginate: {
        iterator: mock(function* () {
          yield { data: [{ id: 1 }, { id: 2, body: null }] }; // Comments without body
        }),
      },
    };

    await postOrUpdateComment({
      octokit: mockOctokit,
      prNumber: 1,
      body: "Test body",
    });

    // Should create new comment since no marker found
    expect(mockCreateComment).toHaveBeenCalled();
  });
});