import {
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const reposWithoutNewCommitsReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'lastCommitDate', title: 'Last Commit Date' },
    { id: 'lastCommitUser', title: 'Last Commit User' }
  ]

  const oldRepoWriter = new ReportDataWriter('./data/reports/ReposWithoutNewCommits.csv', header)

  for (const repo of repos) {
    try {
      const currentDate = new Date()
      const twoYearsAgo = new Date(new Date().setDate(currentDate.getDate() - 731)) // two years ago
      if (new Date(repo.lastCommit.date) < twoYearsAgo) {
        oldRepoWriter.data.push({
          repoName: repo.name,
          lastCommitDate: repo.lastCommit.date,
          lastCommitUser: repo.lastCommit.author
        })
      }
    } catch (error) {
      errorHandler(error, reposWithoutNewCommitsReport.name, repo.name)
    }
  }

  await oldRepoWriter.write()
}
