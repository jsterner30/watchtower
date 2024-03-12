import { LicenseFile, FileTypeEnum, Repo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class LicenseFileRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('LICENSE') && !downloaded.files[fileName].name.includes('node_modules')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].ruleFiles.push(this.parseLicense(content, fileName))
      }
    } catch (error) {
      errorHandler(error, LicenseFileRule.name, repo.name, branchName, fileName)
    }
  }

  parseLicense (content: string, fileName: string): LicenseFile {
    return {
      fileName,
      fileType: FileTypeEnum.LICENSE,
      contents: content.split('\n')
    }
  }
}
