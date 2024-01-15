import {
  FileTypeEnum,
  type RepoInfo,
  validGHAFile
} from '../../types'
import { errorHandler } from '../../util'
import { SecondaryBranchRule } from '../rule'

export class DeployedBranchRule extends SecondaryBranchRule {
  async run (repo: RepoInfo, branchName: string): Promise<void> {
    try {
      if (repo.branches[branchName].defaultBranch) {
        for (const dep of repo.branches[branchName].deps) {
          if (validGHAFile.Check(dep) && dep.fileType === FileTypeEnum.GITHUB_ACTION && dep.fileName.includes('deploy.yml')) {
            const deployedBranches = dep.contents?.on?.push?.branches
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
