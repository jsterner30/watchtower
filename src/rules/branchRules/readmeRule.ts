import JSZip from 'jszip'
import { ReadmeFile, FileTypeEnum, type RepoInfo } from '../../types'
import { errorHandler } from '../../util'
import MarkdownIt from 'markdown-it'
import { BranchRule } from '../rule'

export class ReadmeRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('README.md')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].deps.push(this.parseReadmeFile(content, fileName))
      }
    } catch (error) {
      errorHandler(error, ReadmeRule.name, repo.name, branchName)
    }
  }

  parseReadmeFile (readmeContent: string, fileName: string): ReadmeFile {
    const md = new MarkdownIt()
    const contents = md.parse(readmeContent, {})

    return {
      fileName,
      fileType: FileTypeEnum.README,
      contents
    }
  }
}
