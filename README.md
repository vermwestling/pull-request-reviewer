# Pull Request reviewer
GitHub action that reviews pull request.

## Inputs

| name         | required | type   | default         | description |
| ------------ | ---      | ------ | --------------- | ----------- |
| api-endpoint | no       | string | `"https://api.openai.com/v1/chat/completions"`  | The URL to then API endpoint.
| api-key      | no       | string | | The API key to use for the API endpoint.
| model        | yes      | string | `"gpt-4o-mini"`   | ID of the model to use.
| review-type  | no       | string | `"File comment"`   | The type of code review. Value 'PR comment' will post a single review comment on the PR. Value 'File comment' will post review comments on lines in files.


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

### Configuration for using a local model
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

