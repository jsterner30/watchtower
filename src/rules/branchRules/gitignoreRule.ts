import { FileTypeEnum, GitignoreFile, RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class GitignoreRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('.gitignore')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].deps.push(this.parseGitignore(content, fileName))
      }
    } catch (error) {
      errorHandler(error, GitignoreRule.name, repo.name, branchName)
    }
  }

  parseGitignore (gitignoreContent: string, fileName: string): GitignoreFile {
    const ignored: string[] = []
    const lines = gitignoreContent.split('\n')

    for (const line of lines) {
      // Remove leading and trailing whitespace
      const trimmedLine = line.trim()

      // Ignore comments and empty lines
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        continue
      }

      ignored.push(trimmedLine)
    }

    return {
      fileName,
      fileType: FileTypeEnum.GITIGNORE,
      ignored
    }
  }
}
