import { FileTypeEnum, GHAFile, type Repo } from '../../types'
import JSZip from 'jszip'
import { load } from 'js-yaml'
import { errorHandler } from '../../util'
import { BranchRule } from '../rule'

// this rule is for the "action.yml" file that defines what happens in a github action source code
// for the rule associated with the CI and deployment workflows found in the .github dir look at the "dotGithubDirRule.ts" file
export class GithubActionSourceFileRule extends BranchRule {
  async run (repo: Repo, downloaded: JSZip, branchName: string, fileName: string): Promise<void> {
    try {
      if (!downloaded.files[fileName].dir) {
        if (downloaded.files[fileName].name.endsWith('action.yml') || downloaded.files[fileName].name.endsWith('action.yaml')) { // this is a github action source code action file
          const content = await downloaded.files[fileName].async('string')
          repo.branches[branchName].ruleFiles.push(this.parseYmlGHA(content, fileName))
        }
      }
    } catch (error) {
      errorHandler(error, GithubActionSourceFileRule.name, repo.name, branchName, fileName)
    }
  }

  parseYmlGHA (ghFile: string, fileName: string): GHAFile {
    return {
      fileName,
      fileType: FileTypeEnum.GITHUB_ACTION_SOURCE,
      contents: load(ghFile) as Record<string, any>,
      dependabot: fileName.endsWith('dependabot.yml')
    }
  }
}
