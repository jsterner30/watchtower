import { logger } from '../util/logger'
import JSZip from 'jszip'
import type { RepoInfo, BranchRule } from '../types'
import { Octokit } from '@octokit/rest'

export const fileCountRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    let fileCount = repo.branches[branchName].fileCount

    if (!downloaded.files[fileName].dir) {
      fileCount++
    }
    repo.branches[branchName].fileCount = fileCount
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting file count for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting file count for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}
