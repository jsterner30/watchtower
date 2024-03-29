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
      criticalAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Critical`, this.getExceptions()),
      highAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-High`, this.getExceptions()),
      mediumAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Medium`, this.getExceptions()),
      lowAlertWriter: new ReportWriter<T>(alertReportHeader, this._outputDir, `${this.name}-Low`, this.getExceptions())
    }
  }

  protected abstract getHeaderTitles (): HeaderTitles<T>
  protected abstract runReport (repo: Repo): Promise<void>
  protected abstract getData (alerts: ScanAlert[], repoName: string): T[]
  public abstract get name (): string
}
