import JSZip from 'jszip'
import type { RepoInfo, BranchRule } from '../types'
import { Octokit } from '@octokit/rest'
import { errorHandler } from '../util'

export const fileCountRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (!downloaded.files[fileName].dir) {
      const extensions = fileName.split('.').filter(Boolean)
      const fileType = extensions[extensions.length - 1]
      if (repo.branches[branchName].fileTypes[fileType] == null) {
        repo.branches[branchName].fileTypes[fileType] = 0
      }
      repo.branches[branchName].fileTypes[fileType] += 1
    }
  } catch (error) {
    errorHandler(error, fileCountRule.name, repo.name, branchName)
  }
}
