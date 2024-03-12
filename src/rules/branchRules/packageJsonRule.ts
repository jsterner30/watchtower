import { FileTypeEnum, PackageJsonFile, Repo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class PackageJsonRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('package.json') && !downloaded.files[fileName].name.includes('node_modules')) {
        repo.branches[branchName].ruleFiles.push(this.parsePackageJson(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, PackageJsonRule.name, repo.name, branchName, fileName)
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
