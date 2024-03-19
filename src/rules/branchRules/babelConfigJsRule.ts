import { BabelConfigJs, FileTypeEnum, Repo } from '../../types'
import { BranchRule } from '../rule'
import JSZip from 'jszip'
import { errorHandler, ParsingError } from '../../util/error'

export class BabelConfigJsRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('babel.config.js') && !downloaded.files[fileName].name.includes('node_modules')) {
        repo.branches[branchName].ruleFiles.push(this.parseBabelConfigJs(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, BabelConfigJsRule.name, repo.name, branchName, fileName)
    }
  }

  parseBabelConfigJs (content: string, fileName: string): BabelConfigJs {
    try {
      // hard to parse because the babel.config.js file exports something that can be just an exported object
      // or an exported function. Easier to just leave as raw text and filter with regex later on.
      const contents = content.split('\n')

      return {
        fileName,
        fileType: FileTypeEnum.BABEL_CONFIG_JS,
        contents
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
