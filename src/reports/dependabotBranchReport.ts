import {
  Grade, GradeEnum,
  type RepoInfo,
  type ReportFunction, ReportGradeFunction
} from '../types'
import ReportDataWriter from '../util/reportDataWriter'
import { errorHandler } from '../util'

export const dependabotReportGrade: ReportGradeFunction = (input: string): Grade => {
  const gradeMinValues: Record<number, Grade> = {
    5: GradeEnum.A,
    10: GradeEnum.B,
    15: GradeEnum.C,
    20: GradeEnum.D,
    [Number.MAX_SAFE_INTEGER]: GradeEnum.F
  }

  for (const minValue in gradeMinValues) {
    if (parseInt(input) < parseInt(minValue)) {
      return gradeMinValues[minValue]
    }
  }
  return GradeEnum.NotApplicable
}

export const dependabotBranchReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const header = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]
  const dependabotReportWriter = new ReportDataWriter('./data/reports/DependabotBranchReport.csv', header)

  for (const repo of repos) {
    let count = 0
    for (const branchName in repo.branches) {
      try {
        if (repo.branches[branchName].dependabot) {
          count++
        }
      } catch (error) {
        errorHandler(error, dependabotBranchReport.name, repo.name, branchName)
      }
    }

    dependabotReportWriter.data.push({
      repoName: repo.name,
      count
    })

    repo.healthScores.dependabotBranchReportGrade = dependabotReportGrade(count.toString())
  }

  await dependabotReportWriter.write()
}
