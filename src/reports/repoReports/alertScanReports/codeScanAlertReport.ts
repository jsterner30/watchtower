import {
  type CodeScanAlert,
  type Repo
} from '../../../types'
import { HeaderTitles } from '../../../util'
import { AlertScanReport, AlertReportWriters } from './alertScanReport'
import { RepoReportData } from '../repoReport'

interface CodeScanReportData extends RepoReportData {
  repoName: string
  id: string
  description: string
  locationPath: string
}

export class CodeScanAlertReport extends AlertScanReport<CodeScanReportData> {
  protected async runReport (repo: Repo, writers: AlertReportWriters<CodeScanReportData>): Promise<void> {
    if (repo.codeScanAlerts?.critical.length > 0) writers.criticalAlertWriter.addRows(this.getData(repo.codeScanAlerts?.critical, repo.name))
    if (repo.codeScanAlerts?.high.length > 0) writers.highAlertWriter.addRows(this.getData(repo.codeScanAlerts?.high, repo.name))
    if (repo.codeScanAlerts?.medium.length > 0) writers.mediumAlertWriter.addRows(this.getData(repo.codeScanAlerts?.medium, repo.name))
    if (repo.codeScanAlerts?.low.length > 0) writers.lowAlertWriter.addRows(this.getData(repo.codeScanAlerts?.low, repo.name))
  }

  protected getHeaderTitles (): HeaderTitles<CodeScanReportData> {
    return {
      repoName: 'Repo',
      id: 'ID',
      description: 'Description',
      locationPath: 'Location Path'
    }
  }

  protected getData (alerts: CodeScanAlert[], repoName: string): CodeScanReportData[] {
    const rows: CodeScanReportData[] = []
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

  public get name (): string {
    return CodeScanAlertReport.name
  }
}
