// Contribution snake section for the README generator, drawn by
// https://github.com/Platane/snk. The copied workflow pushes the SVGs to an
// `output` branch of the profile repo, and the README loads them from there.

export const SNAKE_WORKFLOW_PATH = '.github/workflows/snake.yml';
export const SNAKE_SOURCE_URL = 'https://github.com/Platane/snk';

const USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;

/**
 * Where the workflow publishes the SVGs, or null for a username that is not
 * a valid GitHub login (the URLs go straight into README HTML).
 */
export const snakeImageUrls = (username) => {
  const login = String(username ?? '').trim();
  if (!USERNAME_PATTERN.test(login)) return null;
  const base = `https://raw.githubusercontent.com/${login}/${login}/output`;
  return { light: `${base}/github-snake.svg`, dark: `${base}/github-snake-dark.svg` };
};

export const buildSnakeWorkflow = () => `# Draws a snake eating your contribution graph and pushes the SVGs to the
# \`output\` branch, where README.md loads them from.
# Source: ${SNAKE_SOURCE_URL}
name: Generate Contribution Snake

on:
  schedule:
    - cron: "37 0 * * *"
  workflow_dispatch:
  push:
    branches:
      - main
      - master

jobs:
  generate:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Generate snake SVGs
        uses: Platane/snk/svg-only@v3
        with:
          github_user_name: \${{ github.repository_owner }}
          outputs: |
            dist/github-snake.svg
            dist/github-snake-dark.svg?palette=github-dark

      - name: Push the SVGs to the output branch
        uses: crazy-max/ghaction-github-pages@v5
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
