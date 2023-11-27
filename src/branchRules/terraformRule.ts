import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { logger } from '../util/logger'
import { parse } from '@cdktf/hcl2json'
import { type BranchRule, FileTypeEnum, type RepoInfo, TerraformFile } from '../types'

export const terraformRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (fileName.endsWith('.tf')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(await parseTerraformFile(fileName, content))
    } else if (fileName.endsWith('.tfvars')) {
      // TODO parse tfvars file for secrets?
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting terraform files for repo: ${repo.name}, branch: ${branchName}, error: ${error.message}`)
    } else {
      logger.error(`Error getting terraform files for repo: ${repo.name}, branch: ${branchName}, error: ${error as string}`)
    }
  }
}

async function parseTerraformFile (fileName: string, content: string): Promise<TerraformFile> {
  return {
    fileName,
    fileType: FileTypeEnum.TERRAFORM,
    contents: await parse(fileName, content)
  }
}
