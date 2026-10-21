// Lines-of-code section for the README generator, powered by the public
// workflow from https://github.com/arhamkhnz/github-code-analyzer. The
// generated README only carries the marker pair; the workflow (copied into
// the user's profile repo) counts their public repos with cloc and rewrites
// whatever sits between the markers.

export const CODE_STATS_START = '<!-- PUBLIC CODE STATS START -->';
export const CODE_STATS_END = '<!-- PUBLIC CODE STATS END -->';

export const CODE_STATS_WORKFLOW_PATH = '.github/workflows/analyze-public-code.yml';
export const CODE_STATS_SOURCE_URL = 'https://github.com/arhamkhnz/github-code-analyzer';

export const DEFAULT_HIGHLIGHT_LANGS = ['JavaScript', 'TypeScript', 'JSX', 'Python', 'Go', 'PHP'];

// cloc language names ("C#", "C++", "Vuejs Component", "Objective-C"). The
// list lands inside a double-quoted YAML string, so anything that could end
// that string or open a `${{ }}` expression is rejected rather than escaped.
const LANG_NAME = /^[A-Za-z0-9 #+.-]+$/;

export const parseHighlightLangs = (text) => {
  const names = String(text ?? '')
    .split(',')
    .map((name) => name.trim().replace(/\s+/g, ' '))
    .filter((name) => name && LANG_NAME.test(name));
  const unique = [...new Set(names)];
  return unique.length ? unique : DEFAULT_HIGHLIGHT_LANGS;
};

// Kept line-for-line with the upstream analyze-public-code.yml apart from
// the header comment and HIGHLIGHT_LANGS, so upstream fixes are easy to diff in.
export const buildCodeStatsWorkflow = ({ highlightLangs } = {}) => {
  const langs = parseHighlightLangs((highlightLangs || []).join(','));

  return `# Counts code lines in your public, non-fork repos with cloc and writes the
# result between the PUBLIC CODE STATS markers in README.md.
# Source: ${CODE_STATS_SOURCE_URL}
name: Analyze Public Repositories by Username

on:
  push:
    branches:
      - "**"
  schedule:
    - cron: "17 0 * * 0"
  workflow_dispatch:
    inputs:
      username:
        description: GitHub username to analyze (defaults to PUBLIC_STATS_USERNAME or the repository owner)
        required: false
        type: string

permissions:
  contents: write

jobs:
  count-public-lines:
    runs-on: ubuntu-latest
    env:
      SOURCE_USERNAME: \${{ inputs.username || vars.PUBLIC_STATS_USERNAME || github.repository_owner }}
      HIGHLIGHT_LANGS: "${langs.join(',')}"
      IGNORE_LANGS: "JSON,HTML,CSS,SCSS,Sass,Markdown,SVG,XML,YAML,TOML,CSV,Text,Properties"
    steps:
      - name: Checkout report repository
        uses: actions/checkout@v7

      - name: Install cloc and jq
        run: |
          sudo apt-get update
          sudo apt-get install -y cloc jq

      - name: Discover and count public repositories
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          set -euo pipefail

          if [[ ! "$SOURCE_USERNAME" =~ ^[A-Za-z0-9-]+$ ]]; then
            echo "Invalid GitHub username" >&2
            exit 1
          fi

          # This endpoint lists public repositories owned by the named user.
          # --paginate retrieves all pages; --slurp wraps them for one jq pass.
          REPOS_JSON=$(gh api --paginate --slurp "users/$SOURCE_USERNAME/repos?per_page=100&type=owner")
          jq -e 'type == "array" and all(.[]; type == "array")' <<< "$REPOS_JSON" > /dev/null
          mapfile -t REPOS < <(jq -r '.[][] | select(.fork == false) | .full_name' <<< "$REPOS_JSON")

          CLONE_ROOT="$RUNNER_TEMP/public-code-repos"
          mkdir -p "$CLONE_ROOT" output

          for INDEX in "\${!REPOS[@]}"; do
            REPO="\${REPOS[$INDEX]}"
            echo "Cloning $REPO"
            git clone --quiet --depth 1 --single-branch "https://github.com/$REPO.git" "$CLONE_ROOT/$INDEX"
          done

          if (( \${#REPOS[@]} > 0 )); then
            cloc "$CLONE_ROOT" --json --report-file="$RUNNER_TEMP/public-cloc.json" --exclude-lang="$IGNORE_LANGS"
          else
            jq -n '{SUM: {code: 0}}' > "$RUNNER_TEMP/public-cloc.json"
          fi

          jq -e '(.SUM.code | type == "number") and (.SUM.code >= 0)' "$RUNNER_TEMP/public-cloc.json" > /dev/null
          jq --arg username "$SOURCE_USERNAME" --argjson repository_count "\${#REPOS[@]}" \\
            '{username: $username,
              repository_count: $repository_count,
              total_code_lines: .SUM.code,
              languages: ([to_entries[]
                | select(.key != "header" and .key != "SUM" and .value.code > 0)
                | {name: .key, code_lines: .value.code}] | sort_by(.name))}' \\
            "$RUNNER_TEMP/public-cloc.json" > output/public-summary.json

      - name: Update public section in README
        run: |
          python3 - <<'PY'
          import json
          import os
          from pathlib import Path

          summary = json.loads(Path("output/public-summary.json").read_text())
          highlights = {name.strip() for name in os.environ["HIGHLIGHT_LANGS"].split(",")}
          languages = summary["languages"]
          named = sorted(
              (item for item in languages if item["name"] in highlights),
              key=lambda item: (-item["code_lines"], item["name"]),
          )
          other_lines = sum(item["code_lines"] for item in languages if item["name"] not in highlights)
          if sum(item["code_lines"] for item in languages) != summary["total_code_lines"]:
              raise ValueError("Language counts do not match the cloc total")

          username = summary["username"]
          rows = [
              f"Public, non-fork repositories owned by [@{username}](https://github.com/{username}): "
              f"**{summary['repository_count']:,}**",
              "",
              "| Language | Code lines |",
              "| --- | ---: |",
          ]
          rows += [f"| {item['name']} | {item['code_lines']:,} |" for item in named]
          if other_lines:
              rows.append(f"| Others | {other_lines:,} |")
          rows.append(f"| **Total** | **{summary['total_code_lines']:,}** |")

          start = "${CODE_STATS_START}"
          end = "${CODE_STATS_END}"
          readme = Path("README.md")
          content = readme.read_text()
          if content.count(start) != 1 or content.count(end) != 1:
              raise ValueError("README must contain exactly one public stats marker pair")
          before, remainder = content.split(start)
          _, after = remainder.split(end)
          readme.write_text(before + start + "\\n" + "\\n".join(rows) + "\\n" + end + after)
          PY

      - name: Commit changed public stats
        run: |
          set -euo pipefail
          git add README.md output/public-summary.json
          if git diff --cached --quiet; then
            echo "Public code statistics are unchanged"
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -m "chore: update public repository code stats"
          git push origin "HEAD:$GITHUB_REF"
`;
};
