# OIDC Trusted Publishing Setup Guide

**Long-term solution for npm publishing without token management**

## Why OIDC Trusted Publishing?

As of December 9, 2025, npm permanently revoked all classic tokens. The new options are:
- ❌ **Granular tokens**: Expire every 90 days (requires rotation)
- ✅ **OIDC Trusted Publishing**: No tokens, no expiration, more secure

## Benefits

- ✅ **Zero token management** - No tokens to create, rotate, or secure
- ✅ **More secure** - Uses GitHub's identity directly, eliminating token theft risk
- ✅ **No expiration** - Never expires, never needs rotation
- ✅ **No secrets** - Nothing to store in GitHub Secrets
- ✅ **Automatic** - Works seamlessly with GitHub Actions

## Implementation Steps

### Step 1: Configure npm Packages (One-time Setup)

For **each package**, configure OIDC trust on npmjs.com:

1. **Go to your packages**: https://www.npmjs.com/settings/aashari/packages

2. **For each package**:
   - Click package name (e.g., `@aashari/boilerplate-mcp-server`)
   - Navigate to **Settings** → **Publishing Access**
   - Click **Add Trusted Publisher**

3. **Configure GitHub Actions as trusted publisher**:
   ```
   Provider:     GitHub Actions
   Owner:        aashari
   Repository:   boilerplate-mcp-server  (change per repo)
   Workflow:     .github/workflows/ci-semantic-release.yml
   Environment:  (leave empty)
   ```

4. **Save** and repeat for all packages:
   - `@aashari/boilerplate-mcp-server`
   - `@aashari/mcp-server-aws-sso`
   - `@aashari/mcp-server-atlassian-bitbucket`
   - `@aashari/mcp-server-atlassian-jira`
   - `@aashari/mcp-server-atlassian-confluence`
   - `@aashari/boilerplate-npm-package` (if applicable)

### Step 2: Update GitHub Actions Workflow

**Changes needed** (already done for boilerplate-mcp-server):

1. **Add OIDC permission** to workflow permissions:
   ```yaml
   permissions:
       contents: write
       issues: write
       pull-requests: write
       id-token: write  # ← ADD THIS
   ```

2. **Remove NPM_TOKEN** from env variables:
   ```yaml
   # Before:
   env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       NPM_TOKEN: ${{ secrets.NPM_TOKEN }}  # ← REMOVE THIS
   
   # After:
   env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       # NPM authentication via OIDC (no token needed)
   ```

3. **Enable npm publishing** in `.releaserc.json`:
   ```json
   {
       "npmPublish": true  // Change from false to true
   }
   ```

### Step 3: Apply to All Repositories

**Repositories that need updates:**
- ✅ `boilerplate-mcp-server` (already done)
- ⏳ `mcp-server-aws-sso`
- ⏳ `mcp-server-atlassian-bitbucket`
- ⏳ `mcp-server-atlassian-jira`
- ⏳ `mcp-server-atlassian-confluence`
- ⏳ `boilerplate-npm-package`

**To update other repos**:
```bash
# Clone or navigate to each repo
cd /path/to/repo

# Make the same changes:
# 1. Edit .github/workflows/ci-semantic-release.yml
# 2. Edit .releaserc.json (if npmPublish is false)
# 3. Commit and push

git add .github/workflows/ci-semantic-release.yml .releaserc.json
git commit -m "feat: migrate to OIDC trusted publishing for npm

- Add id-token: write permission for OIDC
- Remove NPM_TOKEN dependency
- Enable npm publishing via OIDC
- Long-term solution with zero token management"

git push origin main
```

### Step 4: Remove Old NPM_TOKEN Secret (Optional)

Once all repos are migrated:
```bash
# Remove the now-unused secret from all repos
gh secret delete NPM_TOKEN --repos "boilerplate-mcp-server,mcp-server-aws-sso,mcp-server-atlassian-bitbucket,mcp-server-atlassian-jira,mcp-server-atlassian-confluence,boilerplate-npm-package"
```

## Testing

### Test the Setup

1. **Make a commit** using conventional commits:
   ```bash
   git commit -m "fix: test OIDC publishing"
   git push origin main
   ```

2. **Watch workflow** execution:
   ```bash
   gh run watch --repo aashari/boilerplate-mcp-server
   ```

3. **Verify**:
   - ✅ Workflow completes successfully
   - ✅ GitHub release is created
   - ✅ Package is published to npm
   - ✅ No NPM_TOKEN errors

### Troubleshooting

**Error: "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL"**
- **Cause**: Missing `id-token: write` permission
- **Fix**: Add permission to workflow YAML

**Error: "401 Unauthorized" from npm**
- **Cause**: Package not configured for OIDC or wrong workflow path
- **Fix**: Verify trusted publisher settings on npmjs.com match exactly:
  - Owner: `aashari`
  - Repo: Must match repository name
  - Workflow: `.github/workflows/ci-semantic-release.yml`

**Error: "403 Forbidden" from npm**
- **Cause**: OIDC configured but npmPublish still false
- **Fix**: Set `"npmPublish": true` in `.releaserc.json`

## How It Works

1. **Workflow runs** → GitHub Actions generates an OIDC token
2. **Token contains identity** → Repository, workflow, branch, commit info
3. **npm validates** → Checks if the workflow is a trusted publisher
4. **Publishing succeeds** → No manual token needed

## Migration Checklist

- [ ] Configure OIDC for all 6 packages on npmjs.com
- [x] Update boilerplate-mcp-server workflow
- [ ] Update mcp-server-aws-sso workflow
- [ ] Update mcp-server-atlassian-bitbucket workflow
- [ ] Update mcp-server-atlassian-jira workflow
- [ ] Update mcp-server-atlassian-confluence workflow
- [ ] Update boilerplate-npm-package workflow
- [ ] Test one package release
- [ ] Remove NPM_TOKEN secret (after all migrations)
- [ ] Document for team

## References

- [npm OIDC Trusted Publishing Docs](https://docs.npmjs.com/trusted-publishers)
- [GitHub Blog: npm Classic Tokens Revoked](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Summary

**Before (Classic/Granular Tokens)**:
- Create token manually
- Store in GitHub Secrets
- Rotate every 90 days
- Security risk if leaked

**After (OIDC)**:
- No token creation
- No secrets to manage
- Never expires
- GitHub verifies identity automatically

**This is the recommended long-term solution by npm and GitHub.**
