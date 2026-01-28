# GitHub Commit Skill

This skill handles intelligent git commits using subagent architecture for parallel analysis.

## Workflow

When invoked, this skill uses subagent forks to:
1. Analyze staged and unstaged changes in parallel
2. Review recent commit history for style consistency
3. Generate a contextual commit message
4. Execute the commit with proper attribution

## Instructions

Execute the following workflow using parallel subagent forks:

### Phase 1: Parallel Analysis (use Task tool with subagent forks)

Launch THREE parallel subagents simultaneously:

**Subagent 1 - Status Analysis:**
```
Use Task tool with subagent_type="Bash" to run:
- git status --porcelain
- git diff --stat
Report: List of modified, added, deleted files with change counts
```

**Subagent 2 - Diff Analysis:**
```
Use Task tool with subagent_type="Bash" to run:
- git diff (unstaged changes)
- git diff --cached (staged changes)
Report: Summary of actual code changes, not just file names
```

**Subagent 3 - History Analysis:**
```
Use Task tool with subagent_type="Bash" to run:
- git log --oneline -10 --format="%s"
Report: Recent commit message patterns and conventions used in this repo
```

### Phase 2: Commit Message Generation

After all subagents complete, synthesize their reports to:

1. **Categorize the change type:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation changes
   - `test:` - Test additions/modifications
   - `chore:` - Build/config changes
   - `style:` - Formatting changes

2. **Generate commit message following repo conventions:**
   - Match the style from recent commits
   - Keep subject line under 72 characters
   - Focus on WHY not WHAT
   - Include scope if repo uses it: `type(scope): message`

3. **Include co-author attribution:**
   ```
   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   ```

### Phase 3: Execution

1. If there are unstaged changes that should be committed:
   - Ask user if they want to stage all changes or specific files

2. Stage files as appropriate:
   ```bash
   git add <files>
   ```

3. Create the commit using HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): Concise description of changes

   Optional longer description explaining the why.

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

4. Verify success:
   ```bash
   git status
   git log -1 --oneline
   ```

### Safety Rules

- NEVER run `git push` unless explicitly requested
- NEVER use `--force` flags
- NEVER modify git config
- NEVER skip hooks (no `--no-verify`)
- NEVER amend commits that have been pushed
- If no changes to commit, inform user and exit gracefully

### Arguments

- No arguments: Analyze and commit all staged changes
- `$ARGUMENTS`: Can include:
  - `-m "message"`: Use provided message instead of generating
  - `--all` or `-a`: Stage all tracked file changes
  - File paths: Stage and commit specific files only

## Example Invocations

```
/commit                     # Analyze staged changes, generate message, commit
/commit -m "fix: typo"      # Use provided message
/commit --all               # Stage all changes then commit
/commit src/app.js          # Stage and commit specific file
```
