# MTM Release Process

## Quick Start

```bash
pnpm run release
```

This single command handles the complete release workflow:

1. ✅ Builds the application with Vite and Electron Forge
2. ✅ Signs all binaries and installer with EV certificate (1 password prompt)
3. ✅ Creates a draft release on GitHub
4. ✅ Uploads signed installer and update packages

## Prerequisites

### 1. HSM Token Configuration

**Hardware:**
- SafeNet eToken 5110+ CC must be plugged in
- SafeNet Authentication Client v10.9 installed

**Password Caching (Recommended):**
- Enable "Enable single logon" in SafeNet Advanced Settings
- This allows signing all files with one password entry
- Without this: you'll be prompted 19+ times

**Certificate Info:**
- Issuer: WBM Tek EV Code Signing
- Thumbprint: `b281b2c2413406e54ac73f3f3b204121b4a66e64`
- Valid until: October 19, 2028

### 2. GitHub Token (for publishing)

Create a Personal Access Token:

1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (all repo permissions)
4. Copy the generated token

Set it as an environment variable:

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'ghp_your_token_here', 'User')
```

**Verify it's set:**
```powershell
$env:GITHUB_TOKEN  # Should output your token
```

### 3. Node.js Environment

```bash
pnpm install  # Install all dependencies
```

## Available Commands

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm run release` | Complete workflow: Build + Sign + Publish |
| `pnpm run make`    | Build and package only (includes signing) |
| `pnpm run dev`     | Run in development mode                 |

## After Publishing

1. Go to: https://github.com/wbmmusic/mtm/releases
2. Find your draft release
3. Review the uploaded files:
   - ✅ `MTM-Setup.exe` (signed installer)
   - ✅ `MTM-0.0.38-full.nupkg` (Squirrel package)
   - ✅ `RELEASES` (update manifest)
4. Add release notes (optional)
5. Click "Publish release" to make it public

## Troubleshooting

### "Build failed"

- Check that all dependencies are installed: `pnpm install`
- Ensure no syntax errors in your code
- Check terminal output for specific errors

### "Signing failed"

- Verify HSM token is plugged in
- Check that certificate hasn't expired (valid until Oct 19, 2028)
- Ensure `WINDOWS_SIGN_THUMBPRINT` environment variable is set
- Verify signtool is available: `Get-Command signtool.exe`

### "GitHub publish failed" / "No GITHUB_TOKEN"

- Set `GITHUB_TOKEN` environment variable (see Prerequisites)
- Verify token has `repo` scope
- Check token hasn't expired
- Ensure repository name is correct: `wbmmusic/mtm`

### "Signature verification failed"

This usually means:

- HSM token was removed during signing
- Wrong certificate was selected
- Certificate chain is incomplete
- SafeNet Authentication Client not running

**Solution:** Re-run `pnpm run make` to rebuild and sign again

## Workflow Implementation

The release automation is implemented in `scripts/release.ts`:

- Written in TypeScript for better integration with Node.js
- Uses `@octokit/rest` for GitHub API interactions
- Colored terminal output for better visibility
- Automatically detects version from `package.json`
- Handles draft release creation/updates
- Uploads all required files in sequence

**Configuration:** Signing parameters in `forge.config.ts` under `makers` → `MakerSquirrel` → `signWithParams`

## Release Checklist

- [ ] Updated version in `package.json`
- [ ] Tested application locally (`pnpm run dev`)
- [ ] HSM token plugged in
- [ ] `GITHUB_TOKEN` environment variable set
- [ ] Run `pnpm run release`
- [ ] Enter HSM password when prompted
- [ ] Verify draft release on GitHub
- [ ] Add release notes
- [ ] Publish release
- [ ] Test downloaded installer
- [ ] Announce release to users

## Version Bumping

Before releasing, update the version:

```bash
# Example: 0.0.38 → 0.0.39
npm version patch

# Or for minor: 0.0.38 → 0.1.0
npm version minor

# Or for major: 0.0.38 → 1.0.0
npm version major
```

This automatically:

- Updates `package.json` version
- Creates a git tag
- Commits the change

Then run `pnpm run release` to build and publish.

## Additional Resources

- **User Guide:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md) - How to use the application
- **IPC Documentation:** [docs/IPC.md](docs/IPC.md) - Inter-process communication architecture
- **Build Config:** `forge.config.ts` - Electron Forge configuration with signing parameters
- **Release Script:** `scripts/release.ts` - TypeScript automation for build + publish workflow
