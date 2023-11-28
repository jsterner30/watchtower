import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const teamlessRepoReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [{ id: 'repoName', title: 'Repo' }]
  const teamlessReportWriter = new ReportDataWriter('./data/reports/TeamlessRepoReport.csv', header)

  for (const repo of repos) {
    try {
      if (repo.teams.length === 0) {
        teamlessReportWriter.data.push({
          repoName: repo.name
        })
      }
    } catch (error) {
      errorHandler(error, teamlessRepoReport.name, repo.name)
    }
  }
  await teamlessReportWriter.write()
}
