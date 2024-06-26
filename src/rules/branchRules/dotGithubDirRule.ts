import { FileTypeEnum, GHAFile, type Repo } from '../../types'
import JSZip from 'jszip'
import { load } from 'js-yaml'
import { errorHandler, ParsingError } from '../../util'
import { BranchRule } from '../rule'

export class DotGithubDirRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.includes('/.github/') && !downloaded.files[fileName].dir) { // we are in the .github directory
        if (downloaded.files[fileName].name.endsWith('.yml') || downloaded.files[fileName].name.endsWith('.yaml')) { // this is a GHA file
          const content = await downloaded.files[fileName].async('string')
          repo.branches[branchName].ruleFiles.push(this.parseYmlGHA(content, fileName))
        } else if (downloaded.files[fileName].name.endsWith('CODEOWNERS')) {
          // TODO parse and store codeowners info
        }
      }
    } catch (error) {
      errorHandler(error, DotGithubDirRule.name, repo.name, branchName, fileName)
    }
  }

  parseYmlGHA (ghFile: string, fileName: string): GHAFile {
    try {
      return {
        fileName,
        fileType: FileTypeEnum.GITHUB_ACTION,
        contents: load(ghFile) as Record<string, any>,
        dependabot: fileName.endsWith('dependabot.yml')
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
