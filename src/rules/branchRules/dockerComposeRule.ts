import { DockerComposeFile, FileTypeEnum, RepoInfo } from '../../types'
import { load } from 'js-yaml'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class DockerComposeRule extends BranchRule {
  async run (repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('docker-compose.yml') || downloaded.files[fileName].name.endsWith('docker-compose.yaml')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].deps.push(this.parseDockerCompose(content, fileName))
      }
    } catch (error) {
      errorHandler(error, DockerComposeRule.name, repo.name, branchName, fileName)
    }
  }

  parseDockerCompose (dockerComposeContent: string, fileName: string): DockerComposeFile {
    const parsedContent = load(dockerComposeContent) as Record<string, any>
    return {
      fileName,
      fileType: FileTypeEnum.DOCKER_COMPOSE,
      services: parsedContent.services ?? {},
      version: parsedContent.version ?? 'unknown'
    }
  }
}
