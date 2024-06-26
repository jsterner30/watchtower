import { errorHandler, nodeLTSUrl } from '../../../../util'
import {
  FileTypeEnum,
  Repo,
  validBabelConfigJs,
  validDockerfile,
  validGHAFile, validGHASourceFile,
  validTerraformFile,
  VersionLocation
} from '../../../../types'
import { VersionUtils } from '../versionReport'

export class NodeVersionUtils extends VersionUtils {
  public async fetchNodeLTSVersion (): Promise<string> {
    try {
      const response = await fetch(nodeLTSUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule data. Status: ${response.status}`)
      }

      const scheduleData: any = await response.json()
      for (const version in scheduleData) {
        if (new Date(scheduleData[version].lts) < new Date() && new Date(scheduleData[version].maintenance) > new Date()) {
          return version.split('v')[1]
        }
      }

      return '20'
    } catch (error) {
      errorHandler(error, this.fetchNodeLTSVersion.name)
      return '20'
    }
  }

  public gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    let branchNodeFiles: VersionLocation[] = []
    for (const ruleFile of repo.branches[branchName].ruleFiles) {
      if (validDockerfile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.DOCKERFILE) {
        branchNodeFiles = [...branchNodeFiles, ...this.getDockerfileImageVersion(ruleFile, branchName, 'node')]
      } else if (validGHAFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.GITHUB_ACTION) {
        // get the node_version environment variable that most GHA files have in the top
        if (ruleFile.contents.env?.node_version != null) {
          branchNodeFiles.push({ filePath: ruleFile.fileName, version: ruleFile.contents.env.node_version, branch: branchName })
        } else {
          // if they don't have a node_version environment variable, traverse the file looking for key-values where the key
          // is node-version or node_version to get it even if they don't have it as an environment variable
          this.traverseObject(ruleFile, ['node-version', 'node_version'], null, branchNodeFiles, ruleFile.fileName, branchName)
        }
      } else if (validTerraformFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.TERRAFORM) {
        branchNodeFiles = [...branchNodeFiles, ...this.getTerraformLambdaRuntimeVersion(ruleFile, branchName, 'nodejs')]
      } else if (validGHASourceFile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.GITHUB_ACTION_SOURCE) {
        if ((ruleFile.contents?.runs?.using as string)?.includes('node')) {
          const version = ruleFile.contents.runs.using.split('node')[1]
          branchNodeFiles.push({ filePath: ruleFile.fileName, version, branch: branchName })
        }
      } else if (validBabelConfigJs.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.BABEL_CONFIG_JS) {
        const nodeVersionArr: string[] = []
        // look for things of the pattern "node: ##" or "node: ##.##.##", etc. Not being super picky.
        const nodeBabelConfigPattern = /(?<=node: )[\d+|.?]+/
        for (const line of ruleFile.contents) {
          const match = line.match(nodeBabelConfigPattern)
          if (match != null) nodeVersionArr.push(match[0])
        }
        for (const version of nodeVersionArr) {
          branchNodeFiles.push({ filePath: ruleFile.fileName, version, branch: branchName })
        }
      }
    }
    return branchNodeFiles
  }

  public get name (): string {
    return NodeVersionUtils.name
  }
}
