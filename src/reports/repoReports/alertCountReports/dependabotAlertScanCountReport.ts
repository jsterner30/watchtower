import type {
  Repo
} from '../../../types'
import { AlertCountReport, AlertCountReportWriters } from './alertCountReports'

export class DependabotAlertScanCountReport extends AlertCountReport {
  protected async runReport (repo: Repo, writers: AlertCountReportWriters): Promise<void> {
    writers.criticalCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.critical.length })
    writers.highCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.high.length })
    writers.mediumCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.medium.length })
    writers.lowCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.low.length })

    repo.healthScores[DependabotAlertScanCountReport.name] = await this.grade(repo.dependabotScanAlerts)
  }

  public get name (): string {
    return DependabotAlertScanCountReport.name
  }
}
