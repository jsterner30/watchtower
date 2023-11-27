import JSZip from 'jszip'
import type { RepoInfo, BranchRule } from '../types'
import { Octokit } from '@octokit/rest'
import { errorHandler } from '../util'

export const fileCountRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    let fileCount = repo.branches[branchName].fileCount

    if (!downloaded.files[fileName].dir) {
      fileCount++
    }
    repo.branches[branchName].fileCount = fileCount
  } catch (error) {
    errorHandler(error, fileCountRule.name, repo.name, branchName)
  }
}
