import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
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
      repo.teams = teams.map((team) => team.slug)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting teams for repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting teams for repo: ${repo.name}: ${error as string}`)
    }
  }
}
