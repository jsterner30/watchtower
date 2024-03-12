import {
  FileTypeEnum,
  type Repo,
  validGHAFile
} from '../../types'
import { errorHandler } from '../../util'
import { SecondaryBranchRule } from '../rule'

export class DeployedBranchRule extends SecondaryBranchRule {
  async run (repo: Repo, branchName: string): Promise<void> {
    try {
      if (repo.branches[branchName].defaultBranch) {
        for (const ruleFile of repo.branches[branchName].ruleFiles) {
          if (validGHAFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.GITHUB_ACTION && ruleFile.fileName.includes('deploy.yml')) {
            const deployedBranches = ruleFile.contents?.on?.push?.branches
            if (deployedBranches != null) {
              for (const branch of deployedBranches) {
                if (repo.branches[branch] != null) {
                  repo.branches[branch].deployedBranch = true
                }
              }
            }
          }
        }
      }
    } catch (error) {
      errorHandler(error, DeployedBranchRule.name, repo.name, branchName)
    }
  }
}
