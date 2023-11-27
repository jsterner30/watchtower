import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
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
    errorHandler(error, latestCommitRule.name, repo.name)
  }
}
