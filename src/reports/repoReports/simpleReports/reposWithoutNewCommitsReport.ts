import {
  type Repo,
  type Grade,
  GradeEnum, HealthScore
} from '../../../types'
import { Writers } from '../../report'
import { ReportWriter, HeaderTitles, date1970 } from '../../../util'
import { RepoReport, RepoReportData } from '../repoReport'

export interface ReposWithoutNewCommitsReportData extends RepoReportData {
  repoName: string
  lastCommitDate: string
  lastCommitUser: string
}

export interface ReposWithoutNewCommitsWriters extends Writers<ReposWithoutNewCommitsReportData> {
  reposWithoutNewCommitsWriter: ReportWriter<ReposWithoutNewCommitsReportData>
}

export class ReposWithoutNewCommitsReport extends RepoReport<ReposWithoutNewCommitsReportData, ReposWithoutNewCommitsWriters> {
  protected async runReport (repo: Repo, writers: ReposWithoutNewCommitsWriters): Promise<void> {
    const currentDate = new Date()
    const twoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 731)) // two years ago
    if (new Date(repo.lastCommit.date) < twoYearsAgo) {
      writers.reposWithoutNewCommitsWriter.addRow({
        repoName: repo.name,
        lastCommitDate: repo.lastCommit.date,
        lastCommitUser: repo.lastCommit.author
      })
    }

    repo.healthScores[ReposWithoutNewCommitsReport.name] = await this.grade(repo.lastCommit.date)
  }

  protected getReportWriters (): ReposWithoutNewCommitsWriters {
    return {
      reposWithoutNewCommitsWriter: new ReportWriter(this.getHeaderTitles(), this._outputDir, this.name)
    }
  }

  protected getHeaderTitles (): HeaderTitles<ReposWithoutNewCommitsReportData> {
    return {
      repoName: 'Repo',
      lastCommitDate: 'Last Commit Date',
      lastCommitUser: 'Last Commit User'
    }
  }

  async grade (input: string): Promise<HealthScore> {
    const currentDate = new Date()
    const dateThirtyDaysAgo = new Date(new Date().setDate(currentDate.getDate() - 30)).toISOString()
    const dateSixMonthsAgo = new Date(new Date().setDate(currentDate.getDate() - 180)).toISOString()
    const dateOneYearAgo = new Date(new Date().setDate(currentDate.getDate() - 365)).toISOString()
    const dateTwoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 730)).toISOString()

    const gradeMinValues: Record<string, Grade> = {
      [dateThirtyDaysAgo]: GradeEnum.A,
      [dateSixMonthsAgo]: GradeEnum.B,
      [dateOneYearAgo]: GradeEnum.C,
      [dateTwoYearsAgo]: GradeEnum.D,
      [date1970]: GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (input > minValue) {
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

  public get name (): string {
    return ReposWithoutNewCommitsReport.name
  }
}
