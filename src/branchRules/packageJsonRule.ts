import { type BranchRule, FileTypeEnum, PackageJsonFile, type RepoInfo } from '../types'
import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { errorHandler } from '../util'

export const packageJsonRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('package.json')) {
      repo.branches[branchName].deps.push(parsePackageJson(await downloaded.files[fileName].async('string'), fileName))
    }
  } catch (error) {
    errorHandler(error, packageJsonRule.name, repo.name, branchName)
  }
}

function parsePackageJson (packageJsonContent: string, fileName: string): PackageJsonFile {
  return {
    fileName,
    fileType: FileTypeEnum.PACKAGE_JSON,
    ...JSON.parse(packageJsonContent)
  }
}
