import { Dockerfile, FileTypeEnum, Repo } from '../../types'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'
import JSZip from 'jszip'

export class DockerfileRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (downloaded.files[fileName].name.endsWith('Dockerfile')) {
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].deps.push(this.parseDockerfile(content, fileName))
      }
    } catch (error) {
      errorHandler(error, DockerfileRule.name, repo.name, branchName, fileName)
    }
  }

  parseDockerfile (dockerfileContent: string, fileName: string): Dockerfile {
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
}
