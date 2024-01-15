import { errorHandler, getEnv } from '../../util'
import type { RepoInfo } from '../../types'
import { RepoRule } from '../rule'

export class GithubActionRunRule extends RepoRule {
  async run (repo: RepoInfo): Promise<void> {
    try {
      const { data: runs } = await this.octokit.actions.listWorkflowRunsForRepo({
        owner: (await getEnv()).githubOrg,
        repo: repo.name,
        per_page: 100
      })

      for (const branchName of Object.keys(repo.branches)) {
        const branchRuns = runs.workflow_runs.filter((run) => run.head_branch === branchName)

        repo.branches[branchName].actionRuns = branchRuns.map((run) => ({
          id: run.id ?? '',
          status: run.status ?? '',
          conclusion: run.conclusion ?? '',
          created_at: run.created_at ?? '',
          updated_at: run.updated_at ?? ''
        }))
      }
    } catch (error) {
      errorHandler(error, GithubActionRunRule.name, repo.name)
    }
  }
}
