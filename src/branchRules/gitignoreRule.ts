import { type BranchRule, FileTypeEnum, GitignoreFile, type RepoInfo } from '../types'
import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { errorHandler } from '../util'

export const gitignoreRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('.gitignore')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(parseGitignore(content, fileName))
    }
  } catch (error) {
    errorHandler(error, gitignoreRule.name, repo.name, branchName)
  }
}

function parseGitignore (gitignoreContent: string, fileName: string): GitignoreFile {
  const ignored: string[] = []
  const lines = gitignoreContent.split('\n')

  for (const line of lines) {
    // Remove leading and trailing whitespace
    const trimmedLine = line.trim()

    // Ignore comments and empty lines
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue
    }

    ignored.push(trimmedLine)
  }

  return {
    fileName,
    fileType: FileTypeEnum.GITIGNORE,
    ignored
  }
}
