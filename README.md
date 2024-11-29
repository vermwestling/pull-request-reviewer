# Pull Request Reviewer
GitHub action that performs an automated code review of GitHub pull requests.

## Example pull requests
PR examples of reviewing Java code with three known issues:
* Constructor is not private.
* Incorrect null check in reverseString method.
* Javadoc for method does not match implementation.

### Review type: PR comment
[PR example 1 - model Codestral by Mistal AI](https://github.com/vermwestling/pull-request-reviewer/pull/11)

[PR example 2 - model Codestral by Mistal AI](https://github.com/vermwestling/pull-request-reviewer/pull/15)

[PR example 3 - model Qwen Coder by Alibaba](https://github.com/vermwestling/pull-request-reviewer/pull/17)

[PR example 4 - model GPT-4o by OpenAI](https://github.com/vermwestling/pull-request-reviewer/pull/20)

[PR example 5 - model Deepseek Coder v2 by High-Flyer](https://github.com/vermwestling/pull-request-reviewer/pull/24)

### Review type: File comment
[PR example 1 - model Codestral by Mistal AI](https://github.com/vermwestling/pull-request-reviewer/pull/13)

[PR example 2 - model Qwen Coder by Alibaba](https://github.com/vermwestling/pull-request-reviewer/pull/19)

[PR example 3 - model GPT-4o by OpenAI](https://github.com/vermwestling/pull-request-reviewer/pull/23)

## Inputs

| Name         | Required | Type   | Default         | Description |
| ------------ | ---      | ------ | --------------- | ----------- |
| api-endpoint | no       | string | `"https://api.openai.com/v1/chat/completions"`  | The URL to then API endpoint.
| api-key      | no       | string | | The API key to use for the API endpoint.
| model        | yes      | string | `"gpt-4o-mini"`   | ID of the model to use.
| review-type  | no       | string | `"PR comment"`   | The type of code review. Value 'PR comment' will post a single review comment on the PR. Value 'File comment' will post review comments on lines in files.


## Example usage

### Configuration for using OpenAI model
The example below shows the configuration for the OpenAI gpt-4o-mini model
```yml
name: "Pull Request"
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  pull-request:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      contents: write
    name: Pull Request Reviewer
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v3

      - name: Review PR
        uses: vermwestling/pull-request-reviewer@main
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
          model: 'gpt-4o-mini'
          review-type: 'File comment'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Configuration for using a local hosted model
The example below shows the Mistral Codestral model running on a local machine using Ollama
```yml
name: "Pull Request"
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  pull-request:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      contents: write
    name: Pull Request Reviewer
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v3

      - name: Review PR
        uses: vermwestling/pull-request-reviewer@main
        with:
          api-endpoint: 'https://some-host/v1/chat/completions'
          model: 'codestral'
          review-type: 'File comment'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

