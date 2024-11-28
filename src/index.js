import * as core from '@actions/core';
import { getOctokit, context } from "@actions/github";

async function createPullRequestComment(octokit, repository, pullRequest, comment) {
  await octokit.rest.issues.createComment({
    owner: repository.owner.login,
    repo: repository.name,
    issue_number: pullRequest.number,
    body: comment
  });
}

async function main() {
  console.log(`Pull request reviewer`);
  const octokit = getOctokit(process.env.GITHUB_TOKEN);
  const pullRequest = context.payload.pull_request;
  const repository = context.payload.repository; 

  if (!pullRequest) {
    core.setFailed("❌ Expecting pull_request.");
    return;
  }
  if (!repository) {
    core.setFailed("❌ Expecting repository.");
    return;
  }

  await createPullRequestComment(octokit, repository, pullRequest, "PR comment from GitHub action");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
