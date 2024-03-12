import type {
  Repo,
  ExtremeVersions, Grade
} from '../../../../types'
import { RepoVersionReport } from '../repoVersionReport'
import { TerraformVersionUtils } from './terraformVersionUtils'
import { GradeEnum } from '../../../../types'

export class TerraformRepoVersionReport extends RepoVersionReport {
  protected versionUtils = new TerraformVersionUtils()
  public get name (): string {
    return TerraformRepoVersionReport.name
  }

  protected async getGradeMinValues (): Promise<Record<string, Grade>> {
    return {
      '1.5.0': GradeEnum.A,
      '1.2.5': GradeEnum.B,
      '1.0.0': GradeEnum.C,
      '0.14.0': GradeEnum.D,
      '0.0.0': GradeEnum.F
    }
  }

  protected modifyReportRepoResults (allBranchRepoExtrema: ExtremeVersions, repo: Repo): void {
    repo.reportResults.lowTerraformVersion = allBranchRepoExtrema.lowestVersion
    repo.reportResults.highTerraformVersion = allBranchRepoExtrema.highestVersion
  }
}
