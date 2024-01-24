import {
  Grade,
  GradeEnum, HealthScore,
  type RepoInfo,
  type CodeScanAlertBySeverityLevel
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class CodeScanAlertCountReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const countReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'count', title: 'Count' }
    ]

    const criticalAlertCountWriter = new ReportOutputData(countReportHeader, this._outputDir, 'CodeScanAlertCountReport-Critical')
    const highAlertCountWriter = new ReportOutputData(countReportHeader, this._outputDir, 'CodeScanAlertCountReport-High')
    const mediumAlertCountWriter = new ReportOutputData(countReportHeader, this._outputDir, 'CodeScanAlertCountReport-Medium')
    const lowAlertCountWriter = new ReportOutputData(countReportHeader, this._outputDir, 'CodeScanAlertCountReport-Low')

    for (const repo of repos) {
      try {
        criticalAlertCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.critical.length })
        highAlertCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.high.length })
        mediumAlertCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.medium.length })
        lowAlertCountWriter.addRow({ repoName: repo.name, count: repo.codeScanAlerts?.low.length })

        repo.healthScores[CodeScanAlertCountReport.name] = this.grade(repo.codeScanAlerts)
      } catch (error) {
        errorHandler(error, CodeScanAlertCountReport.name, repo.name)
      }
    }

    this._reportOutputs.push(criticalAlertCountWriter)
    this._reportOutputs.push(highAlertCountWriter)
    this._reportOutputs.push(mediumAlertCountWriter)
    this._reportOutputs.push(lowAlertCountWriter)
  }

  grade (input: CodeScanAlertBySeverityLevel): HealthScore {
    const criticalScore = input.critical.length * 4
    const highScore = input.high.length * 3
    const mediumScore = input.medium.length * 2
    const lowScore = input.low.length
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
    return CodeScanAlertCountReport.name
  }
}
