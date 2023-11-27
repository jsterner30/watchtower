import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
import type { RepoInfo, RepoRule } from '../types'

export const openPullRequestsRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const { data: pullRequests } = await octokit.pulls.list({
      owner: (await getEnv()).githubOrg,
      repo: repo.name,
      state: 'open' // Retrieve open pull requests
    })

    repo.openPullRequests = []

    if (pullRequests.length > 0) {
      repo.openPullRequests = pullRequests.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        user: {
          login: pr.user?.login ?? ''
        },
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        dependabot: pr.user?.login === 'dependabot[bot]'
      }))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting open PRs for repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting open PRs for repo: ${repo.name}: ${error as string}`)
    }
  }
}
