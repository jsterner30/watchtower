import { type BranchRule, FileTypeEnum, PackageJsonFile, type RepoInfo } from '../types'
import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { logger } from '../util/logger'

export const packageJsonRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('package.json')) {
      repo.branches[branchName].deps.push(parsePackageJson(await downloaded.files[fileName].async('string'), fileName))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting package.json file for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting package.json file for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}

function parsePackageJson (packageJsonContent: string, fileName: string): PackageJsonFile {
  return {
    fileName,
    fileType: FileTypeEnum.PACKAGE_JSON,
    ...JSON.parse(packageJsonContent)
  }
}
