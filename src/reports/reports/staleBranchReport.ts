import {
  Grade, GradeEnum, HealthScore,
  type RepoInfo
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class StaleBranchReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const header = [
      { id: 'repoName', title: 'Repo' },
      { id: 'count', title: 'Count' }
    ]

    const staleBranchReportOutput = new ReportOutputData(header, this._outputDir, 'StaleBranchReport')

    for (const repo of repos) {
      try {
        let count = 0
        for (const branchName in repo.branches) {
          if (repo.branches[branchName].staleBranch) {
            count++
          }
        }

        staleBranchReportOutput.addRow({
          repoName: repo.name,
          count
        })
        repo.healthScores[StaleBranchReport.name] = this.grade(count)
      } catch (error) {
        errorHandler(error, StaleBranchReport.name, repo.name)
      }
    }

    this._reportOutputs.push(staleBranchReportOutput)
  }

  grade (input: number): HealthScore {
    const gradeMinValues: Record<number, Grade> = {
      5: GradeEnum.A,
      10: GradeEnum.B,
      15: GradeEnum.C,
      20: GradeEnum.D,
      [Number.MAX_SAFE_INTEGER]: GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (input < parseInt(minValue)) {
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
