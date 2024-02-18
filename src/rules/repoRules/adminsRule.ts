import type { Repo } from '../../types'
import { RepoRule } from '../rule'
import { errorHandler, getRepoAdmins } from '../../util'

export class AdminsRule extends RepoRule {
  async run (repo: Repo): Promise<void> {
    try {
      repo.admins = await getRepoAdmins(repo.name)
    } catch (error) {
      errorHandler(error, AdminsRule.name, repo.name)
    }
  }
}
