import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'

export const staleBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const dependabotWriter = new ReportDataWriter('./src/data/reports/StaleBranchReport.csv', header)

  for (const repo of repos) {
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
  }

  await dependabotWriter.write()
}
