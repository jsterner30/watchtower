import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
import type { RepoInfo, RepoRule } from '../types'

export const adminsRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const { data: collaborators } = await octokit.repos.listCollaborators({
      owner: (await getEnv()).githubOrg,
      repo: repo.name
    })

    const admins = collaborators.filter((collaborator) => collaborator.permissions?.admin)

    repo.admins = []
    if (admins.length > 0) {
      repo.admins = admins.map((admin) => admin.login)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting admins for repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting admins for repo: ${repo.name}: ${error as string}`)
    }
  }
}
