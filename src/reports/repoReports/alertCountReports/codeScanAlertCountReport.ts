import type {
  Repo
} from '../../../types'
import { AlertCountReport } from './alertCountReports'

export class CodeScanAlertCountReport extends AlertCountReport {
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.criticalCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.critical.length })
    this._reportWriters.highCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.high.length })
    this._reportWriters.mediumCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.medium.length })
    this._reportWriters.lowCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.low.length })

    repo.healthScores[this.name] = await this.grade(repo.codeScanAlerts)
  }

  public get name (): string {
    return CodeScanAlertCountReport.name
  }
}
