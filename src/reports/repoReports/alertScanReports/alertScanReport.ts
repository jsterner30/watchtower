import {
  type Repo,
  type ScanAlert
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

export interface AlertReportWriters<T extends RepoReportData> extends Writers<T> {
  criticalAlertWriter: ReportWriter<T>
  highAlertWriter: ReportWriter<T>
  mediumAlertWriter: ReportWriter<T>
  lowAlertWriter: ReportWriter<T>
}

export abstract class AlertScanReport<T extends RepoReportData> extends RepoReport<T, AlertReportWriters<T>> {
  protected getReportWriters (): AlertReportWriters<T> {
    const alertReportHeader = this.getHeaderTitles()
    return {
      criticalAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Critical`),
      highAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-High`),
      mediumAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Medium`),
      lowAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Low`)
    }
  }

  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract runReport (repo: Repo, writers: AlertReportWriters<T>): Promise<void>
  protected abstract getData (alerts: ScanAlert[], repoName: string): T[]
  public abstract get name (): string
}
