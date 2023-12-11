import {
  Grade, GradeEnum, HealthScore,
  type RepoInfo,
  type ReportFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'
import { staleBranchReportGradeName, staleBranchReportGradeWeight } from '../util/constants'

const staleBranchReportGrade = (input: string): HealthScore => {
  const gradeMinValues: Record<number, Grade> = {
    5: GradeEnum.A,
    10: GradeEnum.B,
    15: GradeEnum.C,
    20: GradeEnum.D,
    [Number.MAX_SAFE_INTEGER]: GradeEnum.F
  }

  for (const minValue in gradeMinValues) {
    if (parseInt(input) < parseInt(minValue)) {
      return {
        grade: gradeMinValues[minValue],
        weight: staleBranchReportGradeWeight
      }
    }
  }
  return {
    grade: GradeEnum.NotApplicable,
    weight: 0
  }
}

export const staleBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const dependabotWriter = new ReportDataWriter('./data/reports/StaleBranchReport.csv', header)

  for (const repo of repos) {
    try {
      let count = 0
      for (const branchName in repo.branches) {
        if (repo.branches[branchName].staleBranch) {
          count++
        }
      }

      dependabotWriter.data.push({
        repoName: repo.name,
        count
      })
      repo.healthScores[staleBranchReportGradeName] = staleBranchReportGrade(count.toString())
    } catch (error) {
      errorHandler(error, staleBranchReport.name, repo.name)
    }
  }

  await dependabotWriter.write()
}
