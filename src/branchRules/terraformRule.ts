import { Octokit } from '@octokit/rest'
import JSZip from 'jszip'
import { parse } from '@cdktf/hcl2json'
import { type BranchRule, FileTypeEnum, type RepoInfo, TerraformFile } from '../types'
import { errorHandler } from '../util'

export const terraformRule: BranchRule = async (octokit: Octokit, repo: RepoInfo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> => {
  try {
    if (fileName.endsWith('.tf')) {
      const content = await downloaded.files[fileName].async('string')
      repo.branches[branchName].deps.push(await parseTerraformFile(fileName, content))
    } else if (fileName.endsWith('.tfvars')) {
      // TODO parse tfvars file to ensure there are no secrets?
    }
  } catch (error) {
    errorHandler(error, terraformRule.name, repo.name, branchName)
  }
}

async function parseTerraformFile (fileName: string, content: string): Promise<TerraformFile> {
  return {
    fileName,
    fileType: FileTypeEnum.TERRAFORM,
    contents: await parse(fileName, content)
  }
}
