import JSZip from 'jszip'
import { parse } from '@cdktf/hcl2json'
import { FileTypeEnum, type Repo, TerraformFile } from '../../types'
import { errorHandler, ParsingError } from '../../util'
import { BranchRule } from '../rule'

export class TerraformRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (fileName.endsWith('.tf')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].ruleFiles.push(await this.parseTerraformFile(fileName, content))
      } else if (fileName.endsWith('.tfvars')) {
        // TODO parse tfvars file to ensure there are no secrets?
      }
    } catch (error) {
      errorHandler(error, TerraformRule.name, repo.name, branchName, fileName)
    }
  }

  async parseTerraformFile (fileName: string, content: string): Promise<TerraformFile> {
    try {
      return {
        fileName,
        fileType: FileTypeEnum.TERRAFORM,
        contents: await parse(fileName, content)
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
