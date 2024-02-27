import type {
  Repo,
  VersionLocation,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from './branchVersionReport'
import { gatherNodeFiles } from '../../../../util'

export class NodeBranchVersionReport extends BranchVersionReport {
  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowNodeVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highNodeVersion = branchExtremeVersions.highestVersion
  }

  protected gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    return gatherNodeFiles(repo, branchName)
  }

  public get name (): string {
    return NodeBranchVersionReport.name
  }
}
