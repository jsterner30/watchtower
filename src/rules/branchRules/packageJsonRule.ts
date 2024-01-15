import { FileTypeEnum, PackageJsonFile, RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class PackageJsonRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('package.json')) {
        repo.branches[branchName].deps.push(this.parsePackageJson(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, PackageJsonRule.name, repo.name, branchName)
    }
  }

  parsePackageJson (packageJsonContent: string, fileName: string): PackageJsonFile {
    return {
      fileName,
      fileType: FileTypeEnum.PACKAGE_JSON,
      ...JSON.parse(packageJsonContent)
    }
  }
}
