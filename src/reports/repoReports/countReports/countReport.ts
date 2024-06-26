import {
  Grade, GradeEnum, HealthScore,
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

export interface CountReportData extends RepoReportData {
  repoName: string
  count: number
}

export interface CountReportWriters extends Writers<CountReportData> {
  countReportWriter: ReportWriter<CountReportData>
}

export abstract class CountReport extends RepoReport<CountReportData, CountReportWriters> {
  protected async grade (input: number): Promise<HealthScore> {
    const gradeMinValues: Record<number, Grade> = {
      5: GradeEnum.A,
      10: GradeEnum.B,
      15: GradeEnum.C,
      20: GradeEnum.D,
      [Number.MAX_SAFE_INTEGER]: GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (input < parseInt(minValue)) {
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

  protected initReportWriters (): CountReportWriters {
    return {
      countReportWriter: new ReportWriter<CountReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected getHeaderTitles (): HeaderTitles<CountReportData> {
    return {
      repoName: 'Repo',
      count: 'Count'
    }
  }

  abstract get name (): string
  protected abstract runReport (repo: Repo): Promise<void>
}
