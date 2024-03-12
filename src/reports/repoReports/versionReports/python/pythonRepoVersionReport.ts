import type {
  Repo,
  ExtremeVersions, Grade
} from '../../../../types'
import { RepoVersionReport } from '../repoVersionReport'
import { GradeEnum } from '../../../../types'
import { PythonVersionUtils } from './pythonVersionUtils'

export class PythonRepoVersionReport extends RepoVersionReport {
  protected versionUtils = new PythonVersionUtils()

  public get name (): string {
    return PythonRepoVersionReport.name
  }

  protected async getGradeMinValues (): Promise<Record<string, Grade>> {
    return {
      '3.12.0': GradeEnum.A,
      '3.10.0': GradeEnum.B,
      '3.8.0': GradeEnum.C,
      '3.6.0': GradeEnum.D,
      '0.0.0': GradeEnum.F
    }
  }

  protected modifyReportRepoResults (allBranchRepoExtrema: ExtremeVersions, repo: Repo): void {
    repo.reportResults.lowPythonVersion = allBranchRepoExtrema.lowestVersion
    repo.reportResults.highPythonVersion = allBranchRepoExtrema.highestVersion
  }
}
