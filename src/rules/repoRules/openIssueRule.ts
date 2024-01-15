import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class OpenIssueRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: issues } = await this.octokit.issues.listForRepo({
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
      errorHandler(error, OpenIssueRule.name, repo.name)
    }
  }
}
