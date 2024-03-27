import { FileTypeEnum, Repo, OpenAPIFile } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'
import { load } from 'js-yaml'

export class OpenAPIDocRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      let openApiDoc: OpenAPIFile | null = null
      if (downloaded.files[fileName].name.endsWith('.json')) {
        const content = await downloaded.files[fileName].async('string')
        openApiDoc = await this.parseOpenAPIFile(content, fileName, false)
      } else if (downloaded.files[fileName].name.endsWith('.yml') || downloaded.files[fileName].name.endsWith('.yaml')) {
        const content = await downloaded.files[fileName].async('string')
        openApiDoc = await this.parseOpenAPIFile(content, fileName, false)
      }

      if (openApiDoc != null) {
        repo.branches[branchName].ruleFiles.push(openApiDoc)
      }
    } catch (error) {
      errorHandler(error, OpenAPIDocRule.name, repo.name, branchName, fileName)
    }
  }

  async parseOpenAPIFile (content: string, fileName: string, isYML: boolean): Promise<OpenAPIFile | null> {
    try {
      const contentJSON: Record<string, any> = isYML ? load(content) as Record<string, any> : JSON.parse(content)
      if (contentJSON.swagger != null || contentJSON.openapi != null) {
        return {
          fileName,
          fileType: FileTypeEnum.OPEN_API,
          contents: {} // TODO: fix when memory is improved
        }
      }
      return null
    } catch (error) {
      return null
    }
  }
}
