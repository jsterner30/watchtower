import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { logger } from '../util/logger'
import { type BranchRule, Dockerfile, FileTypeEnum, type RepoInfo } from '../types'

export const dockerfileRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.includes('Dockerfile')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(parseDockerfile(content, fileName))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting dockerfile for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting dockerfile for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}

function parseDockerfile (dockerfileContent: string, fileName: string): Dockerfile {
  const instructions: string[] = []
  const lines = dockerfileContent.split('\n')
  let image = ''

  // some Dockerfile create a "base" image at the beginning and then create different envs from that base image.
  // I am just going to assume that the first FROM statement is the actual image we are pulling from the dockerhub registry, which is what we care about
  let imageSet = false
  for (const line of lines) {
    // Remove leading and trailing whitespace
    const trimmedLine = line.trim()

    // Ignore comments and empty lines
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue
    }

    instructions.push(trimmedLine)

    if (trimmedLine.startsWith('FROM') && !imageSet) {
      image = trimmedLine.split('FROM')[1].trim().toLowerCase().split(' as')[0]
      imageSet = true
    }
  }

  return {
    fileName,
    fileType: FileTypeEnum.DOCKERFILE,
    image,
    instructions
  }
}
