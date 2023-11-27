import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { logger } from '../util/logger'
import { type BranchRule, DockerComposeFile, type RepoInfo, FileTypeEnum } from '../types'
import { load } from 'js-yaml'

export const dockerComposeRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('docker-compose.yml') || downloaded.files[fileName].name.endsWith('docker-compose.yaml')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(parseDockerCompose(content, fileName))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting docker-compose file for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting docker-compose file for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}

function parseDockerCompose (dockerComposeContent: string, fileName: string): DockerComposeFile {
  const parsedContent = load(dockerComposeContent) as Record<string, any>
  return {
    fileName,
    fileType: FileTypeEnum.DOCKER_COMPOSE,
    services: parsedContent.services ?? {},
    version: parsedContent.version ?? 'unknown'
  }
}
