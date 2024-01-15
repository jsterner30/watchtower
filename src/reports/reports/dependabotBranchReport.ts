import {
  Grade, GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class DependabotBranchReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'count', title: 'Count' }
    ]
    const dependabotReportOutput = new ReportOutputData(header, this._outputDir, 'DependabotBranchReport')

    for (const repo of repos) {
      let count = 0
      for (const branchName in repo.branches) {
        try {
          if (repo.branches[branchName].dependabot) {
            count++
          }
        } catch (error) {
          errorHandler(error, DependabotBranchReport.name, repo.name, branchName)
        }
      }

      dependabotReportOutput.addRow({
        repoName: repo.name,
        count
      })

      repo.healthScores[DependabotBranchReport.name] = this.grade(count.toString())
    }

    this.reportOutputs.push(dependabotReportOutput)
  }

  grade (input: string): HealthScore {
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
          weight: this._weight
        }
      }
    }
    return {
      grade: GradeEnum.NotApplicable,
      weight: 0
    }
  }
}
