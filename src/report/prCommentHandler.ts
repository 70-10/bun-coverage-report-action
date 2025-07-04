import * as core from "@actions/core";
import * as github from "@actions/github";

const COMMENT_MARKER = "<!-- bun-coverage-report-marker -->";

interface CommentOptions {
  octokit: any;
  prNumber?: number;
  body: string;
}

export async function postOrUpdateComment({
  octokit,
  prNumber,
  body,
}: CommentOptions): Promise<void> {
  if (!prNumber) {
    core.info("No pull request number found. Skipping comment creation.");
    return;
  }

  try {
    const commentBody = `${body}\n\n${COMMENT_MARKER}`;
    const existingComment = await findCommentByMarker(octokit, prNumber);

    if (existingComment) {
      await octokit.rest.issues.updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: existingComment.id,
        body: commentBody,
      });
      core.info(`Updated existing comment with ID: ${existingComment.id}`);
    } else {
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        body: commentBody,
      });
      core.info("Created new coverage comment");
    }
  } catch (error) {
    core.error(`Failed to post or update comment: ${error}`);
    throw error;
  }
}

async function findCommentByMarker(
  octokit: any,
  pullRequestNumber: number
): Promise<{ id: number; body?: string } | undefined> {
  try {
    const commentsIterator = octokit.paginate.iterator(
      octokit.rest.issues.listComments,
      {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pullRequestNumber,
      }
    );

    for await (const { data: comments } of commentsIterator) {
      const comment = comments.find((comment: any) =>
        comment.body?.includes(COMMENT_MARKER)
      );
      if (comment) {
        return comment;
      }
    }

    return undefined;
  } catch (error) {
    core.warning(`Failed to search for existing comments: ${error}`);
    return undefined;
  }
}