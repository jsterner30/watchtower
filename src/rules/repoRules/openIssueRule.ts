import { errorHandler, getRepoOpenIssues } from '../../util'
import type { Repo } from '../../types'
import { RepoRule } from '../rule'

export class OpenIssueRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      const issues = await getRepoOpenIssues(repo.name)
      for (const issue of issues) {
        repo.openIssues.push(issue)
      }
    } catch (error) {
      errorHandler(error, OpenIssueRule.name, repo.name)
    }
  }
}
