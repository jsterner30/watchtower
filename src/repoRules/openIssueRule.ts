import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
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
    errorHandler(error, openIssueRule.name, repo.name)
  }
}
