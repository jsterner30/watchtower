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

    const defaultBranchFileTypeReportOutput = new ReportOutputData([{ id: 'repoName', title: 'Repo' }, { id: 'percentageJson', title: 'Percentages' }],
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
            let totalFiles = 0
            const percentageJson: Record<string, number> = {}
            for (const extension in repo.branches[branchName].fileTypes) {
              totalFiles += repo.branches[branchName].fileTypes[extension]
            }
            for (const extension in repo.branches[branchName].fileTypes) {
              percentageJson[extension] = repo.branches[branchName].fileTypes[extension] / totalFiles
            }

            defaultBranchFileTypeReportOutput.addRow({ repoName: repo, percentageJson })
          }
        }

        repoHasLanguageReportOutput.addRow({ repoName: repo, languages: Array.from(repoLanguageList) })
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
}
