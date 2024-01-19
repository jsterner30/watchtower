import JSZip from 'jszip'
import type { RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'

export class FileTypesRules extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
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
      errorHandler(error, FileTypesRules.name, repo.name, branchName, fileName)
    }
  }
}
