import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { type BranchRule, ReadmeFile, FileTypeEnum, type RepoInfo } from '../types'
import { errorHandler } from '../util'
import MarkdownIt from 'markdown-it'

export const readmeRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.endsWith('README.md')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(parseReadmefile(content, fileName))
    }
  } catch (error) {
    errorHandler(error, readmeRule.name, repo.name, branchName)
  }
}

function parseReadmefile (readmeContent: string, fileName: string): ReadmeFile {
  const md = new MarkdownIt()
  const contents = md.parse(readmeContent, {})

  return {
    fileName,
    fileType: FileTypeEnum.README,
    contents
  }
}
