import { Octokit } from '@octokit/rest'
import { getEnv } from '../util'
import { logger } from '../util/logger'
import type { RepoInfo, RepoRule } from '../types'

export interface GitHubActionsRun {
  id: number
  status: string
  conclusion: string
  created_at: string
  updated_at: string
}

export const githubActionRunRule: RepoRule = async (octokit: Octokit, repo: RepoInfo): Promise<void> => {
  try {
    const { data: runs } = await octokit.actions.listWorkflowRunsForRepo({
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
    if (error instanceof Error) {
      logger.error(`Error getting GitHub Actions runs for branches in repo: ${repo.name}: ${error.message}`)
    } else {
      logger.error(`Error getting GitHub Actions runs for branches in repo: ${repo.name}: ${error as string}`)
    }
  }
}
