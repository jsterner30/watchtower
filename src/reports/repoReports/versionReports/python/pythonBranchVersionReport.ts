import type {
  Repo,
  ExtremeVersions
} from '../../../../types'
import { BranchVersionReport } from '../branchVersionReport'
import { PythonVersionUtils } from './pythonVersionUtils'

export class PythonBranchVersionReport extends BranchVersionReport {
  protected versionUtils = new PythonVersionUtils()

  protected modifyReportBranchResults = (branchExtremeVersions: ExtremeVersions, repo: Repo, branchName: string): void => {
    repo.branches[branchName].reportResults.lowPythonVersion = branchExtremeVersions.lowestVersion
    repo.branches[branchName].reportResults.highPythonVersion = branchExtremeVersions.highestVersion
  }

  public get name (): string {
    return PythonBranchVersionReport.name
  }
}
