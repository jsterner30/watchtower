import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const languageReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'language', title: 'Language' }
  ]
  const languageReportWriter = new ReportDataWriter('./data/reports/LanguageReport.csv', header)

  for (const repo of repos) {
    try {
      languageReportWriter.data.push({
        repoName: repo.name,
        language: repo.language
      })
    } catch (error) {
      errorHandler(error, languageReport.name, repo.name)
    }
  }

  await languageReportWriter.write()
}
