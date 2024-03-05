import { errorHandler, getRepoGithubActionRuns } from '../../util'
import type { Repo } from '../../types'
import { RepoRule } from '../rule'

export class GithubActionRunRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      const runs = await getRepoGithubActionRuns(repo.name)
      runs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) // newest action runs ar at lowest indices
      for (const run of runs) {
        if (repo.branches[run.branch] != null) {
          repo.branches[run.branch].actionRuns.push(run)
        }
      }
    } catch (error) {
      errorHandler(error, GithubActionRunRule.name, repo.name)
    }
  }
}
