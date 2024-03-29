import {
  type Repo
} from '../../../types'
import { errorHandler, HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface DevPrdBranchReportData extends RepoReportData {
  repoName: string
  hasDev: boolean
  hasPrd: boolean
  devDefault: boolean
}

interface DevPrdBranchReportWriters extends Writers<DevPrdBranchReportData> {
  devPrdBranchesReportOutput: ReportWriter<DevPrdBranchReportData>
}

export class DevPrdBranchesReport extends RepoReport<DevPrdBranchReportData, DevPrdBranchReportWriters> {
  protected async runReport (repo: Repo): Promise<void> {
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
        errorHandler(error, this.name, repo.name, branchName)
      }
    }

    this._reportWriters.devPrdBranchesReportOutput.addRow({
      repoName: repo.name,
      hasDev,
      hasPrd,
      devDefault: repo.defaultBranch === 'dev'
    })
    repo.reportResults.followsDevPrdNamingScheme = hasDev && hasPrd && repo.defaultBranch === 'dev'
  }

  protected getReportWriters (): DevPrdBranchReportWriters {
    return {
      devPrdBranchesReportOutput: new ReportWriter<DevPrdBranchReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<DevPrdBranchReportData> {
    return {
      repoName: 'Repo',
      hasDev: 'Has a Dev Branch',
      hasPrd: 'Has a Prd Branch',
      devDefault: 'Dev Branch is Default'
    }
  }

  public get name (): string {
    return DevPrdBranchesReport.name
  }
}
