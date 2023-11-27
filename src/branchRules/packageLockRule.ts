import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { type BranchRule, FileTypeEnum, PackageLockFile, RepoInfo } from '../types'
import { errorHandler } from '../util'

export const packageLockRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('package-lock.json')) {
      repo.branches[branchName].deps.push(parsePackageLock(await downloaded.files[fileName].async('string'), fileName))
    }
  } catch (error) {
    errorHandler(error, packageLockRule.name, repo.name, branchName)
  }
}

function parsePackageLock (packageLockContent: string, fileName: string): PackageLockFile {
  return {
    fileName,
    fileType: FileTypeEnum.PACKAGE_LOCK,
    ...JSON.parse(packageLockContent)
  }
}
