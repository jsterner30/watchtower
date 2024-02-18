import { errorHandler, getRepoOpenPRs } from '../../util'
import type { Repo } from '../../types'
import { RepoRule } from '../rule'

export class OpenPRRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      const pulls = await getRepoOpenPRs(repo.name)
      for (const pull of pulls) {
        repo.openPullRequests.push(pull)
      }
    } catch (error) {
      errorHandler(error, OpenPRRule.name, repo.name)
    }
  }
}
