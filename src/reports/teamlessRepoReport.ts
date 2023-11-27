import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'

export const teamlessRepoReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [{ id: 'repoName', title: 'Repo' }]
  const teamlessReportWriter = new ReportDataWriter('./src/data/reports/TeamlessRepoReport.csv', header)

  for (const repo of repos) {
    if (repo.teams.length === 0) {
      teamlessReportWriter.data.push({
        repoName: repo.name
      })
    }
  }
  await teamlessReportWriter.write()
}
