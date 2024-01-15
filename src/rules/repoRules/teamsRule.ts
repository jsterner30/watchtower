import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class TeamsRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const owner = (await getEnv()).githubOrg
      const { data: teams } = await this.octokit.repos.listTeams({
        owner,
        repo: repo.name,
        per_page: 100,
        page: 1
      })

      repo.teams = []
      if (teams.length > 0) {
        repo.teams = teams
          .filter((team) => team.permissions?.admin)
          .map((adminTeam) => adminTeam.slug)
      }
    } catch (error) {
      errorHandler(error, TeamsRule.name, repo.name)
    }
  }
}
