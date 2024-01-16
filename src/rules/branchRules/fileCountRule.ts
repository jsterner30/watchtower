import JSZip from 'jszip'
import type { RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'

export class FileCountRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      let fileCount = repo.branches[branchName].fileCount

      if (!downloaded.files[fileName].dir) {
        fileCount++
      }
      repo.branches[branchName].fileCount = fileCount
    } catch (error) {
      errorHandler(error, FileCountRule.name, repo.name, branchName)
    }
  }
}