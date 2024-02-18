import {
  type HealthScore,
  type Repo,
  ScanAlertBySeverityLevel,
  type Grade,
  GradeEnum
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

export interface AlertCountReportData extends RepoReportData {
  repoName: string
  count: number
}

export interface AlertCountReportWriters extends Writers<AlertCountReportData> {
  criticalCountWriter: ReportWriter<AlertCountReportData>
  highCountWriter: ReportWriter<AlertCountReportData>
  mediumCountWriter: ReportWriter<AlertCountReportData>
  lowCountWriter: ReportWriter<AlertCountReportData>
}

export abstract class AlertCountReport extends RepoReport<AlertCountReportData, AlertCountReportWriters> {
  protected abstract runReport (repo: Repo, writers: AlertCountReportWriters): Promise<void>

  protected async grade (input: ScanAlertBySeverityLevel): Promise<HealthScore> {
    const criticalScore: number = input.critical.length * 4
    const highScore: number = input.high.length * 3
    const mediumScore: number = input.medium.length * 2
    const lowScore: number = input.low.length
    const totalScore = criticalScore + highScore + mediumScore + lowScore

    const gradeMinValues: Record<number, Grade> = {
      3: GradeEnum.A,
      6: GradeEnum.B,
      9: GradeEnum.C,
      12: GradeEnum.D,
      [Number.MAX_SAFE_INTEGER]: GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (totalScore < parseInt(minValue)) {
        return {
          grade: gradeMinValues[minValue],
          weight: this._weight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  protected getHeaderTitles (): HeaderTitles<AlertCountReportData> {
    return {
      repoName: 'Repo',
      count: 'Count'
    }
  }

  protected getReportWriters (): AlertCountReportWriters {
    const countReportHeaders = this.getHeaderTitles()
    return {
      criticalCountWriter: new ReportWriter<AlertCountReportData>(countReportHeaders, this._outputDir, `${this.name}-Critical`),
      highCountWriter: new ReportWriter<AlertCountReportData>(countReportHeaders, this._outputDir, `${this.name}-High`),
      mediumCountWriter: new ReportWriter<AlertCountReportData>(countReportHeaders, this._outputDir, `${this.name}-Medium`),
      lowCountWriter: new ReportWriter<AlertCountReportData>(countReportHeaders, this._outputDir, `${this.name}-Low`)
    }
  }

  abstract get name (): string
}
