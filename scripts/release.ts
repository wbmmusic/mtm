#!/usr/bin/env node
/**
 * MTM Release Script
 * Builds, signs (via Squirrel), and publishes to GitHub
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Octokit } from '@octokit/rest';

// ANSI color codes for terminal output
const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
    console.log(`\n${colors.cyan}${title}${colors.reset}`);
}

function logError(message: string) {
    console.error(`${colors.red}${message}${colors.reset}`);
}

function exec(command: string, description: string) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        logError(`\n${description} failed!`);
        process.exit(1);
    }
}

async function main() {
    log('\n=== MTM Release Builder ===', 'cyan');

    // Step 1: Build and Sign
    logSection('[1/2] Building and signing...');
    log('  - Squirrel will sign all binaries during build', 'gray');
    log('  - You\'ll be prompted for HSM password once', 'gray');

    exec('pnpm run make', 'Build');
    log('✓ Build complete - all files signed', 'green');

    // Step 2: Publish to GitHub
    logSection('[2/2] Publishing to GitHub...');

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        log('⚠ Skipping publish - GITHUB_TOKEN not set', 'yellow');
        log('  Signed installer: .\\out\\make\\squirrel.windows\\x64\\MTM-Setup.exe', 'cyan');
        process.exit(0);
    }

    // Read version from package.json
    const packageJsonPath = './package.json';
    if (!existsSync(packageJsonPath)) {
        logError('ERROR: package.json not found!');
        process.exit(1);
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = `v${packageJson.version}`;
    const squirrelDir = './out/make/squirrel.windows/x64';

    log(`  Version: ${version}`, 'cyan');

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });
    const owner = 'wbmmusic';
    const repo = 'mtm';

    // Get or create draft release
    log('  Checking for existing release...', 'gray');
    const { data: releases } = await octokit.repos.listReleases({ owner, repo });
    let release = releases.find(r => r.tag_name === version);

    if (!release) {
        log(`  Creating draft release ${version}...`, 'cyan');
        const { data } = await octokit.repos.createRelease({
            owner,
            repo,
            tag_name: version,
            name: version,
            draft: true,
            prerelease: false
        });
        release = data;
    } else {
        log('  Found existing draft release', 'gray');
    }

    // Files to upload
    const filesToUpload = [
        { name: 'MTM-Setup.exe', path: join(squirrelDir, 'MTM-Setup.exe'), important: true },
        { name: 'RELEASES', path: join(squirrelDir, 'RELEASES'), important: false },
        { name: `MTM-${packageJson.version}-full.nupkg`, path: join(squirrelDir, `MTM-${packageJson.version}-full.nupkg`), important: false }
    ];

    // Upload each file
    for (const file of filesToUpload) {
        if (!existsSync(file.path)) {
            if (file.important) {
                logError(`ERROR: ${file.name} not found!`);
                process.exit(1);
            } else {
                log(`  Skipping ${file.name} - not found`, 'gray');
                continue;
            }
        }

        // Delete existing asset if present
        const existingAsset = release.assets?.find(a => a.name === file.name);
        if (existingAsset) {
            log(`  Removing old ${file.name}...`, 'gray');
            await octokit.repos.deleteReleaseAsset({
                owner,
                repo,
                asset_id: existingAsset.id
            });
        }

        // Upload new asset
        log(`  Uploading ${file.name}...`, 'cyan');
        const fileContent = readFileSync(file.path);
        await octokit.repos.uploadReleaseAsset({
            owner,
            repo,
            release_id: release.id,
            name: file.name,
            data: fileContent as any
        });
    }

    log('\n✓ RELEASE COMPLETE!', 'green');
    log(`  Draft release: https://github.com/${owner}/${repo}/releases/tag/${version}`, 'cyan');
    log('  Remember to publish the draft when ready!', 'yellow');

    // Commit and push changes
    log('\n📦 Committing and pushing changes...', 'cyan');
    
    try {
        exec('git add .', 'Git add');
        exec(`git commit -m "Release v${version}"`, 'Git commit');
        log('  ✓ Changes committed', 'green');
        
        exec('git push origin main', 'Git push');
        log('  ✓ Changes pushed to origin/main', 'green');
        
        exec(`git push origin v${version}`, 'Git push tag');
        log(`  ✓ Tag v${version} pushed to origin`, 'green');
    } catch (error: any) {
        log(`  ⚠ Git operations failed: ${error.message}`, 'yellow');
        log('    You may need to commit and push manually', 'gray');
    }
}

main().catch(error => {
    logError(`\nError: ${error.message}`);
    process.exit(1);
});
