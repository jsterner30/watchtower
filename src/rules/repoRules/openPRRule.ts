import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class OpenPRRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: pullRequests } = await this.octokit.pulls.list({
        owner: (await getEnv()).githubOrg,
        repo: repo.name,
        state: 'open' // Retrieve open pull requests
      })

      repo.openPullRequests = []

      if (pullRequests.length > 0) {
        repo.openPullRequests = pullRequests.map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          user: {
            login: pr.user?.login ?? ''
          },
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          dependabot: pr.user?.login === 'dependabot[bot]'
        }))
      }
    } catch (error) {
      errorHandler(error, OpenPRRule.name, repo.name)
    }
  }
}
