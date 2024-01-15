import {
  DependabotAlert, GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

interface DependabotAlertReportRow {
  repoName: string
  dependencyName: string
  dependencyEcosystem: string
  summary: string
  description: string
}

export class DependabotAlertReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const alertReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'dependencyName', title: 'Dependency Name' },
      { id: 'dependencyEcosystem', title: 'Dependency Ecosystem' },
      { id: 'summary', title: 'Summary' },
      { id: 'description', title: 'Description' }
    ]

    const criticalAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'DependabotAlertReport-Critical')
    const highAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'DependabotAlertReport-High')
    const mediumAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'DependabotAlertReport-Medium')
    const lowAlertWriter = new ReportOutputData(alertReportHeader, this._outputDir, 'DependabotAlertReport-Low.csv')

    for (const repo of repos) {
      try {
        criticalAlertWriter.addRows(this.getCsvData(repo.dependabotScanAlerts?.critical, repo.name))
        highAlertWriter.addRows(this.getCsvData(repo.dependabotScanAlerts?.high, repo.name))
        mediumAlertWriter.addRows(this.getCsvData(repo.dependabotScanAlerts?.medium, repo.name))
        lowAlertWriter.addRows(this.getCsvData(repo.dependabotScanAlerts?.low, repo.name))
      } catch (error) {
        errorHandler(error, DependabotAlertReport.name, repo.name)
      }
    }
    this._reportOutputs.push(criticalAlertWriter)
    this._reportOutputs.push(highAlertWriter)
    this._reportOutputs.push(mediumAlertWriter)
    this._reportOutputs.push(lowAlertWriter)
  }

  getCsvData (alerts: DependabotAlert[], repoName: string): DependabotAlertReportRow[] {
    const rows: DependabotAlertReportRow[] = []
    for (const alert of alerts) {
      rows.push({
        repoName,
        dependencyName: alert.dependencyName,
        dependencyEcosystem: alert.dependencyEcosystem,
        summary: alert.summary,
        description: alert.description
      })
    }
    return rows
  }

  grade (input: unknown): HealthScore {
    logger.error('The DependabotAlertReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
}
