import {
  getEnv,
  ProgressBarManager
} from './index'
import { logger } from './logger'
import { Octokit } from '@octokit/rest'
import { RequestError } from '@octokit/request-error'
import JSZip, { loadAsync } from 'jszip'
import type { CacheFile, RepoInfo, Commit, BranchProtection } from '../types'

export async function getAllReposInOrg (orgName: string, octokit: Octokit, allReposFile: CacheFile | null): Promise<CacheFile> {
  if (allReposFile != null && (Object.keys(allReposFile.info)).length > 0) {
    return allReposFile
  }
  logger.info('Getting all repos in org')
  try {
    let page = 1
    const repoInfoObj: Record<string, RepoInfo> = {}

    while (true) {
      const { data: repos } = await octokit.repos.listForOrg({
        org: orgName,
        per_page: 100,
        page
      })

      if (repos.length === 0) {
        break
      }

      for (const repo of repos) {
        repoInfoObj[repo.name] = createRepoInfo(repo)
      }
      page++
    }

    return attachMetadataToCacheFile(repoInfoObj)
  } catch (error) {
    throw new Error(`Error occurred while fetching repositories: ${error as string}`)
  }
}

function attachMetadataToCacheFile (info: Record<string, RepoInfo>, branchCount: number = 0): CacheFile {
  return {
    metadata: {
      repoCount: Object.keys(info).length,
      branchCount,
      lastRunDate: new Date().toISOString()
    },
    info
  }
}

function createRepoInfo (rawRepo: Record<string, any>): RepoInfo {
  return {
    name: rawRepo.name,
    private: rawRepo.private,
    url: rawRepo.url,
    description: rawRepo.description ?? '',
    language: rawRepo.language ?? '',
    allowForking: rawRepo.allow_forking,
    visibility: rawRepo.visibility,
    forksCount: rawRepo.forks_count,
    archived: rawRepo.archived,
    defaultBranch: rawRepo.default_branch,
    branches: {},
    lastCommit: {
      author: 'unknown',
      date: '1971-01-01T00:00:00Z' // after the default lastRunDate
    },
    openPullRequests: [],
    openIssues: [],
    codeScanAlerts: {
      low: [],
      medium: [],
      high: [],
      critical: [],
      none: []
    },
    dependabotScanAlerts: {
      low: [],
      medium: [],
      high: [],
      critical: [],
      none: []
    },
    secretScanAlerts: {
      critical: []
    },
    teams: [],
    admins: [],
    healthScores: {}
  }
}

export async function getProtectionRules (octokit: Octokit, repoName: string, branchName: string): Promise<BranchProtection | null> {
  try {
    const owner = (await getEnv()).githubOrg
    const res = await octokit.request(`GET /repos/${owner}/${repoName}/branches/${branchName}/protection`, {
      owner,
      repo: repoName,
      branch: branchName
    })
    return {
      requiredSignatures: res.data.required_signatures.enabled,
      enforceAdmins: res.data.enforce_admins.enabled,
      requireLinearHistory: res.data.required_linear_history.enabled,
      allowForcePushes: res.data.allow_force_pushes.enabled,
      allowDeletions: res.data.allow_deletions.enabled,
      blockCreations: res.data.block_creations.enabled,
      requiredConversationResolution: res.data.required_conversation_resolution,
      lockBranch: res.data.lock_branch.enabled,
      allowForkSyncing: res.data.allow_fork_syncing.enabled
    }
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status !== 404) {
        logger.error(`Error getting branch protections for repo: ${repoName}: ${error.message}`)
      }
    } else {
      logger.error(`Error getting branch protections for repo: ${repoName}: ${error as string}`)
    }
    return null
  }
}

export async function getBranchCommitInfo (octokit: Octokit, repoName: string, branchName: string): Promise<Commit> {
  try {
    const response = await octokit.repos.getBranch({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      branch: branchName
    })

    const commitSha = response.data.commit.sha
    const author = await getCommitInfo(octokit, repoName, commitSha)
    return {
      author: author.author,
      date: author.date
    }
  } catch (error) {
    logger.error(`Unable to get last commit info for repo: ${repoName}, Branch: ${branchName}. Error: ${error as string}`)
    return {
      author: 'unknown',
      date: '1971-01-01T00:00:00Z' // after the default lastRunDate
    }
  }
}

export async function getBranches (octokit: Octokit, repos: RepoInfo[], filteredWithBranches: CacheFile | null, progress: ProgressBarManager): Promise<CacheFile> {
  if (filteredWithBranches != null && (Object.keys(filteredWithBranches.info)).length !== 0) {
    return filteredWithBranches
  }
  logger.info('Getting all branches in org')
  progress.reset(repos.length, 'Getting branch info for repos', [{ displayName: 'Current Repo', token: 'currentRepo' }])
  progress.start()

  let branchCount = 0
  const reposWithBranches: Record<string, any> = {}

  for (const repo of repos) {
    try {
      progress.update([{ displayName: 'Current Repo', token: 'currentRepo', value: repo.name }])
      const { githubOrg } = await getEnv()

      let page = 1
      const branches = []

      while (true) {
        const response = await octokit.repos.listBranches({
          owner: githubOrg,
          repo: repo.name,
          per_page: 100,
          page
        })

        branches.push(...response.data)
        if (response.data.length < 100) {
          break
        }
        page++
      }

      branchCount += branches.length

      for (const branch of branches) {
        const isDependabot = branch.name.startsWith('dependabot')
        const protections = isDependabot ? await getProtectionRules(octokit, repo.name, branch.name) : null

        repo.branches[branch.name] = {
          name: branch.name,
          lastCommit: await getCommitInfo(octokit, repo.name, branch.commit.sha),
          dependabot: isDependabot,
          deps: [],
          fileCount: 0,
          fileTypes: {},
          branchProtections: {
            protected: protections != null,
            protections: protections ?? undefined
          },
          actionRuns: [],
          deployedBranch: false,
          defaultBranch: repo.defaultBranch === branch.name,
          staleBranch: false
        }
      }
    } catch (error: any) {
      logger.error(`Error getting branch info for ${repo.name}: ${error as string}`)
    }

    reposWithBranches[repo.name] = repo
  }
  return attachMetadataToCacheFile(reposWithBranches, branchCount)
}

async function getCommitInfo (octokit: Octokit, repoName: string, sha: string): Promise<Commit> {
  const defaultCommit = {
    author: 'unknown',
    date: '1971-01-01T00:00:00Z' // after the default lastRunDate
  }
  try {
    const response = await octokit.repos.getCommit({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      ref: sha
    })

    const commit = response.data.commit
    const author = commit.author

    if (author != null) {
      return {
        author: author.name ?? defaultCommit.author,
        date: author.date ?? defaultCommit.date
      }
    }
    return defaultCommit
  } catch (error) {
    logger.error(`Unable to get last commit info for repo: ${repoName}, Commit sha: ${sha}. Error: ${error as string}`)
    return defaultCommit
  }
}

export async function downloadRepoToMemory (octokit: Octokit, repoName: string, branchName: string): Promise<JSZip | null> {
  try {
    // Get the tarball URL for the specified branch
    const { data } = await octokit.repos.downloadZipballArchive({
      owner: (await getEnv()).githubOrg,
      repo: repoName,
      ref: branchName
    })

    return await loadAsync(data as any)
  } catch (error: any) {
    logger.error('Error downloading repo to memory, error:', error as string)
    return null
  }
}

export async function searchOrganizationForStrings (octokit: Octokit, searchTerms: string[]): Promise<Array<Record<string, any>>> {
  const org = (await getEnv()).githubOrg
  const reposWithTerms: Array<Record<string, any>> = []

  try {
    for (const term of searchTerms) {
      let termSubArray: Array<Record<string, any>> = []

      let page = 1
      while (true) {
        const { data } = await octokit.request('GET /search/code', {
          q: `${term}+org:${org}`,
          per_page: 100,
          page
        })

        const items = data.items
        if (items.length === 0) {
          break // No more repositories to fetch
        }

        termSubArray = [
          ...termSubArray,
          ...items
        ]

        page++
      }
      reposWithTerms.push(termSubArray)
    }
    logger.info(reposWithTerms)
    return reposWithTerms
  } catch (error) {
    throw new Error('Error occurred while searching org for string')
  }
}
