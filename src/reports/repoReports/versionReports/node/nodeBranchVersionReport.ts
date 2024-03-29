import type {
  Repo,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport, BranchVersionReportData } from '../branchVersionReport'
import { NodeVersionUtils } from './nodeVersionUtils'
import { anyStringRegex, Exception } from '../../../../util'
import { WriteableRegExp } from '../../../../util/writable'

export class NodeBranchVersionReport extends BranchVersionReport {
  protected versionUtils = new NodeVersionUtils()

  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowNodeVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highNodeVersion = branchExtremeVersions.highestVersion
  }

  public get name (): string {
    return NodeBranchVersionReport.name
  }

  protected getExceptions (): Array<Exception<BranchVersionReportData>> {
    return [
      {
        repoName: new WriteableRegExp(/.*github-action.*/),
        branchName: new WriteableRegExp(/v1/),
        lowestVersion: new WriteableRegExp(/^12.*/),
        lowestVersionPath: anyStringRegex,
        highestVersion: anyStringRegex,
        highestVersionPath: anyStringRegex
      }
    ]
  }
}
