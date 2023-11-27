import {
  FileTypeEnum,
  type RepoInfo,
  validGHAFile,
  SecondaryBranchRule
} from '../types'

export const deployedBranchRule: SecondaryBranchRule = async (repo: RepoInfo, branchName: string): Promise<void> => {
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
}
