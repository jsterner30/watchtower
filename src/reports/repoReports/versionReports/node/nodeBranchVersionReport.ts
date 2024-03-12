import type {
  Repo,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from '../branchVersionReport'
import { NodeVersionUtils } from './nodeVersionUtils'

export class NodeBranchVersionReport extends BranchVersionReport {
  protected versionUtils = new NodeVersionUtils()

  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowNodeVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highNodeVersion = branchExtremeVersions.highestVersion
  }

  public get name (): string {
    return NodeBranchVersionReport.name
  }
}
