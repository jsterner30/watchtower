import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import { errorHandler, extensionLanguageMap } from '../util'
import ReportDataWriter from '../util/reportDataWriter'

export const fileTypesReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const repoHasLanguageReportWriter = new ReportDataWriter('./data/reports/Languages/RepoHasLanguageReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'languages', title: 'Languages Found in Repo' }])

  const defaultBranchFileTypeReportWriter = new ReportDataWriter('./data/reports/DefaultBranchFileTypesReport.csv',
    [{ id: 'repoName', title: 'Repo' }, { id: 'percentageJson', title: 'Percentages' }])

  const fileExtensionMap = extensionLanguageMap()
  for (const repo of repos) {
    try {
      const repoLanguageList = new Set<string>()
      for (const branchName in repo.branches) {
        for (const extension in repo.branches[branchName].fileTypes) {
          if (fileExtensionMap[extension] != null) {
            repoLanguageList.add(fileExtensionMap[extension])
          }
        }

        if (repo.branches[branchName].defaultBranch) {
          let totalFiles = 0
          const percentageJson: Record<string, number> = {}
          for (const extension in repo.branches[branchName].fileTypes) {
            totalFiles += repo.branches[branchName].fileTypes[extension]
          }
          for (const extension in repo.branches[branchName].fileTypes) {
            percentageJson[extension] = repo.branches[branchName].fileTypes[extension] / totalFiles
          }

          defaultBranchFileTypeReportWriter.data.push({ repoName: repo, percentageJson })
        }
      }

      repoHasLanguageReportWriter.data.push({ repoName: repo, languages: Array.from(repoLanguageList) })
    } catch (error) {
      errorHandler(error, fileTypesReport.name, repo.name)
    }
  }

  await repoHasLanguageReportWriter.write()
  await defaultBranchFileTypeReportWriter.write()
}
