import {
  GradeEnum, HealthScore,
  type RepoInfo,
  SecretScanAlertBySeverityLevel
} from '../../types'
import { errorHandler, ReportOutputData } from '../../util'
import { Report } from '../report'

export class SecretScanAlertCountReport extends Report {
  async run (repos: RepoInfo[]): Promise<void> {
    const countReportHeader = [
      { id: 'repoName', title: 'Repo' },
      { id: 'count', title: 'Count' }
    ]

    const secretAlertCountOutput = new ReportOutputData(countReportHeader, this._outputDir, 'SecretAlertCountReport')

    for (const repo of repos) {
      try {
        secretAlertCountOutput.addRow({ repoName: repo.name, count: repo.secretScanAlerts?.critical.length })
        repo.healthScores[SecretScanAlertCountReport.name] = this.grade(repo.secretScanAlerts)
      } catch (error) {
        errorHandler(error, SecretScanAlertCountReport.name, repo.name)
      }
    }

    this._reportOutputs.push(secretAlertCountOutput)
  }

  grade (input: SecretScanAlertBySeverityLevel): HealthScore {
    if (input.critical.length === 0) {
      return {
        grade: GradeEnum.A,
        weight: this._weight
      }
    } else {
      return {
        grade: GradeEnum.F,
        weight: this._weight
      }
    }
  }
}
