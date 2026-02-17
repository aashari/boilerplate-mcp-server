# MCP Modernization + Release Runbook

## Purpose

This runbook documents the exact modernization + release approach used in this repository so other MCP servers can follow the same pattern with predictable outcomes.

Scope covered:

- Baseline audit (history, diffs, dependencies, CI)
- Streamable HTTP transport hardening
- Tool input/output contract standardization
- Inspector-based validation
- Semantic-release driven publishing

---

## Case Study Window (This Repo)

Reference range analyzed:

- From: `v3.0.0` (`fadd464`)
- To: `HEAD` (`08f8a02`)

Key commits:

- `615b373` `feat: modernize HTTP transport and standardize MCP tool contracts`
- `287cb4c` `chore(release): 3.1.0 [skip ci]`
- `08f8a02` `docs: sync README and security guidance with current tooling`

### File-Level Change Summary (`v3.0.0..HEAD`)

- `.releaserc.json`
- `CHANGELOG.md`
- `README.md`
- `SECURITY.md`
- `package-lock.json`
- `package.json`
- `src/controllers/ipaddress.controller.ts`
- `src/index.ts`
- `src/tools/ipaddress-link.tool.ts`
- `src/types/common.types.ts`
- `src/utils/constants.util.ts`
- `src/utils/error-handler.util.ts`

High-impact deltas:

- `src/index.ts`: moved HTTP handling to session-aware streamable transport flow.
- `src/tools/ipaddress-link.tool.ts`: aligned input schema with `ip_get_details`, standardized output to `text` + `resource_link`.
- `src/controllers/ipaddress.controller.ts` + `src/types/common.types.ts`: exposed canonical `resolvedIp` to avoid parsing rendered output.
- `package.json` + `package-lock.json`: dependency upgrades and script surface simplification.
- `.releaserc.json`: added `src/utils/constants.util.ts` to git release assets to prevent version drift.

---

## Phase 1: Baseline Audit

### 1.1 Capture release baseline

```bash
git tag --sort=-v:refname | head -n 10
git log --oneline --decorate vX.Y.Z..HEAD
git diff --name-status vX.Y.Z..HEAD
git diff --stat vX.Y.Z..HEAD
```

### 1.2 Validate release pipeline wiring

Check:

- `.releaserc.json`
- `.github/workflows/ci-semantic-release.yml`
- `package.json` `engines`, scripts, dependencies

Release prerequisites:

- Conventional commits
- Semantic-release workflow on push to `main`
- OIDC trusted publishing (no `NPM_TOKEN` required)

---

## Phase 2: Modernize Streamable HTTP Transport

## Problem Pattern

Stateless `StreamableHTTPServerTransport` reuse across requests causes failures after `initialize`.

## Correct Pattern

Use stateful session management:

- Create a transport on initialize
- Generate `Mcp-Session-Id`
- Store per-session `{ server, transport }`
- Route POST/GET/DELETE by session
- Cleanup on session close + process shutdown

## Implementation Checklist

- Add session map keyed by `Mcp-Session-Id`
- Validate initialize requests with `isInitializeRequest`
- Reject non-initialize requests without session header
- Implement:
    - `POST /mcp` for initialize + rpc
    - `GET /mcp` for SSE stream channel if used
    - `DELETE /mcp` for session termination
- Add graceful shutdown over all sessions

---

## Phase 3: Standardize Tool Contracts

Target rule for related tools:

- Same input schema unless there is a strong functional reason to diverge.
- Same base output shape for primary payload.
- Additive behavior only where required (e.g., extra link item).

## Applied Pattern

For `ip_get_details` and `ip_get_details_link`:

- Input parity:
    - `ipAddress`
    - `includeExtendedData`
    - `useHttps`
    - `jq`
    - `outputFormat`
- Output parity:
    - First content block is always `text` from the same toon/json renderer.
- Link tool extension:
    - Second block is `resource_link` (`ip://<resolved-ip>`).

## Critical anti-pattern to avoid

Do not parse rendered text (regex on TOON/JSON output) to recover structured fields.

Instead:

- expose canonical data from controller/service boundary (`resolvedIp`) and consume that.

---

## Phase 4: Test Matrix (Required)

### 4.1 Static quality gates

```bash
npm run lint
npm run build
npm test -- --runInBand
```

### 4.2 Streamable HTTP protocol flow test (curl)

Required sequence:

1. `initialize`
2. `notifications/initialized`
3. `tools/list`
4. `tools/call`

Assertions:

- `initialize` -> `200`, has `mcp-session-id`
- `notifications/initialized` -> `202`
- `tools/list` -> `200`
- `tools/call` -> `200`

### 4.3 SDK client compatibility test

Use official transport:

- `StreamableHTTPClientTransport`
- `Client` from MCP TS SDK

Assertions:

- `connect()` succeeds
- `tools/list` succeeds
- representative `tools/call` succeeds

### 4.4 Inspector validation

- CLI check:

```bash
npx @modelcontextprotocol/inspector --cli "http://127.0.0.1:PORT/mcp" --transport http --method tools/list
```

- UI check via proxy token URL.

For remote access:

- `HOST=0.0.0.0`
- `ALLOWED_ORIGINS` includes remote UI origin
- set `MCP_PROXY_FULL_ADDRESS` to reachable host:port

Security note: keep auth enabled (`MCP_PROXY_AUTH_TOKEN`), do not use `DANGEROUSLY_OMIT_AUTH`.

---

## Phase 5: Semantic Release Procedure

### 5.1 Pre-release checks

```bash
git status --short
npm run lint && npm run build && npm test -- --runInBand
```

### 5.2 Commit strategy

Use conventional commits:

- `fix:` -> patch
- `feat:` -> minor
- `feat!:` or `BREAKING CHANGE:` -> major

### 5.3 Push and monitor

```bash
git push origin main
gh run list --repo <owner>/<repo> --limit 5
gh run watch <run-id> --repo <owner>/<repo>
```

### 5.4 Verify artifacts

```bash
git fetch --tags origin
git tag --sort=-v:refname | head
gh release list --repo <owner>/<repo> --limit 5
npm view <package-name> version
```

---

## Release Config Guardrails

### Guardrail 1: Keep version files aligned

If custom prepare scripts update files, ensure `@semantic-release/git` assets include them.

In this repo:

- `scripts/update-version.js` updates `src/utils/constants.util.ts`
- therefore `src/utils/constants.util.ts` must be in `.releaserc.json` git assets.

### Guardrail 2: Avoid script sprawl

Keep `package.json` scripts minimal and operationally relevant:

- build/lint/test/format
- core run paths (`cli`, `mcp:stdio`, `mcp:http`, `mcp:inspect`)

Remove duplicate aliases that do not add behavior.

### Guardrail 3: Update active docs only

When behavior changes, update:

- `README.md`
- `SECURITY.md`
- active setup docs

Do not rewrite historical/audit snapshots unless they claim current state.

---

## Reusable Execution Checklist

- [ ] Identify release baseline tag and commit window
- [ ] Review commit history + per-file diff stats
- [ ] Validate semantic-release + CI workflow config
- [ ] Modernize streamable HTTP transport to session-safe pattern
- [ ] Standardize related tool input/output contracts
- [ ] Remove output parsing hacks (regex/content scraping)
- [ ] Run lint/build/tests
- [ ] Run curl protocol flow tests
- [ ] Run official SDK client tests
- [ ] Run Inspector CLI + UI tests
- [ ] Commit with conventional commit type
- [ ] Push to `main`
- [ ] Watch semantic-release workflow to completion
- [ ] Verify git tag, GitHub release, npm version
- [ ] Sync active docs with final behavior

---

## Appendix: Commands Used in This Repo

```bash
# History/diff tracing
git log --oneline --decorate v3.0.0..HEAD
git diff --name-status v3.0.0..HEAD
git diff --stat v3.0.0..HEAD

# Semantic-release dry check (local repo URL fallback)
npx semantic-release --dry-run --no-ci --branches main \
  --repository-url file:///absolute/path/to/repo \
  --plugins @semantic-release/commit-analyzer @semantic-release/release-notes-generator

# Inspector CLI against streamable HTTP
npx @modelcontextprotocol/inspector --cli "http://127.0.0.1:3330/mcp" --transport http --method tools/list
```
