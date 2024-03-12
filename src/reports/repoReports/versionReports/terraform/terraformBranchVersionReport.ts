import type {
  Repo,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from '../branchVersionReport'
import { TerraformVersionUtils } from './terraformVersionUtils'

export class TerraformBranchVersionReport extends BranchVersionReport {
  protected versionUtils = new TerraformVersionUtils()

  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowTerraformVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highTerraformVersion = branchExtremeVersions.highestVersion
  }

  public get name (): string {
    return TerraformBranchVersionReport.name
  }
}
