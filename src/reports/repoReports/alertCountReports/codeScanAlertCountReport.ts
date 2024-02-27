import type {
  Repo
} from '../../../types'
import { AlertCountReport, AlertCountReportWriters } from './alertCountReports'

export class CodeScanAlertCountReport extends AlertCountReport {
  protected async runReport (repo: Repo, writers: AlertCountReportWriters): Promise<void> {
    writers.criticalCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.critical.length })
    writers.highCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.high.length })
    writers.mediumCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.medium.length })
    writers.lowCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.low.length })

    repo.healthScores[this.name] = await this.grade(repo.codeScanAlerts)
  }

  public get name (): string {
    return CodeScanAlertCountReport.name
  }
}
