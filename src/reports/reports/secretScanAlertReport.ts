import {
  GradeEnum, HealthScore,
  type RepoInfo,
  SecretScanAlert
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

interface SecretAlertsReportRow {
  repoName: string
  secretType: string
  secret: string
}

export class SecretScanAlertReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const alertReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'secretType', title: 'Secret Type' },
      { id: 'secret', title: 'Secret' }
    ]

    const secretAlertOutput = new ReportOutputData(alertReportHeader, this._outputDir, 'SecretAlertReport')

    for (const repo of repos) {
      try {
        secretAlertOutput.addRows(this.getCsvData(repo.secretScanAlerts?.critical, repo.name))
      } catch (error) {
        errorHandler(error, SecretScanAlertReport.name, repo.name)
      }
    }
    this._reportOutputs.push(secretAlertOutput)
  }

  grade (input: unknown): HealthScore {
    logger.error('The SecretScanAlertReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  getCsvData (alerts: SecretScanAlert[], repoName: string): SecretAlertsReportRow[] {
    const rows: SecretAlertsReportRow[] = []
    for (const alert of alerts) {
      rows.push({
        repoName,
        secretType: alert.secretType,
        secret: alert.secret
      })
    }
    return rows
  }

  public get name (): string {
    return SecretScanAlertReport.name
  }
}
