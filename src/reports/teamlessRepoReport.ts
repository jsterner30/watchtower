import {
  type RepoInfo,
  type ReportFunction,
  GradeEnum
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'
import { teamlessRepoReportGradeName, teamlessRepoReportGradeWeight } from '../util/constants'

export const teamlessRepoReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [{ id: 'repoName', title: 'Repo' }]
  const teamlessReportWriter = new ReportDataWriter('./data/reports/TeamlessRepoReport.csv', header)

  for (const repo of repos) {
    try {
      repo.healthScores[teamlessRepoReportGradeName] = {
        grade: GradeEnum.A,
        weight: teamlessRepoReportGradeWeight
      }
      if (repo.teams.length === 0) {
        teamlessReportWriter.data.push({
          repoName: repo.name
        })
        repo.healthScores[teamlessRepoReportGradeName] = {
          grade: GradeEnum.F,
          weight: teamlessRepoReportGradeWeight
        }
      }
    } catch (error) {
      errorHandler(error, teamlessRepoReport.name, repo.name)
    }
  }
  await teamlessReportWriter.write()
}
