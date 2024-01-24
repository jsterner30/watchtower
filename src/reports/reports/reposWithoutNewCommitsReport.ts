import {
  type RepoInfo,
  type Grade,
  GradeEnum, HealthScore
} from '../../types'
import { Report } from '../report'
import { ReportOutputData, errorHandler } from '../../util'

export class ReposWithoutNewCommitsReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'lastCommitDate', title: 'Last Commit Date' },
      { id: 'lastCommitUser', title: 'Last Commit User' }
    ]

    const oldRepoOutput = new ReportOutputData(header, this._outputDir, 'ReposWithoutNewCommits')

    for (const repo of repos) {
      try {
        const currentDate = new Date()
        const twoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 731)) // two years ago
        if (new Date(repo.lastCommit.date) < twoYearsAgo) {
          oldRepoOutput.addRow({
            repoName: repo.name,
            lastCommitDate: repo.lastCommit.date,
            lastCommitUser: repo.lastCommit.author
          })
        }

        repo.healthScores[ReposWithoutNewCommitsReport.name] = this.grade(repo.lastCommit.date)
      } catch (error) {
        errorHandler(error, ReposWithoutNewCommitsReport.name, repo.name)
      }
    }
    this._reportOutputs.push(oldRepoOutput)
  }

  grade (input: string): HealthScore {
    const currentDate = new Date()
    const dateThirtyDaysAgo = new Date(new Date().setDate(currentDate.getDate() - 30)).toISOString()
    const dateSixMonthsAgo = new Date(new Date().setDate(currentDate.getDate() - 180)).toISOString()
    const dateOneYearAgo = new Date(new Date().setDate(currentDate.getDate() - 365)).toISOString()
    const dateTwoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 730)).toISOString()
    const date1970 = '1970-01-01T00:00:00.000Z'

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
