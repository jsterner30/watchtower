import {
  type Repo
} from '../../types'
import { errorHandler, getEnv } from '../../util'
import { SecondaryBranchRule } from '../rule'

export class StaleBranchRule extends SecondaryBranchRule {
  async run (repo: Repo, branchName: string): Promise<void> {
    try {
      // the below line checks if the branch is not a default, protected, or deployed branch
      if (!repo.branches[branchName].defaultBranch && !repo.branches[branchName].branchProtections.protected && !repo.branches[branchName].deployedBranch) {
        const currentDate = new Date()
        const { staleDaysThreshold } = await getEnv()
        const thresholdDate = new Date(new Date().setDate(currentDate.getDate() - staleDaysThreshold))
        if (thresholdDate > new Date(repo.branches[branchName].lastCommit.date)) {
          repo.branches[branchName].staleBranch = true
        }
      }
    } catch (error) {
      errorHandler(error, StaleBranchRule.name, repo.name, branchName)
    }
  }
}
