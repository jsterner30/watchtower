import {
  CodeScanAlert, Grade,
  GradeEnum, HealthScore,
  type RepoInfo,
  type ReportFunction,
  type CodeScanAlertBySeverityLevel
} from '../types'
import { errorHandler } from '../util'
import ReportDataWriter from '../util/reportDataWriter'
import {
  codeScanAlertReportGradeName,
  codeScanAlertReportGradeWeight
} from '../util/constants'

interface ScanAlertReportRow {
  repoName: string
  id: string
  description: string
  locationPath: string
}

const CodeScanReportGrade = (input: CodeScanAlertBySeverityLevel): HealthScore => {
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
        weight: codeScanAlertReportGradeWeight
      }
    }
  }
  return {
    grade: GradeEnum.NotApplicable,
    weight: 0
  }
}

export const codeScanAlertReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const alertReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'id', title: 'ID' },
    { id: 'description', title: 'Description' },
    { id: 'locationPath', title: 'Location Path' }
  ]

  const countReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const criticalAlertWriter = new ReportDataWriter('./data/reports/CodeScanAlerts/CodeScanCriticalAlertReport.csv', alertReportHeader)
  const criticalAlertCountWriter = new ReportDataWriter('./data/reports/CodeScanAlertsCount/CodeScanCriticalAlertCountReport.csv', countReportHeader)
  const highAlertWriter = new ReportDataWriter('./data/reports/CodeScanAlerts/CodeScanHighAlertReport.csv', alertReportHeader)
  const highAlertCountWriter = new ReportDataWriter('./data/reports/CodeScanAlertsCount/CodeScanHighAlertCountReport.csv', countReportHeader)
  const mediumAlertWriter = new ReportDataWriter('./data/reports/CodeScanAlerts/CodeScanMediumAlertReport.csv', alertReportHeader)
  const mediumAlertCountWriter = new ReportDataWriter('./data/reports/CodeScanAlertsCount/CodeScanMediumAlertCountReport.csv', countReportHeader)
  const lowAlertWriter = new ReportDataWriter('./data/reports/CodeScanAlerts/CodeScanLowAlertReport.csv', alertReportHeader)
  const lowAlertCountWriter = new ReportDataWriter('./data/reports/CodeScanAlertsCount/CodeScanLowAlertCountReport.csv', countReportHeader)

  for (const repo of repos) {
    try {
      criticalAlertWriter.data.push(...getCsvData(repo.codeScanAlerts?.critical, repo.name))
      criticalAlertCountWriter.data.push({ repoName: repo.name, count: repo.codeScanAlerts?.critical.length })

      highAlertWriter.data.push(...getCsvData(repo.codeScanAlerts?.high, repo.name))
      highAlertCountWriter.data.push({ repoName: repo.name, count: repo.codeScanAlerts?.high.length })

      mediumAlertWriter.data.push(...getCsvData(repo.codeScanAlerts?.medium, repo.name))
      mediumAlertCountWriter.data.push({ repoName: repo.name, count: repo.codeScanAlerts?.medium.length })

      lowAlertWriter.data.push(...getCsvData(repo.codeScanAlerts?.low, repo.name))
      lowAlertCountWriter.data.push({ repoName: repo.name, count: repo.codeScanAlerts?.low.length })

      repo.healthScores[codeScanAlertReportGradeName] = CodeScanReportGrade(repo.codeScanAlerts)
    } catch (error) {
      errorHandler(error, codeScanAlertReport.name, repo.name)
    }
  }
  await criticalAlertWriter.write()
  await criticalAlertCountWriter.write()
  await highAlertWriter.write()
  await highAlertCountWriter.write()
  await mediumAlertWriter.write()
  await mediumAlertCountWriter.write()
  await lowAlertWriter.write()
  await lowAlertCountWriter.write()
}

function getCsvData (alerts: CodeScanAlert[], repoName: string): ScanAlertReportRow[] {
  const rows: ScanAlertReportRow[] = []
  for (const alert of alerts) {
    rows.push({
      repoName,
      id: alert.rule.id,
      description: alert.rule.description,
      locationPath: alert.mostRecentInstance.locationPath
    })
  }
  return rows
}
