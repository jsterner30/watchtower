import { errorHandler, getRepoAdminTeams } from '../../util'
import type { Repo } from '../../types'
import { RepoRule } from '../rule'

export class TeamsRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      repo.teams = await getRepoAdminTeams(repo.name)
    } catch (error) {
      errorHandler(error, TeamsRule.name, repo.name)
    }
  }
}
