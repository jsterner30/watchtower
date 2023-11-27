import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'

export const publicAndInternalReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'visibility', title: 'Visibility' }
  ]

  const publicAndInternalWriter = new ReportDataWriter('./src/data/reports/PublicAndInternalReport.csv', header)

  for (const repo of repos) {
    if (repo.visibility !== 'private') {
      publicAndInternalWriter.data.push({
        repoName: repo.name,
        visibility: repo.visibility
      })
    }
  }

  await publicAndInternalWriter.write()
}
