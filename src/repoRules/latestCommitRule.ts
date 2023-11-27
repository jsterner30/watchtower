import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
import type { RepoInfo, RepoRule } from '../types'

export const latestCommitRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const { data: commits } = await octokit.repos.listCommits({
      owner: (await getEnv()).githubOrg,
      repo: repo.name,
      per_page: 1 // Get the latest commit
    })

    if (commits.length > 0) {
      repo.lastCommit.date = commits[0].commit.author?.date ?? ''
      repo.lastCommit.author = commits[0].commit.author?.name ?? ''
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting last commit for repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting last commit info for repo: ${repo.name}: ${error as string}`)
    }
  }
}
