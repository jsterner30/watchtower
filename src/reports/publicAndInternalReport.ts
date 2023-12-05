import {
  GradeEnum,
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'
import {publicAndInternalReportGradeName, publicAndInternalReportGradeWeight} from '../util/constants'

export const publicAndInternalReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'visibility', title: 'Visibility' }
  ]

  const publicAndInternalWriter = new ReportDataWriter('./data/reports/PublicAndInternalReport.csv', header)

  for (const repo of repos) {
    try {
      repo.healthScores[publicAndInternalReportGradeName] = {
        grade: GradeEnum.A,
        weight: publicAndInternalReportGradeWeight
      }
      if (repo.visibility !== 'private') {
        publicAndInternalWriter.data.push({
          repoName: repo.name,
          visibility: repo.visibility
        })
        if (repo.visibility === 'internal') {
          repo.healthScores[publicAndInternalReportGradeName] = {
            grade: GradeEnum.C,
            weight: publicAndInternalReportGradeWeight
          }
        } else {
          repo.healthScores[publicAndInternalReportGradeName] = {
            grade: GradeEnum.F,
            weight: publicAndInternalReportGradeWeight
          }
        }
      }
    } catch (error) {
      errorHandler(error, publicAndInternalReport.name, repo.name)
    }
  }

  await publicAndInternalWriter.write()
}
