import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const devPrdBranchesReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'hasDev', title: 'Has a Dev Branch' },
    { id: 'hasPrd', title: 'Has a Prd Branch' },
    { id: 'devDefault', title: 'Dev Branch is Default' }
  ]
  const devPrdBranchesReportWriter = new ReportDataWriter('./data/reports/devPrdBranchReport.csv', header)

  for (const repo of repos) {
    let hasDev = false
    let hasPrd = false
    for (const branchName in repo.branches) {
      try {
        if (branchName === 'dev') {
          hasDev = true
        } else if (branchName === 'prd') {
          hasPrd = true
        }
      } catch (error) {
        errorHandler(error, devPrdBranchesReport.name, repo.name, branchName)
      }
    }

    devPrdBranchesReportWriter.data.push({
      repoName: repo.name,
      hasDev,
      hasPrd,
      devDefault: repo.defaultBranch === 'dev'
    })
  }

  await devPrdBranchesReportWriter.write()
}
