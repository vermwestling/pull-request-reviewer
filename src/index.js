import * as core from '@actions/core';
import { getOctokit, context } from "@actions/github";

async function postApiCall(url, apiKey, data) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to post data: ${response.statusText}`);
  }

  return response.json();
}

async function getPullRequestDiff(octokit, repository, pull_request) {
  const owner = repository?.owner?.login;
  const repo = repository?.name;
  const pull_number = pull_request?.number;

  console.info(`PR code diff for: ${owner}, ${repo}, ${pull_number}`);
  if (!owner || !repo || typeof(pull_number) !== 'number') {
    throw Error('Missing data required for fetching pull request diff.');
  }

  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
    headers: { accept: "application/vnd.github.v3.diff" },
  });

  const diff = String(response.data);
  console.info(`Diff: ${diff}`);
  return diff;
}

async function doReview(apiEndpoint, apiKey, model, userPrompt) {
  const postData = {
      "model": model,
      "messages": [
          {
              "role": "system",
              "content": "You are a helpful assistant."
          },
          {
              "role": "user",
              "content": userPrompt
          }
      ]
    }

    const response = await postApiCall(apiEndpoint, apiKey, postData);
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.choices[0].message.content;
}

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
    core.setFailed("❌ Expecting context to contain pull_request.");
    return;
  }
  if (!repository) {
    core.setFailed("❌ Expecting context to contain repository.");
    return;
  }

  const apiEndpoint = core.getInput('api-endpoint');
  console.log(`API endpoint: ${apiEndpoint}`);
  const apiKey = core.getInput('api-key');
  console.log(`API key: ${apiKey}`);
  const model = core.getInput('model');
  console.log(`model: ${model}`);

  const diff = await getPullRequestDiff(octokit, repository, pullRequest);
  const review = await doReview(apiEndpoint, apiKey, model, diff);
  await createPullRequestComment(octokit, repository, pullRequest, `Review diff test:\n ${review}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
