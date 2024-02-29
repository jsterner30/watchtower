import type {
  Repo,
  VersionLocation,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from './branchVersionReport'
import { gatherPythonFiles } from '../../../../util'

export class PythonBranchVersionReport extends BranchVersionReport {
  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowPythonVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highPythonVersion = branchExtremeVersions.highestVersion
  }

  protected gatherSoftwareFiles (repo: Repo, branchName: string): VersionLocation[] {
    return gatherPythonFiles(repo, branchName)
  }

  public get name (): string {
    return PythonBranchVersionReport.name
  }
}
