import {
  type DependabotAlert,
  type Repo
} from '../../../types'
import { HeaderTitles } from '../../../util'
import { AlertScanReport } from './alertScanReport'
import { RepoReportData } from '../repoReport'

interface DependabotAlertReportData extends RepoReportData {
  repoName: string
  dependencyName: string
  dependencyEcosystem: string
  summary: string
  createdAt: string
  description: string
}

export class DependabotAlertReport extends AlertScanReport<DependabotAlertReportData> {
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.criticalAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.critical, repo.name))
    this._reportWriters.highAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.high, repo.name))
    this._reportWriters.mediumAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.medium, repo.name))
    this._reportWriters.lowAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.low, repo.name))
  }

  protected getHeaderTitles (): HeaderTitles<DependabotAlertReportData> {
    return {
      repoName: 'Repo',
      createdAt: 'Created Date',
      dependencyName: 'Dependency Name',
      dependencyEcosystem: 'Dependency Ecosystem',
      summary: 'Summary',
      description: 'Description'
    }
  }

  protected getData (alerts: DependabotAlert[], repoName: string): DependabotAlertReportData[] {
    const rows: DependabotAlertReportData[] = []
    for (const alert of alerts) {
      rows.push({
        repoName,
        createdAt: alert.createdAt,
        dependencyName: alert.dependencyName,
        dependencyEcosystem: alert.dependencyEcosystem,
        summary: alert.summary,
        description: alert.description
      })
    }
    return rows
  }

  public get name (): string {
    return DependabotAlertReport.name
  }
}
