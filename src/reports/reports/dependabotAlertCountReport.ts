import {
  Grade,
  GradeEnum, HealthScore,
  type RepoInfo,
  type DependabotScanAlertBySeverityLevel
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class DependabotAlertCountReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const countReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'count', title: 'Count' }
    ]

    const criticalAlertCountOutput = new ReportOutputData(countReportHeader, this._outputDir, 'DependabotAlertCountReport-Critical')
    const highAlertCountOutput = new ReportOutputData(countReportHeader, this._outputDir, 'DependabotAlertCountReport-High')
    const mediumAlertCountOutput = new ReportOutputData(countReportHeader, this._outputDir, 'DependabotAlertCountReport-Medium')
    const lowAlertCountOutput = new ReportOutputData(countReportHeader, this._outputDir, 'DependabotAlertCountReport-Low')

    for (const repo of repos) {
      try {
        criticalAlertCountOutput.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.critical.length })
        highAlertCountOutput.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.high.length })
        mediumAlertCountOutput.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.medium.length })
        lowAlertCountOutput.addRow({ repoName: repo.name, count: repo.dependabotScanAlerts?.low.length })

        repo.healthScores[DependabotAlertCountReport.name] = this.grade(repo.dependabotScanAlerts)
      } catch (error) {
        errorHandler(error, DependabotAlertCountReport.name, repo.name)
      }
    }

    this._reportOutputs.push(criticalAlertCountOutput)
    this._reportOutputs.push(highAlertCountOutput)
    this._reportOutputs.push(mediumAlertCountOutput)
    this._reportOutputs.push(lowAlertCountOutput)
  }

  grade (input: DependabotScanAlertBySeverityLevel): HealthScore {
    const criticalScore = input.critical.length * 4
    const highScore = input.high.length * 3
    const mediumScore = input.medium.length * 2
    const lowScore = input.low.length * 1
    const totalScore = criticalScore + highScore + mediumScore + lowScore

    const gradeMinValues: Record<number, Grade> = {
      3: GradeEnum.A,
      6: GradeEnum.B,
      9: GradeEnum.C,
      12: GradeEnum.D,
      [Number.MAX_SAFE_INTEGER]: GradeEnum.F
    }

    for (const minValue in gradeMinValues) {
      if (totalScore < parseInt(minValue)) {
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

  public get name (): string {
    return DependabotAlertCountReport.name
  }
}
