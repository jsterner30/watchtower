import { getEnv, errorHandler } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class AdminsRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: collaborators } = await this.octokit.repos.listCollaborators({
        owner: (await getEnv()).githubOrg,
        repo: repo.name
      })

      const admins = collaborators.filter((collaborator) => collaborator.permissions?.admin)

      repo.admins = []
      if (admins.length > 0) {
        repo.admins = admins.map((admin) => admin.login)
      }
    } catch (error) {
      errorHandler(error, AdminsRule.name, repo.name)
    }
  }
}
