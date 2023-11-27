import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const dependabotBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]
  const dependabotReportWriter = new ReportDataWriter('./src/data/reports/DependabotBranchReport.csv', header)

  for (const repo of repos) {
    let count = 0
    for (const branchName in repo.branches) {
      try {
        if (repo.branches[branchName].dependabot) {
          count++
        }
      } catch (error) {
        errorHandler(error, dependabotBranchReport.name, repo.name, branchName)
      }
    }

    dependabotReportWriter.data.push({
      repoName: repo.name,
      count
    })
  }

  await dependabotReportWriter.write()
}
