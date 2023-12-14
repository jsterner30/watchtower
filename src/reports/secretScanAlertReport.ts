import {
  GradeEnum, HealthScore,
  type RepoInfo,
  type ReportFunction,
  SecretScanAlertBySeverityLevel,
  SecretScanAlert
} from '../types'
import { errorHandler } from '../util'
import ReportDataWriter from '../util/reportDataWriter'
import {
  secretAlertReportGradeName,
  secretAlertReportGradeWeight
} from '../util/constants'

interface SecretAlertReportRow {
  repoName: string
  secretType: string
  secret: string
}

const dependabotAlertReportGrade = (input: SecretScanAlertBySeverityLevel): HealthScore => {
  if (input.critical.length === 0) {
    return {
      grade: GradeEnum.A,
      weight: secretAlertReportGradeWeight
    }
  } else {
    return {
      grade: GradeEnum.F,
      weight: secretAlertReportGradeWeight
    }
  }
}

export const secretScanAlertReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const alertReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'secretType', title: 'Secret Type' },
    { id: 'secret', title: 'Secret' }
  ]

  const countReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const secretAlertWriter = new ReportDataWriter('./data/reports/SecretAlerts/SecretAlertReport.csv', alertReportHeader)
  const secretAlertCountWriter = new ReportDataWriter('./data/reports/SecretAlertsCount/SecretAlertCountReport.csv', countReportHeader)

  for (const repo of repos) {
    try {
      secretAlertWriter.data.push(...getCsvData(repo.secretScanAlerts?.critical, repo.name))
      secretAlertCountWriter.data.push({ repoName: repo.name, count: repo.secretScanAlerts?.critical.length })

      repo.healthScores[secretAlertReportGradeName] = dependabotAlertReportGrade(repo.secretScanAlerts)
    } catch (error) {
      errorHandler(error, secretScanAlertReport.name, repo.name)
    }
  }
  await secretAlertWriter.write()
  await secretAlertCountWriter.write()
}

function getCsvData (alerts: SecretScanAlert[], repoName: string): SecretAlertReportRow[] {
  const rows: SecretAlertReportRow[] = []
  for (const alert of alerts) {
    rows.push({
      repoName,
      secretType: alert.secretType,
      secret: alert.secret
    })
  }
  return rows
}
