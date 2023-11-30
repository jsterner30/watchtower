import { type BranchRule, FileTypeEnum, GHAFile, type RepoInfo } from '../types'
import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { load } from 'js-yaml'
import { errorHandler } from '../util'

export const dotGithubDirRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (downloaded.files[fileName].name.includes('/.github/') && !downloaded.files[fileName].dir) { // we are in the .github directory
      if (downloaded.files[fileName].name.endsWith('.yml') || downloaded.files[fileName].name.endsWith('.yaml')) { // this is a GHA file
        const content = await downloaded.files[fileName].async('string')
        repo.branches[branchName].deps.push(parseYmlGHA(content, fileName))
      } else if (downloaded.files[fileName].name.endsWith('CODEOWNERS')) {
        // TODO parse and store codeowners info
      }
    }
  } catch (error) {
    errorHandler(error, dotGithubDirRule.name, repo.name, branchName)
  }
}

function parseYmlGHA (ghFile: string, fileName: string): GHAFile {
  return {
    fileName,
    fileType: FileTypeEnum.GITHUB_ACTION,
    contents: load(ghFile) as Record<string, any>,
    dependabot: fileName.endsWith('dependabot.yml')
  }
}
