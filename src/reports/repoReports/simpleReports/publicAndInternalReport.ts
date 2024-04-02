import {
  GradeEnum, HealthScore,
  type Repo
} from '../../../types'
import { HeaderTitles, ReportWriter } from '../../../util'
import { Writers } from '../../report'
import { RepoReport, RepoReportData } from '../repoReport'

interface PublicAndInternalReportData extends RepoReportData {
  repoName: string
  visibility: string
}

interface PublicAndInternalReportWriters extends Writers<PublicAndInternalReportData> {
  publicAndInternalWriter: ReportWriter<PublicAndInternalReportData>
}

export class PublicAndInternalReport extends RepoReport<PublicAndInternalReportData, PublicAndInternalReportWriters> {
  protected async runReport (repo: Repo): Promise<void> {
    if (repo.visibility !== 'private') {
      this._reportWriters.publicAndInternalWriter.addRow({
        repoName: repo.name,
        visibility: repo.visibility
      })
    }
    repo.healthScores[PublicAndInternalReport.name] = await this.grade(repo.visibility)
  }

  protected getHeaderTitles (): HeaderTitles<PublicAndInternalReportData> {
    return {
      repoName: 'Repo',
      visibility: 'Visibility'
    }
  }

  protected initReportWriters (): PublicAndInternalReportWriters {
    return {
      publicAndInternalWriter: new ReportWriter<PublicAndInternalReportData>(this.getHeaderTitles(), this._outputDir, this.name, this.getExceptions())
    }
  }

  protected async grade (input: string): Promise<HealthScore> {
    if (input === 'private') {
      return {
        grade: GradeEnum.A,
        weight: this._weight
      }
    } else if (input === 'internal') {
      return {
        grade: GradeEnum.C,
        weight: this._weight
      }
    } else {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }
  }

  public get name (): string {
    return PublicAndInternalReport.name
  }
}
