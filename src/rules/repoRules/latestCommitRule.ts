import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class LatestCommitRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: (await getEnv()).githubOrg,
        repo: repo.name,
        per_page: 1 // Get the latest commit
      })

      if (commits.length > 0) {
        repo.lastCommit.date = commits[0].commit.author?.date ?? ''
        repo.lastCommit.author = commits[0].commit.author?.name ?? ''
      }
    } catch (error) {
      errorHandler(error, LatestCommitRule.name, repo.name)
    }
  }
}
