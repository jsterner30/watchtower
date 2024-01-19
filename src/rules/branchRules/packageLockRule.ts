import JSZip from 'jszip'
import { FileTypeEnum, PackageLockFile, RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'

export class PackageLockRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('package-lock.json') && !downloaded.files[fileName].name.includes('node_modules')) {
        repo.branches[branchName].deps.push(this.parsePackageLock(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, PackageLockRule.name, repo.name, branchName, fileName)
    }
  }

  parsePackageLock (packageLockContent: string, fileName: string): PackageLockFile {
    return {
      fileName,
      fileType: FileTypeEnum.PACKAGE_LOCK,
      ...JSON.parse(packageLockContent)
    }
  }
}
