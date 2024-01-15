import {
  GradeEnum,
  HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'
import { logger } from '../../util/logger'

export class LanguageReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'language', title: 'Language' }
    ]
    const languageReportOutput = new ReportOutputData(header, this._outputDir, 'PrimaryLanguageReport')

    for (const repo of repos) {
      try {
        languageReportOutput.addRow({
          repoName: repo.name,
          language: repo.language
        })
      } catch (error) {
        errorHandler(error, LanguageReport.name, repo.name)
      }
    }
    this._reportOutputs.push(languageReportOutput)
  }

  grade (input: unknown): HealthScore {
    logger.error('The LanguageReport does not implement the grade method because this report does not contribute to the overall health report')
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
}
