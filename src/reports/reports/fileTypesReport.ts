import {
  GradeEnum,
  HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, extensionLanguageMap, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class FileTypesReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const repoHasLanguageReportOutput = new ReportOutputData([{ id: 'repoName', title: 'Repo' }, { id: 'languages', title: 'Languages Found in Repo' }],
      this._outputDir, 'RepoHasLanguageReport'
    )

    const defaultBranchFileTypeReportOutput = new ReportOutputData([{ id: 'repoName', title: 'Repo' }, { id: 'percentageList', title: 'Percentages' }],
      this._outputDir, 'DefaultBranchFileTypesReport')

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
            const fileTypes = repo.branches[branchName].fileTypes

            // Calculate total files
            const totalFiles = Object.values(fileTypes).reduce((acc, count) => acc + count, 0)

            // Create CSV-formatted string from percentage JSON
            const csvString = Object.entries(fileTypes)
              .map(([extension, count]) => `${extension}:${count / totalFiles}`)
              .join(',')

            // Create a report row
            defaultBranchFileTypeReportOutput.addRow({
              repoName: repo.name,
              percentageList: csvString
            })
          }
        }

        repoHasLanguageReportOutput.addRow({ repoName: repo.name, languages: Array.from(repoLanguageList) })
      } catch (error) {
        errorHandler(error, FileTypesReport.name, repo.name)
      }
    }
    this._reportOutputs.push(repoHasLanguageReportOutput)
    this._reportOutputs.push(defaultBranchFileTypeReportOutput)
  }

  grade (input: unknown): HealthScore {
    logger.error('The FileTypesReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }

  public get name (): string {
    return FileTypesReport.name
  }
}
