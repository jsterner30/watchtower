import JSZip from 'jszip'
import type { Repo } from '../../types'
import { errorHandler, ParsingError } from '../../util'
import { BranchRule } from '../rule'

export class FileTypesRules extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (!downloaded.files[fileName].dir) {
        const fileType = this.getFileTypeFromPath(fileName)
        if (fileType != null) {
          if (repo.branches[branchName].fileTypes[fileType] == null) {
            repo.branches[branchName].fileTypes[fileType] = 0
          }
          repo.branches[branchName].fileTypes[fileType] += 1
        }
      }
    } catch (error) {
      errorHandler(error, FileTypesRules.name, repo.name, branchName, fileName)
    }
  }

  getFileTypeFromPath (fileName: string): string | null {
    try {
      let fileType: string | null = null
      const extensions = fileName.split('.').filter(Boolean)
      if (extensions.length === 1) { // this is a filetype with no extension like Dockerfile
        fileType = (extensions[0].split('/')).pop() ?? null
      } else {
        fileType = extensions[extensions.length - 1]
      }
      return fileType
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
