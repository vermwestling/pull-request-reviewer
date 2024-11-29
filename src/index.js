import * as core from '@actions/core';
import { getOctokit, context } from "@actions/github";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";
import parseDiff, { Chunk, File } from "parse-diff";

const octokit2 = new Octokit({ auth: process.env.GITHUB_TOKEN });
const API_ENDPOINT = core.getInput('api-endpoint');
const API_KEY = core.getInput('api-key');
const MODEL = core.getInput('model');
const REVIEW_TYPE = core.getInput('review-type');
const SYSTEM_PROMPT_MARKDOWN = "You are a helpful code reviewer that reviews pull request from Github. Data is in the form of code diff from a pull request. Answer in markdown format.";
const SYSTEM_PROMPT_TEXT = "You are a helpful code reviewer that reviews pull request from Github. Data is in the form of code diff from a pull request. Answer in plain text.";

async function getPullRequestDetails() {
  const { repository, number } = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH || "", "utf8")
  );
  const prResponse = await octokit2.pulls.get({
    owner: repository.owner.login,
    repo: repository.name,
    pull_number: number,
  });
  return {
    owner: repository.owner.login,
    repo: repository.name,
    pull_number: number,
    title: prResponse.data.title ?? "",
    description: prResponse.data.body ?? "",
  };
}


async function reviewCode(parsedDiff, prDetails) {
  const comments = [];

  for (const file of parsedDiff) {
    if (file.to === "/dev/null") continue;
    for (const chunk of file.chunks) {
      const prompt = createPrompt(file, chunk, prDetails);
      const aiResponse = await doReview(prompt, SYSTEM_PROMPT_TEXT);
      if (aiResponse) {
        core.info(`Review response: ${aiResponse}`);
        aiResponse = aiResponse.replace(/^(```json)/,"");
        aiResponse = aiResponse.replace(/(```)$/, "").trim();
        core.info(`Review trimmed response: ${aiResponse}`);
        const newComments = createComment(file, chunk, aiResponse);
        if (newComments) {
          comments.push(...newComments);
        }
      }
    }
  }
  return comments;
}


function createComment(file, chunk, aiResponse) {
  if (typeof aiResponse === 'string') {
    try {
      aiResponse = JSON.parse(aiResponse);
    } catch (error) {
      core.error(`Failed to parse AI responses: ${error.message}`);
      return [];
    }
  }
  
  return aiResponse['reviews'].flatMap((review) => {
    if (!file.to) {
      return [];
    }

    return {
      body: review.reviewComment,
      path: file.to,
      line: review.lineNumber,
    };
  });
}


function createPrompt(file, chunk, prDetails) {
  return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format: {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Write the review comment in valid JSON character. It will be parsed by the system.
- Inspect Javadoc and verify that the documentation is correct and matches the implementation.
- Focus on bugs, security issues, and performance problems.
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.

Review the following code diff in the file "${
    file.to
  }" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
}


async function createReviewComment(
  owner,
  repo,
  pull_number,
  comments) {
  await octokit2.pulls.createReview({
    owner,
    repo,
    pull_number,
    comments,
    event: "COMMENT",
  });
}


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


async function getPullRequestDiff2(owner, repo, pull_number) {
  const response = await octokit2.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: "diff" },
  });
  const diff = String(response.data);
  console.info(`Diff: ${diff}`);
  return response.data;
}


async function doReview(userPrompt, systemPrompt) {
  const postData = {
      "model": MODEL,
      "messages": [
          {
              "role": "system",
              "content": systemPrompt
          },
          {
              "role": "user",
              "content": userPrompt
          }
      ]
    }

    const response = await postApiCall(API_ENDPOINT, API_KEY, postData);
    console.log(`Response: ${JSON.stringify(response)}`);
    //return response.choices[0].message?.content?.trim() || "{}"; 
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

  console.log(`API endpoint: ${API_ENDPOINT}`);
  core.info(`model: ${MODEL}`);

  core.info(`Reivew type: ${REVIEW_TYPE}`);
  if (REVIEW_TYPE === 'PR comment') {
    // Review by posting a single comment on the PR
    core.info(`Adding PR comment`);
    const diff = await getPullRequestDiff(octokit, repository, pullRequest);
    const review = await doReview(diff, SYSTEM_PROMPT_MARKDOWN);
    await createPullRequestComment(octokit, repository, pullRequest, review);
  } else if (REVIEW_TYPE === 'File comment') {
    // Review by posting comments in the file that is affected.
    core.info(`Adding file comment`);
    const prDetails = await getPullRequestDetails();
    core.info(`getPRDetails: ${prDetails}`);
    const diff = await getPullRequestDiff2(prDetails.owner, prDetails.repo, prDetails.pull_number);
    const parsedDiff = parseDiff(diff);

    const comments = await reviewCode(parsedDiff, prDetails);
    if (comments.length > 0) {
      await createReviewComment(
        prDetails.owner,
        prDetails.repo,
        prDetails.pull_number,
        comments
      );
    }
  } else {
    core.setFailed(`❌ Invalid review type ${REVIEW_TYPE}.`);
  }

}


main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
