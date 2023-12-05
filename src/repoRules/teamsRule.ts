import { Octokit } from '@octokit/rest'
import { errorHandler, getEnv } from '../util'
import type { RepoInfo, RepoRule } from '../types'

export const teamsRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const owner = (await getEnv()).githubOrg
    const { data: teams } = await octokit.repos.listTeams({
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
    errorHandler(error, teamsRule.name, repo.name)
  }
}
