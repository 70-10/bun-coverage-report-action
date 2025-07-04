import * as core from "@actions/core";
import * as github from "@actions/github";
import { parseLcov } from "./inputs/parseLcov";
import { generateCoverageComment } from "./report/commentGenerator";
import { postOrUpdateComment } from "./report/prCommentHandler";
import { checkCoverageThresholds } from "./coverage/thresholdChecker";

export async function run(): Promise<void> {
  try {
    // Get inputs
    const lcovPath = core.getInput("lcov-path") || "coverage/lcov.info";
    const minCoverageInput = core.getInput("min-coverage");
    const minCoverage = minCoverageInput ? parseFloat(minCoverageInput) : 0;
    const githubToken = core.getInput("github-token") || process.env.GITHUB_TOKEN;

    core.info(`Reading LCOV file from: ${lcovPath}`);

    // Parse LCOV file
    const jsonSummary = await parseLcov(lcovPath);
    core.info(`Parsed coverage data for ${Object.keys(jsonSummary).length - 1} files`);

    // Check thresholds
    const thresholds = {
      lines: minCoverage,
    };

    const thresholdResult = checkCoverageThresholds(jsonSummary, thresholds);
    core.info(`Threshold check: ${thresholdResult.summary}`);

    // Generate comment
    const commentBody = generateCoverageComment(jsonSummary, { thresholds });
    core.info("Generated coverage comment");

    // Post comment if in PR context
    if (githubToken) {
      try {
        const octokit = github.getOctokit(githubToken);
        const prNumber = github.context.payload.pull_request?.number;

        if (prNumber) {
          await postOrUpdateComment({
            octokit,
            prNumber,
            body: commentBody,
          });
          core.info(`Posted coverage comment to PR #${prNumber}`);
        } else {
          core.info("No PR context found, skipping comment creation");
        }
      } catch (error) {
        core.warning(`Failed to post comment: ${error}`);
      }
    } else {
      core.warning("No GitHub token provided, skipping comment creation");
    }

    // Fail the action if thresholds are not met
    if (!thresholdResult.passed) {
      const failureMessage = `Coverage thresholds not met:\n${thresholdResult.failures.join('\n')}`;
      core.setFailed(failureMessage);
      return;
    }

    core.info("Coverage report completed successfully");
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

// Run the action if this file is executed directly
if (import.meta.main) {
  run();
}