import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { type BranchRule, FileTypeEnum, PackageLockFile, RepoInfo } from '../types'
import { logger } from '../util/logger'

export const packageLockRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('package-lock.json')) {
      repo.branches[branchName].deps.push(parsePackageLock(await downloaded.files[fileName].async('string'), fileName))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting package-lock.json file for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting package-lock.json file for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}

function parsePackageLock (packageLockContent: string, fileName: string): PackageLockFile {
  return {
    fileName,
    fileType: FileTypeEnum.PACKAGE_LOCK,
    ...JSON.parse(packageLockContent)
  }
}
