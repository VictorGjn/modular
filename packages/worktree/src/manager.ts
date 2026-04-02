/**
 * Git Worktree Manager — unified from crew + studio.
 * Provides isolated git worktrees per agent for safe parallel work.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface WorktreeRequest {
  repoUrl: string;
  baseRef?: string;
  /** contextId = runId (crew) or teamId (studio) */
  contextId: string;
  agentId: string;
}

export interface WorktreeResult {
  bareRepoPath: string;
  worktreePath: string;
  branch: string;
  baseRef: string;
}

export interface WorktreeStatus {
  worktreePath: string;
  branch: string;
  baseBranch: string;
  ahead: number;
  behind: number;
  headSha: string;
  headMessage: string;
}

const ROOT = join(tmpdir(), 'modular-worktrees');
const BARE_ROOT = join(ROOT, 'bare');
const TREE_ROOT = join(ROOT, 'trees');

function safeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeGitUrl(url: string): string {
  return url.endsWith('.git') ? url : `${url}.git`;
}

function parseRepoKey(url: string): string {
  const cleaned = url.replace(/\.git$/, '');
  const parts = cleaned.split('/');
  const owner = parts[parts.length - 2] || 'unknown';
  const repo = parts[parts.length - 1] || 'repo';
  return `${safeSlug(owner)}--${safeSlug(repo)}`;
}

function ensureDirs(): void {
  mkdirSync(BARE_ROOT, { recursive: true });
  mkdirSync(TREE_ROOT, { recursive: true });
}

function run(args: string[]): void {
  execFileSync(args[0], args.slice(1), { stdio: 'pipe', timeout: 120_000 });
}

function runText(args: string[]): string {
  return execFileSync(args[0], args.slice(1), { stdio: 'pipe', timeout: 120_000 }).toString().trim();
}

function branchExists(gitDir: string, branch: string): boolean {
  try {
    run(['git', `--git-dir=${gitDir}`, 'show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
    return true;
  } catch { return false; }
}

/** Prepare an isolated worktree for an agent. */
export function prepareAgentWorktree(request: WorktreeRequest): WorktreeResult {
  ensureDirs();
  const repoKey = parseRepoKey(request.repoUrl);
  const remoteUrl = normalizeGitUrl(request.repoUrl);
  const bareRepoPath = join(BARE_ROOT, `${repoKey}.git`);
  const baseRef = request.baseRef || 'main';
  const branch = `agent/${safeSlug(request.contextId)}-${safeSlug(request.agentId)}`;
  const worktreePath = join(TREE_ROOT, `${repoKey}--${safeSlug(request.contextId)}--${safeSlug(request.agentId)}`);

  if (!existsSync(bareRepoPath)) {
    run(['git', 'clone', '--bare', remoteUrl, bareRepoPath]);
  } else {
    run(['git', `--git-dir=${bareRepoPath}`, 'fetch', '--all', '--prune']);
  }

  if (!existsSync(worktreePath)) {
    const baseArg = baseRef.startsWith('origin/') ? baseRef : `origin/${baseRef}`;
    if (!branchExists(bareRepoPath, branch)) {
      run(['git', `--git-dir=${bareRepoPath}`, 'worktree', 'add', worktreePath, '-b', branch, baseArg]);
    } else {
      run(['git', `--git-dir=${bareRepoPath}`, 'worktree', 'add', worktreePath, branch]);
    }
  }

  return { bareRepoPath, worktreePath, branch, baseRef };
}

/** Get status of a worktree (ahead/behind). */
export function getWorktreeStatus(worktreePath: string, branch: string, baseBranch?: string): WorktreeStatus {
  const base = baseBranch || resolveBaseBranch(worktreePath);
  const counts = runText(['git', '-C', worktreePath, 'rev-list', '--left-right', '--count', `origin/${base}...${branch}`]).split(/\s+/);
  const behind = Number(counts[0] || '0');
  const ahead = Number(counts[1] || '0');
  const headSha = runText(['git', '-C', worktreePath, 'rev-parse', '--short', 'HEAD']);
  const headMessage = runText(['git', '-C', worktreePath, 'log', '-1', '--pretty=%s']);
  return { worktreePath, branch, baseBranch: base, ahead, behind, headSha, headMessage };
}

/** Rebase a worktree onto its base branch. */
export function rebaseWorktree(worktreePath: string, branch: string, baseBranch?: string): WorktreeStatus {
  const base = baseBranch || resolveBaseBranch(worktreePath);
  run(['git', '-C', worktreePath, 'fetch', '--all', '--prune']);
  run(['git', '-C', worktreePath, 'checkout', branch]);
  run(['git', '-C', worktreePath, 'rebase', `origin/${base}`]);
  return getWorktreeStatus(worktreePath, branch, base);
}

/** Clean up worktrees for a given context (run or team). */
export function cleanupWorktrees(contextId: string): void {
  if (!existsSync(TREE_ROOT)) return;
  const slug = safeSlug(contextId);
  for (const d of readdirSync(TREE_ROOT)) {
    if (d.includes(slug)) {
      try { rmSync(join(TREE_ROOT, d), { recursive: true, force: true }); } catch {}
    }
  }
}

function resolveBaseBranch(worktreePath: string): string {
  try {
    const originHead = runText(['git', '-C', worktreePath, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
    return originHead.replace('origin/', '');
  } catch { return 'main'; }
}
