import {
  type RepoInfo, SecondaryBranchRule
} from '../types'
import { errorHandler, getEnv } from '../util'

export const staleBranchRule: SecondaryBranchRule = async (repo: RepoInfo, branchName: string): Promise<void> => {
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
    errorHandler(error, staleBranchRule.name, repo.name, branchName)
  }
}
