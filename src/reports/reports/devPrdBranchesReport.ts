import {
  GradeEnum,
  HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class DevPrdBranchesReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'hasDev', title: 'Has a Dev Branch' },
      { id: 'hasPrd', title: 'Has a Prd Branch' },
      { id: 'devDefault', title: 'Dev Branch is Default' }
    ]
    const devPrdBranchesReportOutput = new ReportOutputData(header, this._outputDir, 'devPrdBranchReport')

    for (const repo of repos) {
      let hasDev = false
      let hasPrd = false
      for (const branchName in repo.branches) {
        try {
          if (branchName === 'dev') {
            hasDev = true
          } else if (branchName === 'prd') {
            hasPrd = true
          }
        } catch (error) {
          errorHandler(error, DevPrdBranchesReport.name, repo.name, branchName)
        }
      }

      devPrdBranchesReportOutput.addRow({
        repoName: repo.name,
        hasDev,
        hasPrd,
        devDefault: repo.defaultBranch === 'dev'
      })
    }

    this._reportOutputs.push(devPrdBranchesReportOutput)
  }

  grade (input: unknown): HealthScore {
    logger.error('The DevPrdBranchesReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public get name (): string {
    return DevPrdBranchesReport.name
  }
}
