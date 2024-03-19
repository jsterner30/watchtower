import { FileTypeEnum, PomAsJson, PomXmlFile, Repo } from '../../types'
import { errorHandler, ParsingError } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'
import * as convert from 'xml-js'

export class PomXmlRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('pom.xml')) {
        repo.branches[branchName].ruleFiles.push(this.parsePomXmlFile(await downloaded.files[fileName].async('string'), fileName))
      }
    } catch (error) {
      errorHandler(error, PomXmlRule.name, repo.name, branchName, fileName)
    }
  }

  parsePomXmlFile (pomFileContents: string, fileName: string): PomXmlFile {
    try {
      return {
        fileName,
        fileType: FileTypeEnum.POM_XML,
        ...convert.xml2js(pomFileContents) as PomAsJson
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
