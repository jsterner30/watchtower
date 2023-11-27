import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
import type { RepoInfo, RepoRule } from '../types'

export const openIssueRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner: (await getEnv()).githubOrg,
      repo: repo.name,
      state: 'open'
    })

    if (issues.length > 0) {
      repo.openIssues = issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        user: {
          login: issue.user?.login ?? ''
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting issues for repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting issues for repo: ${repo.name}: ${error as string}`)
    }
  }
}
