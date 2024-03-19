import { DockerComposeFile, FileTypeEnum, Repo } from '../../types'
import { load } from 'js-yaml'
import { BranchRule } from '../rule'
import JSZip from 'jszip'
import { errorHandler, ParsingError } from '../../util/error'

export class DockerComposeRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('docker-compose.yml') || downloaded.files[fileName].name.endsWith('docker-compose.yaml')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].ruleFiles.push(this.parseDockerCompose(content, fileName))
      }
    } catch (error) {
      errorHandler(error, DockerComposeRule.name, repo.name, branchName, fileName)
    }
  }

  parseDockerCompose (dockerComposeContent: string, fileName: string): DockerComposeFile {
    try {
      const parsedContent = load(dockerComposeContent) as Record<string, any>
      return {
        fileName,
        fileType: FileTypeEnum.DOCKER_COMPOSE,
        services: parsedContent.services ?? {},
        version: parsedContent.version ?? 'unknown'
      }
    } catch (error) {
      throw new ParsingError((error as Error).message)
    }
  }
}
