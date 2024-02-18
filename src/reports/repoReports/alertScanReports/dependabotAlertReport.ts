import {
  type DependabotAlert,
  type Repo
} from '../../../types'
import { HeaderTitles } from '../../../util'
import { AlertScanReport, AlertReportWriters } from './alertScanReport'
import { RepoReportData } from '../repoReport'

interface DependabotAlertReportData extends RepoReportData {
  repoName: string
  dependencyName: string
  dependencyEcosystem: string
  summary: string
  description: string
}

export class DependabotAlertReport extends AlertScanReport<DependabotAlertReportData> {
  protected async runReport (repo: Repo, writers: AlertReportWriters<DependabotAlertReportData>): Promise<void> {
    writers.criticalAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.critical, repo.name))
    writers.highAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.high, repo.name))
    writers.mediumAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.medium, repo.name))
    writers.lowAlertWriter.addRows(this.getData(repo.dependabotScanAlerts?.low, repo.name))
  }

  protected getHeaderTitles (): HeaderTitles<DependabotAlertReportData> {
    return {
      repoName: 'Repo',
      dependencyName: 'Dependency me',
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
