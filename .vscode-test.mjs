import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@vscode/test-cli';

// Keep macOS IPC socket paths below the length limit in deeply nested worktrees.
const userDataDir = mkdtempSync(join(tmpdir(), 'deepseek-test-'));
process.once('exit', () => rmSync(userDataDir, { recursive: true, force: true }));

export default defineConfig({
	files: 'out/test/**/*.test.js',
	launchArgs: [`--user-data-dir=${userDataDir}`],
});
