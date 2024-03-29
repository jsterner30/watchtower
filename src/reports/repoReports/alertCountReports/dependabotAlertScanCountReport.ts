import type {
  Repo
} from '../../../types'
import { AlertCountReport } from './alertCountReports'

export class DependabotAlertScanCountReport extends AlertCountReport {
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.criticalCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.critical.length })
    this._reportWriters.highCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.high.length })
    this._reportWriters.mediumCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.medium.length })
    this._reportWriters.lowCountWriter.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.low.length })

    repo.healthScores[DependabotAlertScanCountReport.name] = await this.grade(repo.dependabotScanAlerts)
  }

  public get name (): string {
    return DependabotAlertScanCountReport.name
  }
}
