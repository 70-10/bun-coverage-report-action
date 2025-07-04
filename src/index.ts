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

    core.info(`🎯 Bun Coverage Report Action starting...`);
    core.info(`📁 LCOV file path: ${lcovPath}`);
    core.info(`📊 Minimum coverage threshold: ${minCoverage}%`);
    core.info(`🔑 GitHub token available: ${githubToken ? 'Yes' : 'No'}`);

    // Check if LCOV file exists
    try {
      await import("fs").then(fs => fs.promises.access(lcovPath));
      core.info(`✅ LCOV file found at: ${lcovPath}`);
    } catch (error) {
      core.error(`❌ LCOV file not found at: ${lcovPath}`);
      throw new Error(`LCOV file not found: ${lcovPath}. Please ensure 'bun test --coverage --coverage-reporter=lcov' was run successfully.`);
    }

    // Parse LCOV file
    const jsonSummary = await parseLcov(lcovPath);
    const fileCount = Object.keys(jsonSummary).length - 1;
    core.info(`📄 Parsed coverage data for ${fileCount} files`);
    
    // Log coverage summary
    const { total } = jsonSummary;
    core.info(`📈 Coverage Summary:`);
    core.info(`  Lines: ${total.lines.covered}/${total.lines.total} (${total.lines.pct}%)`);
    core.info(`  Functions: ${total.functions.covered}/${total.functions.total} (${total.functions.pct}%)`);
    core.info(`  Branches: ${total.branches.covered}/${total.branches.total} (${total.branches.pct}%)`);
    core.info(`  Statements: ${total.statements.covered}/${total.statements.total} (${total.statements.pct}%)`);

    // Check thresholds
    const thresholds = {
      lines: minCoverage,
    };

    const thresholdResult = checkCoverageThresholds(jsonSummary, thresholds);
    core.info(`🎯 Threshold check: ${thresholdResult.summary}`);
    
    if (thresholdResult.failures.length > 0) {
      core.warning(`⚠️ Threshold failures:`);
      thresholdResult.failures.forEach(failure => core.warning(`  - ${failure}`));
    }

    // Generate comment
    const commentBody = generateCoverageComment(jsonSummary, { thresholds });
    core.info("📝 Generated coverage comment");

    // Post comment if in PR context
    if (githubToken) {
      try {
        const octokit = github.getOctokit(githubToken);
        const prNumber = github.context.payload.pull_request?.number;
        const eventName = github.context.eventName;
        
        core.info(`🔍 GitHub context - Event: ${eventName}, PR Number: ${prNumber || 'N/A'}`);

        if (prNumber) {
          await postOrUpdateComment({
            octokit,
            prNumber,
            body: commentBody,
          });
          core.info(`💬 Posted coverage comment to PR #${prNumber}`);
        } else {
          core.info("ℹ️ No PR context found, skipping comment creation");
        }
      } catch (error) {
        core.warning(`❌ Failed to post comment: ${error}`);
      }
    } else {
      core.warning("🔑 No GitHub token provided, skipping comment creation");
    }

    // Fail the action if thresholds are not met
    if (!thresholdResult.passed) {
      const failureMessage = `❌ Coverage thresholds not met:\n${thresholdResult.failures.join('\n')}`;
      core.setFailed(failureMessage);
      return;
    }

    core.info("✅ Coverage report completed successfully");
  } catch (error) {
    core.error(`💥 Action failed with error: ${error}`);
    core.setFailed(`Action failed: ${error}`);
  }
}

// Run the action if this file is executed directly
if (import.meta.main) {
  run();
}