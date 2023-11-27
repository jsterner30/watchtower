import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'

export const dependabotBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]
  const dependabotReportWriter = new ReportDataWriter('./src/data/reports/DependabotBranchReport.csv', header)

  for (const repo of repos) {
    let count = 0
    for (const branchName in repo.branches) {
      if (repo.branches[branchName].dependabot) {
        count++
      }
    }

    dependabotReportWriter.data.push({
      repoName: repo.name,
      count
    })
  }

  await dependabotReportWriter.write()
}
