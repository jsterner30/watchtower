import {
  type RepoInfo,
  type ReportFunction,
  type Grade,
  GradeEnum, HealthScore
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'
import { oldCommitReportGradeWeight, reposWithoutNewCommitsReportGradeName } from '../util/constants'

const oldCommitReportGrade = (input: string): HealthScore => {
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
        weight: oldCommitReportGradeWeight
      }
    }
  }
  return {
    grade: GradeEnum.NotApplicable,
    weight: 0
  }
}

export const reposWithoutNewCommitsReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'lastCommitDate', title: 'Last Commit Date' },
    { id: 'lastCommitUser', title: 'Last Commit User' }
  ]

  const oldRepoWriter = new ReportDataWriter('./data/reports/ReposWithoutNewCommits.csv', header)

  for (const repo of repos) {
    try {
      const currentDate = new Date()
      const twoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 731)) // two years ago
      if (new Date(repo.lastCommit.date) < twoYearsAgo) {
        oldRepoWriter.data.push({
          repoName: repo.name,
          lastCommitDate: repo.lastCommit.date,
          lastCommitUser: repo.lastCommit.author
        })
      }

      repo.healthScores[reposWithoutNewCommitsReportGradeName] = oldCommitReportGrade(repo.lastCommit.date)
    } catch (error) {
      errorHandler(error, reposWithoutNewCommitsReport.name, repo.name)
    }
  }

  await oldRepoWriter.write()
}
