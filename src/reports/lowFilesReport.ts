import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import { logger } from '../util/logger'
import ReportDataWriter from '../util/reportDataWriter'

export const lowFilesReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const lowFileRepoWriter = new ReportDataWriter('./src/data/reports/LowFileCountInRepoReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'fileCount', title: 'FileCount' }])

  const lowFileBranchWriter = new ReportDataWriter('./src/data/reports/LowFileCountOnBranchReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'branchName', title: 'Branch' }, { id: 'fileCount', title: 'FileCount' }])

  for (const repo of repos) {
    try {
      let someBranchHasFiles = false
      for (const branchName in repo.branches) {
        if (repo.branches[branchName].fileCount < 5 && !repo.branches[branchName].dependabot) {
          lowFileBranchWriter.data.push({
            repoName: repo.name,
            branchName,
            fileCount: repo.branches[branchName].fileCount
          })
        } else {
          someBranchHasFiles = true
        }
      }
      if (!someBranchHasFiles && Object.keys(repo.branches).length !== 0) {
        lowFileRepoWriter.data.push({
          repoName: repo.name,
          fileCount: repo.branches[repo.defaultBranch].fileCount
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error getting filecount report for repo: ${repo.name}, error: ${error.message}`)
      } else {
        logger.error(`Error getting filecount report for repo: ${repo.name}, error: ${error as string}`)
      }
    }
  }

  await lowFileBranchWriter.write()
  await lowFileRepoWriter.write()
}
