import {
  CodeScanAlert, GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

interface ScanAlertReportRow {
  repoName: string
  id: string
  description: string
  locationPath: string
}

export class CodeScanAlertReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const alertReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'id', title: 'ID' },
      { id: 'description', title: 'Description' },
      { id: 'locationPath', title: 'Location Path' }
    ]

    const criticalAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'CodeScanAlertReport-Critical')
    const highAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'CodeScanAlertReport-High')
    const mediumAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'CodeScanAlertReport-Medium')
    const lowAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'CodeScanAlertReport-Low')

    for (const repo of repos) {
      try {
        if (repo.codeScanAlerts?.critical.length > 0) criticalAlertWriter.addRows(this.getCsvData(repo.codeScanAlerts?.critical, repo.name))
        if (repo.codeScanAlerts?.high.length > 0) highAlertWriter.addRows(this.getCsvData(repo.codeScanAlerts?.high, repo.name))
        if (repo.codeScanAlerts?.medium.length > 0) mediumAlertWriter.addRows(this.getCsvData(repo.codeScanAlerts?.medium, repo.name))
        if (repo.codeScanAlerts?.low.length > 0) lowAlertWriter.addRows(this.getCsvData(repo.codeScanAlerts?.low, repo.name))
      } catch (error) {
        errorHandler(error, CodeScanAlertReport.name, repo.name)
      }
    }
    this._reportOutputs.push(criticalAlertWriter)
    this._reportOutputs.push(highAlertWriter)
    this._reportOutputs.push(mediumAlertWriter)
    this._reportOutputs.push(lowAlertWriter)
  }

  private getCsvData (alerts: CodeScanAlert[], repoName: string): ScanAlertReportRow[] {
    const rows: ScanAlertReportRow[] = []
    for (const alert of alerts) {
      rows.push({
        repoName,
        id: alert.rule.id,
        description: alert.rule.description,
        locationPath: alert.mostRecentInstance.locationPath
      })
    }
    return rows
  }

  grade (input: unknown): HealthScore {
    logger.error('The CodeScanAlertReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public get name (): string {
    return CodeScanAlertReport.name
  }
}
