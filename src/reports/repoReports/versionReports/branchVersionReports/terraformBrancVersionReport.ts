import type {
  Repo,
  VersionLocation,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from './branchVersionReport'
import { gatherTerraformFiles } from '../../../../util'

export class TerraformBranchVersionReport extends BranchVersionReport {
  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowTerraformVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.lowTerraformVersion = branchExtremeVersions.highestVersion
  }

  protected gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    return gatherTerraformFiles(repo, branchName)
  }

  public get name (): string {
    return TerraformBranchVersionReport.name
  }
}
