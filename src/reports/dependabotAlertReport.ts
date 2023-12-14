import {
  DependabotAlert, Grade,
  GradeEnum, HealthScore,
  type RepoInfo,
  type ReportFunction,
  type DependabotScanAlertBySeverityLevel
} from '../types'
import { errorHandler } from '../util'
import ReportDataWriter from '../util/reportDataWriter'
import {
  dependabotAlertReportGradeName,
  dependabotAlertReportGradeWeight
} from '../util/constants'

interface DependabotAlertReportRow {
  repoName: string
  dependencyName: string
  dependencyEcosystem: string
  summary: string
  description: string
}

const dependabotAlertReportGrade = (input: DependabotScanAlertBySeverityLevel): HealthScore => {
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
        weight: dependabotAlertReportGradeWeight
      }
    }
  }
  return {
    grade: GradeEnum.NotApplicable,
    weight: 0
  }
}

export const dependabotAlertReport: ReportFunction = async (repos: RepoInfo[]): Promise<void> => {
  const alertReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'dependencyName', title: 'Dependency Name' },
    { id: 'dependencyEcosystem', title: 'Dependency Ecosystem' },
    { id: 'summary', title: 'Summary' },
    { id: 'description', title: 'Description' }
  ]

  const countReportHeader = [
    { id: 'repoName', title: 'Repo' },
    { id: 'count', title: 'Count' }
  ]

  const criticalAlertWriter = new ReportDataWriter('./data/reports/DependabotAlerts/DependabotCriticalAlertReport.csv', alertReportHeader)
  const criticalAlertCountWriter = new ReportDataWriter('./data/reports/DependabotAlertsCount/DependabotCriticalAlertCountReport.csv', countReportHeader)
  const highAlertWriter = new ReportDataWriter('./data/reports/DependabotAlerts/DependabotHighAlertReport.csv', alertReportHeader)
  const highAlertCountWriter = new ReportDataWriter('./data/reports/DependabotAlertsCount/DependabotHighAlertCountReport.csv', countReportHeader)
  const mediumAlertWriter = new ReportDataWriter('./data/reports/DependabotAlerts/DependabotMediumAlertReport.csv', alertReportHeader)
  const mediumAlertCountWriter = new ReportDataWriter('./data/reports/DependabotAlertsCount/DependabotMediumAlertCountReport.csv', countReportHeader)
  const lowAlertWriter = new ReportDataWriter('./data/reports/DependabotAlerts/DependabotLowAlertReport.csv', alertReportHeader)
  const lowAlertCountWriter = new ReportDataWriter('./data/reports/DependabotAlertsCount/DependabotLowAlertCountReport.csv', countReportHeader)

  for (const repo of repos) {
    try {
      criticalAlertWriter.data.push(...getCsvData(repo.dependabotScanAlerts?.critical, repo.name))
      criticalAlertCountWriter.data.push({ repoName: repo.name, count: repo.dependabotScanAlerts?.critical.length })

      highAlertWriter.data.push(...getCsvData(repo.dependabotScanAlerts?.high, repo.name))
      highAlertCountWriter.data.push({ repoName: repo.name, count: repo.dependabotScanAlerts?.high.length })

      mediumAlertWriter.data.push(...getCsvData(repo.dependabotScanAlerts?.medium, repo.name))
      mediumAlertCountWriter.data.push({ repoName: repo.name, count: repo.dependabotScanAlerts?.medium.length })

      lowAlertWriter.data.push(...getCsvData(repo.dependabotScanAlerts?.low, repo.name))
      lowAlertCountWriter.data.push({ repoName: repo.name, count: repo.dependabotScanAlerts?.low.length })

      repo.healthScores[dependabotAlertReportGradeName] = dependabotAlertReportGrade(repo.dependabotScanAlerts)
    } catch (error) {
      errorHandler(error, dependabotAlertReport.name, repo.name)
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

function getCsvData (alerts: DependabotAlert[], repoName: string): DependabotAlertReportRow[] {
  const rows: DependabotAlertReportRow[] = []
  for (const alert of alerts) {
    rows.push({
      repoName,
      dependencyName: alert.dependencyName,
      dependencyEcosystem: alert.dependencyEcosystem,
      summary: alert.summary,
      description: alert.description
    })
  }
  return rows
}
