import JSZip from 'jszip'
import { ReadmeFile, FileTypeEnum, type Repo } from '../../types'
import { errorHandler, ParsingError } from '../../util'
import MarkdownIt from 'markdown-it'
import { BranchRule } from '../rule'

export class ReadmeRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('README.md')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].ruleFiles.push(this.parseReadmeFile(content, fileName))
      }
    } catch (error) {
      errorHandler(error, ReadmeRule.name, repo.name, branchName, fileName)
    }
  }

  parseReadmeFile (readmeContent: string, fileName: string): ReadmeFile {
    try {
      const md = new MarkdownIt()
      const contents = md.parse(readmeContent, {})

      return {
        fileName,
        fileType: FileTypeEnum.README,
        contents
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
