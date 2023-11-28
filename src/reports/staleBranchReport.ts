import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const staleBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const dependabotWriter = new ReportDataWriter('./data/reports/StaleBranchReport.csv', header)

  for (const repo of repos) {
    try {
      let count = 0
      for (const branchName in repo.branches) {
        if (repo.branches[branchName].staleBranch) {
          count++
        }
      }

      dependabotWriter.data.push({
        repoName: repo.name,
        count
      })
    } catch (error) {
      errorHandler(error, staleBranchReport.name, repo.name)
    }
  }

  await dependabotWriter.write()
}
