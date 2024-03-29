import {
  GradeEnum,
  type HealthScore,
  type Repo,
  type ScanAlertBySeverityLevel
} from '../../../types'
import { AlertCountReport } from './alertCountReports'

export class SecretScanAlertCountReport extends AlertCountReport {
  protected async runReport (repo: Repo): Promise<void> {
    this._reportWriters.criticalCountWriter.addRow({ repoName: repo.name, count: repo.secretScanAlerts?.critical.length })
    repo.healthScores[SecretScanAlertCountReport.name] = await this.grade(repo.secretScanAlerts)
  }

  async grade (input: ScanAlertBySeverityLevel): Promise<HealthScore> {
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

  public get name (): string {
    return SecretScanAlertCountReport.name
  }
}
