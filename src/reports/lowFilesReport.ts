import {
  GradeEnum,
  type RepoInfo,
  type ReportFunction
} from '../types'
import { errorHandler } from '../util'
import ReportDataWriter from '../util/reportDataWriter'

export const lowFilesReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const lowFileRepoWriter = new ReportDataWriter('./data/reports/LowFileCountInRepoReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'fileCount', title: 'FileCount' }])

  const lowFileBranchWriter = new ReportDataWriter('./data/reports/LowFileCountOnBranchReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'branchName', title: 'Branch' }, { id: 'fileCount', title: 'FileCount' }])

  for (const repo of repos) {
    repo.healthScores.lowFilesReportGrade = GradeEnum.A
    let someBranchHasFiles = false
    for (const branchName in repo.branches) {
      try {
        if (repo.branches[branchName].fileCount < 5 && !repo.branches[branchName].dependabot) {
          lowFileBranchWriter.data.push({
            repoName: repo.name,
            branchName,
            fileCount: repo.branches[branchName].fileCount
          })
        } else {
          someBranchHasFiles = true
        }
      } catch (error) {
        errorHandler(error, lowFilesReport.name, repo.name, branchName)
      }
    }
    if (!someBranchHasFiles && Object.keys(repo.branches).length !== 0) {
      repo.healthScores.lowFilesReportGrade = GradeEnum.F
      lowFileRepoWriter.data.push({
        repoName: repo.name,
        fileCount: repo.branches[repo.defaultBranch].fileCount
      })
    }
  }

  await lowFileBranchWriter.write()
  await lowFileRepoWriter.write()
}
