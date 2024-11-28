import * as core from '@actions/core';
import { getOctokit, context } from "@actions/github";
import doReview from './pull-request-reviewer';

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

  const apiEndpoint = core.getInput('api-endpoint');
  console.log(`API endpoint: ${apiEndpoint}`);
  const apiKey = core.getInput('api-key');
  console.log(`API key: ${apiKey}`);
  const model = core.getInput('model');
  console.log(`model: ${model}`);

  const review = await doReview(apiEndpoint, apiKey, model, "Hello!");
  await createPullRequestComment(octokit, repository, pullRequest, `Review test:\n ${review}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
