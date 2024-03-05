import type {
  Repo,
  SecretScanAlert
} from '../../../types'
import { HeaderTitles } from '../../../util'
import { AlertScanReport, AlertReportWriters } from './alertScanReport'
import { RepoReportData } from '../repoReport'

interface SecretAlertsReportData extends RepoReportData {
  repoName: string
  secretType: string
  createdAt: string
  locationPaths: string[]
  locationUrls: string[]
}

export class SecretScanAlertReport extends AlertScanReport<SecretAlertsReportData> {
  protected async runReport (repo: Repo, writers: AlertReportWriters<SecretAlertsReportData>): Promise<void> {
    writers.criticalAlertWriter.addRows(this.getData(repo.secretScanAlerts?.critical, repo.name))
  }

  protected getHeaderTitles (): HeaderTitles<SecretAlertsReportData> {
    return {
      repoName: 'Repo',
      createdAt: 'Created Date',
      secretType: 'Secret Type',
      locationUrls: 'Location URL',
      locationPaths: 'Location Paths'
    }
  }

  getData (alerts: SecretScanAlert[], repoName: string): SecretAlertsReportData[] {
    const rows: SecretAlertsReportData[] = []
    for (const alert of alerts) {
      rows.push({
        repoName,
        createdAt: alert.createdAt,
        secretType: alert.secretType,
        locationPaths: alert.locations.map(obj => obj.locationPath ?? ''),
        locationUrls: alert.locations.map(obj => obj.locationUrl)
      })
    }
    return rows
  }

  public get name (): string {
    return SecretScanAlertReport.name
  }
}
